import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { retrieveClinicalEvidence } from "@/lib/ai/rag";
import { createToken } from "@/lib/queue/engine";
import { sanitizeText } from "@/lib/security/sanitize";
import { checkTokenCreationRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, language = "hi", vitals = {} } = body;

    const cleanComplaint = sanitizeText(transcript);
    if (!cleanComplaint) {
      return NextResponse.json(
        {
          success: false,
          error: language === "hi" ? "आवाज़ सुनाई नहीं दी, कृपया दोबारा बोलें" : "No speech detected. Please speak again.",
        },
        { status: 400 }
      );
    }

    // IP Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const rateLimit = checkTokenCreationRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Maximum 2 token creations per 15 minutes per IP.",
        },
        { status: 429 }
      );
    }

    // 1. Run Grounded Clinical RAG Evaluation
    const guidance = await retrieveClinicalEvidence(cleanComplaint, vitals);

    // 2. Locate Best Matching Active Queue
    const activeQueues = await prisma.queue.findMany({
      where: { status: "ACTIVE" },
      orderBy: { code: "asc" },
    });

    if (activeQueues.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active consultation queues available." },
        { status: 503 }
      );
    }

    // Match queue by department or code (A for Emergency, B for Urgent, C for Standard)
    let selectedQueue = activeQueues.find(
      (q) =>
        q.department.toUpperCase() === guidance.departmentType.toUpperCase() ||
        q.name.toUpperCase().includes(guidance.departmentType.replace("_", " "))
    );

    if (!selectedQueue) {
      if (guidance.triageLevel === "LEVEL_1_RESUSCITATION" || guidance.triageLevel === "LEVEL_2_EMERGENT") {
        selectedQueue = activeQueues.find((q) => q.code === "A") || activeQueues[0];
      } else if (guidance.triageLevel === "LEVEL_3_URGENT") {
        selectedQueue = activeQueues.find((q) => q.code === "B") || activeQueues[0];
      } else {
        selectedQueue = activeQueues.find((q) => q.code === "C") || activeQueues[0];
      }
    }

    // 3. Create Token with Embedded RAG Clinical Metadata
    const sessionId = `sess_voice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const enrichedVitalSigns = {
      ...(vitals || {}),
      ragClinical: {
        citedProtocolId: guidance.citedProtocolId,
        protocolTitle: guidance.protocolTitle,
        clinicalRationale: guidance.clinicalRationale,
        redFlags: guidance.redFlags,
        immediateActions: guidance.immediateActions,
        differentialConsiderations: guidance.differentialConsiderations,
        anticipatedOrders: guidance.anticipatedOrders,
        precautions: guidance.precautions,
        patientVoiceScript: guidance.patientVoiceScript,
      },
    };

    const patientName = language === "hi" ? "मरीज़ (वॉयस इनटेक)" : "Patient (Voice Intake)";

    const token = await createToken({
      queueId: selectedQueue.id,
      visitorSessionId: sessionId,
      visitorName: patientName,
      purpose: cleanComplaint,
      chiefComplaint: cleanComplaint,
      vitalSigns: enrichedVitalSigns,
      triageLevel: guidance.triageLevel,
      riskFlags: guidance.redFlags,
      targetDepartment: guidance.departmentType,
      currentStage: "TRIAGE_INTAKE",
    });

    // 4. Synthesize Friendly Spoken Audio Script
    const chosenLang = language === "hi" ? "hi" : "en";
    const spokenScript =
      chosenLang === "hi"
        ? `आपका टोकन नंबर ${token.displayNumber} है। यह ${selectedQueue.name} के लिए जारी किया गया है। ${guidance.patientVoiceScript.hi}`
        : `Your token number is ${token.displayNumber} for ${selectedQueue.name}. ${guidance.patientVoiceScript.en}`;

    const response = NextResponse.json({
      success: true,
      token,
      queue: selectedQueue,
      guidance,
      spokenScript,
      language: chosenLang,
    });

    response.cookies.set("lq_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err: any) {
    console.error("Voice Intake API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process voice intake" },
      { status: 500 }
    );
  }
}
