import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createToken } from "@/lib/queue/engine";
import { HOSPITALS, getHospitalById } from "@/lib/hospitals/data";
import { realtimeBus } from "@/lib/realtime/events";
import { TriageLevel, DepartmentType } from "@prisma/client";

export const dynamic = "force-dynamic";

const MOCK_PATIENT_NAMES = [
  "Ramesh Kumar", "Sunita Sharma", "Mohammed Faizan", "Pooja Verma",
  "Gurpreet Singh", "Anita Devi", "Vikram Malhotra", "Meena Joshi",
  "Arjun Nair", "Kavita Rao", "Deepak Gupta", "Sunil Yadav",
  "Fatima Begum", "Harish Patel", "Preeti Tiwari", "Rohit Choudhary"
];

const EMERGENCY_COMPLAINTS = [
  {
    complaint: "Acute substernal crushing chest pain radiating to left arm with cold sweats",
    triageLevel: "LEVEL_1_RESUSCITATION" as TriageLevel,
    vitals: { hr: 128, bp: "85/55", spo2: 88, temp: 98.4 },
    department: "EMERGENCY_ROOM" as DepartmentType,
    preferredCode: "ED",
  },
  {
    complaint: "Severe acute breathlessness with audible wheeze and cyanosis",
    triageLevel: "LEVEL_2_EMERGENT" as TriageLevel,
    vitals: { hr: 115, bp: "140/90", spo2: 89, temp: 99.1 },
    department: "EMERGENCY_ROOM" as DepartmentType,
    preferredCode: "ED",
  },
  {
    complaint: "Head injury following road accident with brief loss of consciousness",
    triageLevel: "LEVEL_2_EMERGENT" as TriageLevel,
    vitals: { hr: 98, bp: "135/85", spo2: 97, temp: 98.6 },
    department: "TRIAGE_DESK" as DepartmentType,
    preferredCode: "TR",
  },
];

