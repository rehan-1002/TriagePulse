import { prisma } from "../db/prisma";
import { DepartmentType, TriageLevel } from "@prisma/client";

export interface VitalSignsInput {
  spo2?: number;
  hr?: number;
  systolicBp?: number;
  diastolicBp?: number;
  temp?: number;
}

export interface ClinicalTriageResult {
  departmentType: DepartmentType;
  triageLevel: TriageLevel;
  riskFlags: string[];
  clinicalRationale: string;
}

export interface RoutingSuggestion {
  queueId: string;
  queueName: string;
  queueCode: string;
  confidence: number;
  reasoning: string;
  triageLevel?: TriageLevel;
  departmentType?: DepartmentType;
  riskFlags?: string[];
}

/**
 * Deterministic Clinical Safety Gate
 * Immediately escalates high-risk red-flag complaints and critical vitals.
 */
export function checkDeterministicOverrides(
  chiefComplaint: string,
  vitals?: VitalSignsInput
): ClinicalTriageResult | null {
  const lower = (chiefComplaint || "").toLowerCase();
  const spo2 = vitals?.spo2;

  // Level 1: Immediate life threat (Severe hypoxia, respiratory arrest, anaphylaxis)
  if (
    (spo2 !== undefined && spo2 < 88) ||
    lower.includes("unresponsive") ||
    lower.includes("cardiac arrest") ||
    lower.includes("not breathing") ||
    lower.includes("severe anaphylaxis")
  ) {
    return {
      departmentType: "EMERGENCY_ROOM",
      triageLevel: "LEVEL_1_RESUSCITATION",
      riskFlags: ["CRITICAL_HYPOXIA", "CODE_RED_RESUSCITATION"],
      clinicalRationale: "Deterministic safety override: Severe acute life threat requiring zero wait resuscitation.",
    };
  }

  // Level 2: Emergent red flags (Chest pain, acute stroke signs, hypoxia SpO2 < 90%)
  const isHypoxic = spo2 !== undefined && spo2 < 90;
  const hasCardiac =
    lower.includes("chest pain") ||
    lower.includes("radiating pain") ||
    lower.includes("heart attack") ||
    lower.includes("angina") ||
    lower.includes("cold sweat");
  const hasStroke =
    lower.includes("facial droop") ||
    lower.includes("slurred speech") ||
    lower.includes("stroke") ||
    lower.includes("sudden weakness");
  const hasSevereResp =
    lower.includes("shortness of breath") ||
    lower.includes("difficulty breathing") ||
    lower.includes("stridor");

  if (isHypoxic || hasCardiac || hasStroke || hasSevereResp) {
    const flags: string[] = [];
    if (isHypoxic) flags.push("CRITICAL_HYPOXIA");
    if (hasCardiac) flags.push("CARDIAC_ALERT");
    if (hasStroke) flags.push("STROKE_SIGNS");
    if (hasSevereResp) flags.push("RESPIRATORY_DISTRESS");

    return {
      departmentType: "EMERGENCY_ROOM",
      triageLevel: "LEVEL_2_EMERGENT",
      riskFlags: flags,
      clinicalRationale: `Deterministic clinical safety trigger: High-risk red flags identified (${flags.join(", ")}). Direct escalation to Emergency Room.`,
    };
  }

  return null;
}

/**
 * Classify Patient Symptoms into ESI v4 Level & Clinical Department
 */
