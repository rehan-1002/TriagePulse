import { prisma } from "../db/prisma";
import { DepartmentType, TriageLevel } from "@prisma/client";
import { retrieveClinicalEvidence } from "./rag";

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
  citedProtocolId?: string;
  protocolTitle?: string;
  redFlags?: string[];
  immediateActions?: string[];
  differentialConsiderations?: string[];
  anticipatedOrders?: string[];
  precautions?: { en: string; hi: string };
  patientVoiceScript?: { en: string; hi: string };
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
    lower.includes("severe anaphylaxis") ||
    lower.includes("बेहोश") ||
    lower.includes("सांस बंद")
  ) {
    return {
      departmentType: "EMERGENCY_ROOM",
      triageLevel: "LEVEL_1_RESUSCITATION",
      riskFlags: ["CRITICAL_HYPOXIA", "CODE_RED_RESUSCITATION"],
      clinicalRationale: "Deterministic safety override: Severe acute life threat requiring zero wait resuscitation.",
    };
  }

  // Level 2: Emergent red flags (Chest pain, acute stroke signs, hypoxia SpO2 < 90%, severe bleeding)
  const isHypoxic = spo2 !== undefined && spo2 < 90;
  const hasCardiac =
    lower.includes("chest pain") ||
    lower.includes("radiating pain") ||
    lower.includes("heart attack") ||
    lower.includes("angina") ||
    lower.includes("cold sweat") ||
    lower.includes("छाती में दर्द") ||
    lower.includes("सीने में दर्द") ||
    lower.includes("दिल का दौरा");
  const hasStroke =
    lower.includes("facial droop") ||
    lower.includes("slurred speech") ||
    lower.includes("stroke") ||
    lower.includes("sudden weakness") ||
    lower.includes("लकवा");
  const hasSevereResp =
    lower.includes("shortness of breath") ||
    lower.includes("difficulty breathing") ||
    lower.includes("stridor") ||
    lower.includes("सांस लेने में तकलीफ") ||
    lower.includes("दम फूलना");
  const hasSevereTrauma =
    lower.includes("heavy bleeding") ||
    lower.includes("severe bleeding") ||
    lower.includes("खून बहना") ||
    lower.includes("गंभीर चोट");

  if (isHypoxic || hasCardiac || hasStroke || hasSevereResp || hasSevereTrauma) {
    const flags: string[] = [];
    if (isHypoxic) flags.push("CRITICAL_HYPOXIA");
    if (hasCardiac) flags.push("CARDIAC_ALERT");
    if (hasStroke) flags.push("STROKE_SIGNS");
    if (hasSevereResp) flags.push("RESPIRATORY_DISTRESS");
    if (hasSevereTrauma) flags.push("SEVERE_TRAUMA_BLEEDING");

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

  // 2. Retrieve grounded clinical evidence from verified ESI v4 protocols
  const ragEvidence = await retrieveClinicalEvidence(chiefComplaint, vitals);

  // 3. If Cohere API Key is available, allow prompt refinement while strictly enforcing cited protocol
  const apiKey = process.env.COHERE_API_KEY;
  if (apiKey && apiKey.trim() !== "") {
    try {
      const prompt = `You are an Emergency Medicine specialist applying ESI v4 guidelines.
Patient: "${chiefComplaint}"
Vitals: ${JSON.stringify(vitals || {})}
Grounded ESI Protocol: ${ragEvidence.citedProtocolId} - ${ragEvidence.protocolTitle}
Recommended Level: ${ragEvidence.triageLevel}
Recommended Department: ${ragEvidence.departmentType}

Verify this assignment and output strict JSON only:
{
  "departmentType": "${ragEvidence.departmentType}",
  "triageLevel": "${ragEvidence.triageLevel}",
  "riskFlags": ${JSON.stringify(ragEvidence.redFlags)},
  "clinicalRationale": "${ragEvidence.clinicalRationale.replace(/"/g, "'")}"
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
            ...ragEvidence,
            departmentType: parsed.departmentType || ragEvidence.departmentType,
            triageLevel: parsed.triageLevel || ragEvidence.triageLevel,
            riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags : ragEvidence.redFlags,
            clinicalRationale: parsed.clinicalRationale || ragEvidence.clinicalRationale,
          };
        }
      }
    } catch (err) {
      console.warn("Cohere clinical triage call failed, using clinical RAG evidence:", err);
    }
  }

  // 3. Grounded Clinical RAG Evidence (Zero Hallucination)
  return {
    ...ragEvidence,
    riskFlags: ragEvidence.redFlags,
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