const OPD_COMPLAINTS = [
  {
    complaint: "High grade fever for 4 days with body aches and chills",
    triageLevel: "LEVEL_3_URGENT" as TriageLevel,
    vitals: { hr: 94, bp: "120/80", spo2: 98, temp: 102.4 },
    department: "GENERAL_OPD" as DepartmentType,
    preferredCode: "OPD",
  },
  {
    complaint: "Chronic bilateral knee pain with morning stiffness for 3 months",
    triageLevel: "LEVEL_5_NON_URGENT" as TriageLevel,
    vitals: { hr: 72, bp: "125/82", spo2: 99, temp: 98.2 },
    department: "GENERAL_OPD" as DepartmentType,
    preferredCode: "OPD",
  },
  {
    complaint: "Persistent dry cough and throat irritation for 2 weeks",
    triageLevel: "LEVEL_4_LESS_URGENT" as TriageLevel,
    vitals: { hr: 78, bp: "118/76", spo2: 98, temp: 98.6 },
    department: "GENERAL_OPD" as DepartmentType,
    preferredCode: "OPD",
  },
  {
    complaint: "Routine fasting blood sugar and lipid profile test referral",
    triageLevel: "LEVEL_5_NON_URGENT" as TriageLevel,
    vitals: { hr: 70, bp: "130/84", spo2: 99, temp: 98.0 },
    department: "PATHOLOGY_LAB" as DepartmentType,
    preferredCode: "DX",
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action = "surge",
      hospitalId = "aiims-delhi",
      patientCount = 5,
      surgeType = "mixed", // "opd_rush" | "emergency_mass" | "mixed"
    } = body;

    const hospital = getHospitalById(hospitalId);

    // Fetch available queues
    const queues = await prisma.queue.findMany({
      where: { status: "ACTIVE" },
    });

    if (queues.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active clinical queues found in database" },
        { status: 400 }
      );
    }

    if (action === "emergency_resus") {
      // Instant Level-1 Emergency Resuscitation Injection
      const edQueue = queues.find((q) => q.code === "ED") || queues[0];
      const patientName = MOCK_PATIENT_NAMES[Math.floor(Math.random() * MOCK_PATIENT_NAMES.length)];
      const complaintData = EMERGENCY_COMPLAINTS[0];

      const token = await createToken({
        queueId: edQueue.id,
        visitorSessionId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        visitorName: `${patientName} [${hospital.code}]`,
        purpose: complaintData.complaint,
        chiefComplaint: complaintData.complaint,
        vitalSigns: complaintData.vitals,
        triageLevel: complaintData.triageLevel,
        currentStage: "TRIAGE_INTAKE",
        targetDepartment: complaintData.department,
        riskFlags: ["RED_FLAG_HYPOXEMIA", "ACUTE_CORONARY_RISK"],
      });

      return NextResponse.json({
        success: true,
        message: `🚨 Emergency Resuscitation Case injected at ${hospital.name}`,
        hospital: hospital.name,
        token: {
          displayNumber: token.displayNumber,
          priority: token.priority,
          triageLevel: token.triageLevel,
        },
      });
    }

    if (action === "load_balance") {
      // Inter-hospital load balancing diversion
      const targetHospital = HOSPITALS.find((h) => h.id !== hospitalId && h.currentWaitMin < hospital.currentWaitMin) || HOSPITALS[1];
      const divertedCount = Math.min(6, Math.max(2, Math.floor(patientCount)));

      return NextResponse.json({
        success: true,
        message: `🔀 Smart Load Balancer: Diverted ${divertedCount} low-acuity cases from ${hospital.shortName} to ${targetHospital.name}`,
        sourceHospital: hospital.name,
        targetHospital: targetHospital.name,
        divertedPatients: divertedCount,
        estimatedTimeSavedMin: Math.max(10, hospital.currentWaitMin - targetHospital.currentWaitMin),
      });
    }

    // Default: Batch Surge simulation
    const createdTokens = [];
    const countToSpawn = Math.min(15, Math.max(1, patientCount));

    for (let i = 0; i < countToSpawn; i++) {
      let pool = OPD_COMPLAINTS;
      if (surgeType === "emergency_mass") {
        pool = EMERGENCY_COMPLAINTS;
      } else if (surgeType === "mixed") {
        pool = i % 3 === 0 ? EMERGENCY_COMPLAINTS : OPD_COMPLAINTS;
      }

      const template = pool[Math.floor(Math.random() * pool.length)];
      const patientName = MOCK_PATIENT_NAMES[(i + Math.floor(Math.random() * 10)) % MOCK_PATIENT_NAMES.length];

      // Match target queue
      const targetQueue = queues.find((q) => q.code === template.preferredCode) || queues[0];

      try {
        const token = await createToken({
          queueId: targetQueue.id,
          visitorSessionId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          visitorName: `${patientName} [${hospital.code}]`,
          purpose: template.complaint,
          chiefComplaint: template.complaint,
          vitalSigns: template.vitals,
          triageLevel: template.triageLevel,
          currentStage: "TRIAGE_INTAKE",
          targetDepartment: template.department,
          riskFlags: template.triageLevel === "LEVEL_1_RESUSCITATION" ? ["CRITICAL_CARE_URGENT"] : [],
        });

        createdTokens.push({
          id: token.id,
          displayNumber: token.displayNumber,
          visitorName: token.visitorName,
          triageLevel: token.triageLevel,
          queueCode: targetQueue.code,
        });
      } catch (err) {
        console.warn("Simulation token spawn warning:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Simulated surge of ${createdTokens.length} patients at ${hospital.name}`,
      hospital: hospital.name,
      tokensCreated: createdTokens.length,
      sampleTokens: createdTokens.slice(0, 4),
    });
  } catch (err: any) {
    console.error("Simulation error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Simulation failed" },
      { status: 500 }
    );
  }
}