export async function classifyPatientSymptoms(
  chiefComplaint: string,
  vitals?: VitalSignsInput
): Promise<ClinicalTriageResult> {
  // 1. Check deterministic safety overrides first
  const safetyOverride = checkDeterministicOverrides(chiefComplaint, vitals);
  if (safetyOverride) {
    return safetyOverride;
  }

  // 2. Call Cohere LLM if API Key is configured
  const apiKey = process.env.COHERE_API_KEY;
  if (apiKey && apiKey.trim() !== "") {
    try {
      const prompt = `You are a certified emergency triage physician applying the Emergency Severity Index (ESI v4).
Patient Complaint: "${chiefComplaint}"
Vital Signs: ${JSON.stringify(vitals || {})}

Classify the clinical priority and appropriate hospital department.
Departments allowed:
- "TRIAGE_DESK" (General intake, vitals checking)
- "EMERGENCY_ROOM" (Life-threat, severe trauma, emergent)
- "GENERAL_OPD" (Standard medical consultation)
- "CARDIOLOGY" (Subacute cardiac, hypertension consult)
- "ORTHOPEDICS" (Bone, joint, muscular, sprains)
- "PATHOLOGY_LAB" (Blood work, specimens)
- "RADIOLOGY_SCAN" (X-Ray, CT, Ultrasound)
- "CENTRAL_PHARMACY" (Prescription dispense, drug refills)

Triage Levels allowed:
- "LEVEL_1_RESUSCITATION"
- "LEVEL_2_EMERGENT"
- "LEVEL_3_URGENT" (Stable, requires 2+ resources)
- "LEVEL_4_LESS_URGENT" (Stable, requires 1 resource)
- "LEVEL_5_NON_URGENT" (Routine, prescription refill)

Output strict JSON only:
{
  "departmentType": "GENERAL_OPD",
  "triageLevel": "LEVEL_3_URGENT",
  "riskFlags": ["FEBRILE"],
  "clinicalRationale": "Short justification"
}`;

      const response = await fetch("https://api.cohere.com/v1/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.text || json.message?.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            departmentType: parsed.departmentType || "GENERAL_OPD",
            triageLevel: parsed.triageLevel || "LEVEL_4_LESS_URGENT",
            riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags : [],
            clinicalRationale: parsed.clinicalRationale || "Categorized via ESI protocol.",
          };
        }
      }
    } catch (err) {
      console.warn("Cohere clinical triage call failed, using clinical heuristic fallback:", err);
    }
  }

  // 3. Clinical Heuristic Fallback
  const lower = (chiefComplaint || "").toLowerCase();

  // Orthopedics / Musculoskeletal
  if (
    lower.includes("fracture") ||
    lower.includes("sprain") ||
    lower.includes("twisted") ||
    lower.includes("bone") ||
    lower.includes("joint") ||
    lower.includes("ankle") ||
    lower.includes("wrist")
  ) {
    return {
      departmentType: "ORTHOPEDICS",
      triageLevel: "LEVEL_4_LESS_URGENT",
      riskFlags: ["ISOLATED_EXTREMITY"],
      clinicalRationale: "Isolated musculoskeletal complaint requiring single diagnostic resource.",
    };
  }

  // Pharmacy / Refill
  if (
    lower.includes("refill") ||
    lower.includes("prescription") ||
    lower.includes("medication") ||
    lower.includes("tablets") ||
    lower.includes("routine checkup")
  ) {
    return {
      departmentType: "CENTRAL_PHARMACY",
      triageLevel: "LEVEL_5_NON_URGENT",
      riskFlags: [],
      clinicalRationale: "Medication refill or administrative checkup without acute complaints.",
    };
  }

  // Diagnostic Labs / Imaging
  if (lower.includes("blood test") || lower.includes("lab") || lower.includes("sample") || lower.includes("cbc")) {
    return {
      departmentType: "PATHOLOGY_LAB",
      triageLevel: "LEVEL_4_LESS_URGENT",
      riskFlags: [],
      clinicalRationale: "Laboratory diagnostic request.",
    };
  }

  if (lower.includes("x-ray") || lower.includes("xray") || lower.includes("scan") || lower.includes("ultrasound")) {
    return {
      departmentType: "RADIOLOGY_SCAN",
      triageLevel: "LEVEL_4_LESS_URGENT",
      riskFlags: [],
      clinicalRationale: "Radiological imaging referral.",
    };
  }

  // Cardiology subacute
  if (lower.includes("palpitations") || lower.includes("bp check") || lower.includes("hypertension")) {
    return {
      departmentType: "CARDIOLOGY",
      triageLevel: "LEVEL_3_URGENT",
      riskFlags: ["CARDIAC_MONITOR"],
      clinicalRationale: "Subacute cardiovascular symptoms warranting cardiology evaluation.",
    };
  }

  // Multi-resource abdominal / systemic urgent
  if (
    lower.includes("abdominal pain") ||
    lower.includes("stomach pain") ||
    lower.includes("fever") ||
    lower.includes("vomiting") ||
    lower.includes("infection")
  ) {
    return {
      departmentType: "GENERAL_OPD",
      triageLevel: "LEVEL_3_URGENT",
      riskFlags: lower.includes("fever") ? ["FEBRILE"] : [],
      clinicalRationale: "Systemic symptoms likely requiring multiple hospital resources (labs, consult).",
    };
  }

  // Standard General Outpatient consult
  return {
    departmentType: "GENERAL_OPD",
    triageLevel: "LEVEL_4_LESS_URGENT",
    riskFlags: [],
    clinicalRationale: "Standard outpatient consultation without acute instability.",
  };
}

/**
 * Backward compatibility wrapper for existing frontend and AI triage API routes
 */
export async function triageVisitorIntent(userPrompt: string): Promise<RoutingSuggestion[]> {
  const triage = await classifyPatientSymptoms(userPrompt);
  const queues = await prisma.queue.findMany({ where: { status: "ACTIVE" } });

  if (queues.length === 0) return [];

  // Match target department to existing queues
  const matchedQueue =
    queues.find((q) => q.department === triage.departmentType) ||
    queues.find((q) => q.department.includes(triage.departmentType.split("_")[0])) ||
    queues[0];

  return [
    {
      queueId: matchedQueue.id,
      queueName: matchedQueue.name,
      queueCode: matchedQueue.code,
      confidence: 0.95,
      reasoning: `${triage.triageLevel}: ${triage.clinicalRationale}`,
      triageLevel: triage.triageLevel,
      departmentType: triage.departmentType,
      riskFlags: triage.riskFlags,
    },
  ];
}
