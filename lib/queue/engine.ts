import { prisma } from "../db/prisma";
import { realtimeBus } from "../realtime/events";
import { calculateEstimatedWaitTime } from "../eta/calculator";
import { TriageLevel, CareStage, DepartmentType } from "@prisma/client";

/**
 * Acuity Weights (W_acuity) Constants based on Emergency Severity Index (ESI)
 */
export const ACUITY_WEIGHTS: Record<TriageLevel, number> = {
  LEVEL_1_RESUSCITATION: 1000000,
  LEVEL_2_EMERGENT: 50000,
  LEVEL_3_URGENT: 5000,
  LEVEL_4_LESS_URGENT: 500,
  LEVEL_5_NON_URGENT: 50,
};

/**
 * Starvation Multipliers (K_starve) per elapsed minute of waiting
 */
export const STARVATION_RATES: Record<TriageLevel, number> = {
  LEVEL_1_RESUSCITATION: 25,
  LEVEL_2_EMERGENT: 20,
  LEVEL_3_URGENT: 15,
  LEVEL_4_LESS_URGENT: 8,
  LEVEL_5_NON_URGENT: 4,
};

/**
 * Acuity-Time Hybrid Priority Ranking:
 * R = W_acuity + (delta_t * K_starve) + DeteriorationBoost
 */
export function calculatePriorityScore(token: {
  triageLevel?: TriageLevel | string;
  createdAt: Date | string;
  isDeteriorating?: boolean;
}): number {
  const level = (token.triageLevel as TriageLevel) || "LEVEL_5_NON_URGENT";
  const weight = ACUITY_WEIGHTS[level] ?? 50;
  const starveRate = STARVATION_RATES[level] ?? 4;

  const createdTime = new Date(token.createdAt).getTime();
  const elapsedMinutes = Math.max(0, (Date.now() - createdTime) / (1000 * 60));
  const starveScore = elapsedMinutes * starveRate;

  const deteriorationBoost = token.isDeteriorating ? 100000 : 0;

  return weight + starveScore + deteriorationBoost;
}

/**
 * Re-indexes all active WAITING tokens for a given queue in Acuity-Time Hybrid priority order (R).
 * High acuity and deteriorating patients are prioritized, while lower acuity tokens receive starvation boosts.
 */
export async function reindexQueuePositions(db: any = prisma, queueId: string) {
  const client = db || prisma;
  const waitingTokens = await client.token.findMany({
    where: {
      queueId,
      status: "WAITING",
    },
  });

  // Sort tokens by dynamic priority score (R) descending
  waitingTokens.sort((a: any, b: any) => {
    const scoreA = calculatePriorityScore(a);
    const scoreB = calculatePriorityScore(b);
    if (scoreB !== scoreA) {
      return scoreB - scoreA; // Higher score comes first
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  for (let i = 0; i < waitingTokens.length; i++) {
    const token = waitingTokens[i];
    const newPosition = i + 1;
    const elapsedMinutes = (Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60);
    const shouldAlertStarvation =
      elapsedMinutes > 45 &&
      (token.triageLevel === "LEVEL_3_URGENT" ||
        token.triageLevel === "LEVEL_4_LESS_URGENT" ||
        token.triageLevel === "LEVEL_5_NON_URGENT");

    if (token.position !== newPosition || token.starvationAlert !== shouldAlertStarvation) {
      await client.token.update({
        where: { id: token.id },
        data: {
          position: newPosition,
          starvationAlert: shouldAlertStarvation,
        },
      });
      token.position = newPosition;
      token.starvationAlert = shouldAlertStarvation;
    }
  }

  return waitingTokens.length;
}

/**
 * Get active counter count for a queue
 */
export async function getActiveCounterCount(queueId: string): Promise<number> {
  const count = await prisma.counter.count({
    where: {
      OR: [{ queueId }, { queueId: null }],
      status: { in: ["AVAILABLE", "BUSY"] },
    },
  });
  return Math.max(1, count);
}

/**
 * Create a new Token atomically with clinical triage classification
 */
export async function createToken(params: {
  queueId: string;
  visitorSessionId: string;
  visitorName: string;
  purpose?: string;
  chiefComplaint?: string;
  vitalSigns?: any;
  riskFlags?: string[];
  triageLevel?: TriageLevel;
  currentStage?: CareStage;
  targetDepartment?: DepartmentType;
}) {
  const {
    queueId,
    visitorSessionId,
    visitorName,
    purpose,
    chiefComplaint,
    vitalSigns,
    riskFlags = [],
    triageLevel = "LEVEL_5_NON_URGENT",
    currentStage = "TRIAGE_INTAKE",
    targetDepartment = "GENERAL_OPD",
  } = params;

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
  });

  if (!queue) {
    throw new Error("Queue not found");
  }

  if (queue.status !== "ACTIVE") {
    throw new Error("Queue is currently not accepting new tokens");
  }

  // Determine sequence number and waiting count
  const [tokenCount, waitingCount] = await Promise.all([
    prisma.token.count({ where: { queueId } }),
    prisma.token.count({ where: { queueId, status: "WAITING" } }),
  ]);

  const sequenceNumber = tokenCount + 1;
  const displayNumber = `${queue.code}-${String(sequenceNumber).padStart(3, "0")}`;
  const position = waitingCount + 1;
  const isEmergency = triageLevel === "LEVEL_1_RESUSCITATION" || triageLevel === "LEVEL_2_EMERGENT";

  const token = await prisma.token.create({
    data: {
      displayNumber,
      sequenceNumber,
      queueId,
      visitorSessionId,
      visitorName: visitorName || "Patient",
      purpose: purpose || chiefComplaint || "Clinical Consultation",
      chiefComplaint: chiefComplaint || purpose || null,
      vitalSigns: vitalSigns || null,
      riskFlags,
      triageLevel,
      currentStage,
      targetDepartment,
      status: "WAITING",
      position,
      priority: isEmergency ? "EMERGENCY" : "STANDARD",
      lastVitalsCheckAt: new Date(),
    },
    include: {
      queue: true,
    },
  });

  // Re-index queue with acuity weighting
  await reindexQueuePositions(prisma, queueId);

  const finalToken = (await prisma.token.findUnique({
    where: { id: token.id },
    include: { queue: true },
  })) || token;

  // Record audit event asynchronously
  await prisma.tokenEvent.create({
    data: {
      tokenId: finalToken.id,
      queueId: finalToken.queueId,
      eventType: "TOKEN_CREATED",
      actor: visitorName || "PATIENT",
      metadata: JSON.stringify({
        displayNumber,
        position: finalToken.position,
        triageLevel,
        currentStage,
        queueName: queue.name,
      }),
    },
  }).catch((err) => console.error("Event record non-fatal error:", err));

  // Publish Realtime Event
  const activeCounters = await getActiveCounterCount(finalToken.queueId);
  const eta = calculateEstimatedWaitTime({
    position: finalToken.position,
    estimatedServiceTimeMins: finalToken.queue.estimatedServiceTime,
    activeCounterCount: activeCounters,
    triageLevel: finalToken.triageLevel,
    isDeteriorating: finalToken.isDeteriorating,
  });

  realtimeBus.publish("TOKEN_CREATED", {
    tokenId: finalToken.id,
    queueId: finalToken.queueId,
    data: {
      token: {
        id: finalToken.id,
        displayNumber: finalToken.displayNumber,
        position: finalToken.position,
        status: finalToken.status,
        priority: finalToken.priority,
        triageLevel: finalToken.triageLevel,
        currentStage: finalToken.currentStage,
        targetDepartment: finalToken.targetDepartment,
        visitorName: finalToken.visitorName,
        purpose: finalToken.purpose,
        chiefComplaint: finalToken.chiefComplaint,
        vitalSigns: finalToken.vitalSigns,
        riskFlags: finalToken.riskFlags,
        isDeteriorating: finalToken.isDeteriorating,
        starvationAlert: finalToken.starvationAlert,
        queueName: finalToken.queue.name,
        eta,
      },
    },
  });

  return finalToken;
}

/**
 * Call Next Token for a Counter
 */
export async function callNextToken(
  counterId: string,
  operatorName?: string,
  targetQueueId?: string | null,
  specificTokenId?: string
) {
  const counter = await prisma.counter.findUnique({
    where: { id: counterId },
    include: { queue: true },
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  if (counter.status === "PAUSED") {
    throw new Error("Counter is currently paused. Resume counter to call next.");
  }

  let eligibleToken = null;

  if (specificTokenId) {
    eligibleToken = await prisma.token.findUnique({
      where: { id: specificTokenId },
      include: { queue: true },
    });
  } else {
    // Determine effective queue scope
    const effectiveQueueId = targetQueueId !== undefined ? targetQueueId : counter.queueId;

    eligibleToken = await prisma.token.findFirst({
      where: {
        status: "WAITING",
        ...(effectiveQueueId ? { queueId: effectiveQueueId } : {}),
      },
      orderBy: [
        { priority: "desc" },
        { position: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        queue: true,
      },
    });
  }

  if (!eligibleToken) {
    return null;
  }

  // Complete previous token if still serving
  if (counter.currentServingTokenId) {
    await prisma.token.updateMany({
      where: {
        id: counter.currentServingTokenId,
        status: "CALLED",
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  // Claim next token
  const updatedToken = await prisma.token.update({
    where: { id: eligibleToken.id },
    data: {
      status: "CALLED",
      position: 0,
      counterId: counter.id,
      calledAt: new Date(),
    },
    include: {
      queue: true,
    },
  });

  // Update Counter state
  await prisma.counter.update({
    where: { id: counter.id },
    data: {
      status: "BUSY",
      currentServingTokenId: updatedToken.id,
      ...(operatorName ? { operatorName } : {}),
    },
  });

  // Re-index remaining waiting tokens in this queue
  await reindexQueuePositions(prisma, eligibleToken.queueId);

  // Record Event
  await prisma.tokenEvent.create({
    data: {
      tokenId: updatedToken.id,
      queueId: updatedToken.queueId,
      eventType: "TOKEN_CALLED",
      actor: operatorName || counter.operatorName || "OPERATOR",
      metadata: JSON.stringify({
        counterNumber: counter.number,
        counterName: counter.name,
        displayNumber: updatedToken.displayNumber,
        queueName: updatedToken.queue.name,
      }),
    },
  }).catch(() => {});

  // Publish Realtime Event
  realtimeBus.publish("TOKEN_CALLED", {
    tokenId: updatedToken.id,
    queueId: updatedToken.queueId,
    counterId: counter.id,
    data: {
      token: {
        id: updatedToken.id,
        displayNumber: updatedToken.displayNumber,
        visitorName: updatedToken.visitorName,
        status: updatedToken.status,
        queueName: updatedToken.queue.name,
      },
      counter: {
        id: counter.id,
        number: counter.number,
        name: counter.name,
      },
      announcement: `Token ${updatedToken.displayNumber}, please proceed to ${counter.name}.`,
    },
  });

  return { token: updatedToken, counter };
}

/**
 * Cancel a Token
 */
export async function cancelToken(tokenId: string, visitorSessionId?: string) {
  const token = await prisma.token.findUnique({
    where: { id: tokenId },
    include: { queue: true },
  });

  if (!token) {
    throw new Error("Token not found");
  }

  if (visitorSessionId && token.visitorSessionId !== visitorSessionId) {
    throw new Error("Unauthorized to cancel this token");
  }

  if (token.status !== "WAITING") {
    throw new Error(`Cannot cancel token in '${token.status}' state`);
  }

  const updatedToken = await prisma.token.update({
    where: { id: tokenId },
    data: {
      status: "CANCELLED",
      position: 0,
      cancelledAt: new Date(),
    },
    include: { queue: true },
  });

  // Re-index remaining queue
  await reindexQueuePositions(prisma, token.queueId);

  // Record Event
  await prisma.tokenEvent.create({
    data: {
      tokenId: token.id,
      queueId: token.queueId,
      eventType: "TOKEN_CANCELLED",
      actor: token.visitorName || "VISITOR",
      metadata: JSON.stringify({
        displayNumber: token.displayNumber,
        queueName: token.queue.name,
      }),
    },
  }).catch(() => {});

  realtimeBus.publish("TOKEN_CANCELLED", {
    tokenId: token.id,
    queueId: token.queueId,
    data: {
      token: {
        id: token.id,
        displayNumber: token.displayNumber,
        status: token.status,
      },
    },
  });

  return updatedToken;
}

/**
 * Submit an Emergency / Priority Review Request
 */
export async function submitEmergencyRequest(tokenId: string, reason: string) {
  const token = await prisma.token.findUnique({
    where: { id: tokenId },
    include: { emergencyRequest: true, queue: true },
  });

  if (!token) {
    throw new Error("Token not found");
  }

  if (token.status !== "WAITING") {
    throw new Error("Only waiting tokens can request emergency priority");
  }

  if (token.emergencyRequest) {
    throw new Error("An emergency request has already been submitted for this token");
  }

  const emergencyRequest = await prisma.emergencyRequest.create({
    data: {
      tokenId: token.id,
      reason,
      status: "PENDING",
    },
    include: {
      token: {
        include: { queue: true },
      },
    },
  });

  // Record Event
  await prisma.tokenEvent.create({
    data: {
      tokenId: token.id,
      queueId: token.queueId,
      eventType: "EMERGENCY_REQUESTED",
      actor: token.visitorName || "VISITOR",
      metadata: JSON.stringify({
        displayNumber: token.displayNumber,
        reason,
        currentPosition: token.position,
      }),
    },
  }).catch(() => {});

  realtimeBus.publish("EMERGENCY_REQUESTED", {
    tokenId: emergencyRequest.tokenId,
    queueId: emergencyRequest.token.queueId,
    data: {
      emergencyRequest: {
        id: emergencyRequest.id,
        tokenId: emergencyRequest.tokenId,
        displayNumber: emergencyRequest.token.displayNumber,
        reason: emergencyRequest.reason,
        status: emergencyRequest.status,
        currentPosition: emergencyRequest.token.position,
        requestedAt: emergencyRequest.requestedAt.toISOString(),
        queueName: emergencyRequest.token.queue.name,
      },
    },
  });

  // Active 60-Second Dead-Man's Switch (Fail-Safe)
  // If triage desk is unattended for 60s, automatically fail open to #1
  setTimeout(async () => {
    try {
      const check = await prisma.emergencyRequest.findUnique({
        where: { id: emergencyRequest.id },
      });
      if (check && check.status === "PENDING") {
        console.log(`[60s FAIL-SAFE TRIGGERED] Emergency request ${check.id} unattended for 60s. Auto-promoting.`);
        await approveEmergencyRequest(
          check.id,
          "SYSTEM_FAILSAFE_TIMEOUT",
          "Auto-promoted to #1: Triage desk unattended for >60s. Safety-first fail-open."
        );
      }
    } catch (err) {
      console.error("Fail-safe 60s auto-promotion error:", err);
    }
  }, 60000);

  return emergencyRequest;
}

/**
 * Auto-promote pending emergency requests that have been unattended for >60s
 * Called passively during queries to guarantee 60s fail-safe execution across serverless lifecycles
 */
export async function resolveUnattendedEmergencyRequests() {
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
  const unattended = await prisma.emergencyRequest.findMany({
    where: {
      status: "PENDING",
      requestedAt: { lte: sixtySecondsAgo },
    },
    include: {
      token: true,
    },
  });

  const promoted = [];
  for (const req of unattended) {
    if (req.token.status === "WAITING") {
      try {
        console.log(`[PASSIVE AUDIT FAIL-SAFE] Auto-promoting unattended emergency request ${req.id}`);
        const result = await approveEmergencyRequest(
          req.id,
          "SYSTEM_FAILSAFE_TIMEOUT",
          "Auto-promoted to #1: Triage desk unattended for >60s. Safety-first fail-open."
        );
        promoted.push(result);
      } catch (err) {
        console.error(`Error auto-promoting emergency request ${req.id}:`, err);
      }
    }
  }
  return promoted;
}

/**
 * Approve Emergency Request - Atomic promotion to #1 and queue shift
 */
export async function approveEmergencyRequest(requestId: string, reviewer = "Admin", notes?: string) {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
    include: {
      token: {
        include: { queue: true },
      },
    },
  });

  if (!request) {
    throw new Error("Emergency request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error(`Emergency request is already ${request.status}`);
  }

  const token = request.token;
  if (token.status !== "WAITING") {
    throw new Error("Token is no longer in WAITING state");
  }

  // Update emergency request status
  const updatedRequest = await prisma.emergencyRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedBy: reviewer,
      notes: notes || "Approved by administration",
    },
  });

  // Promote token to EMERGENCY priority and LEVEL_1_RESUSCITATION
  await prisma.token.update({
    where: { id: token.id },
    data: {
      priority: "EMERGENCY",
      triageLevel: "LEVEL_1_RESUSCITATION",
    },
  });

  // Re-index entire queue so emergency token becomes #1 and other waiting tokens shift
  await reindexQueuePositions(prisma, token.queueId);

  // Fetch freshly updated token position
  const promotedToken = await prisma.token.findUnique({
    where: { id: token.id },
    include: { queue: true },
  });

  // Record Event
  await prisma.tokenEvent.create({
    data: {
      tokenId: token.id,
      queueId: token.queueId,
      eventType: "EMERGENCY_PROMOTED",
      actor: reviewer,
      metadata: JSON.stringify({
        displayNumber: token.displayNumber,
        newPosition: promotedToken?.position,
        reason: request.reason,
      }),
    },
  }).catch(() => {});

  realtimeBus.publish("EMERGENCY_PROMOTED", {
    tokenId: promotedToken!.id,
    queueId: promotedToken!.queueId,
    data: {
      token: {
        id: promotedToken!.id,
        displayNumber: promotedToken!.displayNumber,
        position: promotedToken!.position,
        priority: promotedToken!.priority,
        triageLevel: promotedToken!.triageLevel,
        status: promotedToken!.status,
      },
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
      },
    },
  });

  return { request: updatedRequest, token: promotedToken! };
}

/**
 * Reject Emergency Request with Anti-Spoof Demotion Penalty
 * Demotes token to lowest priority and pushes to the very back of the line
 */
export async function rejectEmergencyRequest(
  requestId: string,
  reviewer = "Admin",
  notes?: string,
  isSpoofPenalty = true
) {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
    include: { token: { include: { queue: true } } },
  });

  if (!request) {
    throw new Error("Emergency request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error(`Emergency request is already ${request.status}`);
  }

  const updatedRequest = await prisma.emergencyRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedBy: reviewer,
      notes: notes || (isSpoofPenalty ? "Rejected as non-emergency spoof. Demoted to back of queue." : "Rejected by administration"),
    },
  });

  // Anti-Spoof Penalty: Demote token to LEVEL_5_NON_URGENT and reset wait clock
  if (isSpoofPenalty && request.token.status === "WAITING") {
    await prisma.token.update({
      where: { id: request.token.id },
      data: {
        priority: "STANDARD",
        triageLevel: "LEVEL_5_NON_URGENT",
        isDeteriorating: false,
        createdAt: new Date(), // Reset starvation clock to drop score to minimum
      },
    });

    // Reindex queue so penalized token falls to the very end
    await reindexQueuePositions(prisma, request.token.queueId);
  }

  // Fetch updated token
  const penalizedToken = await prisma.token.findUnique({
    where: { id: request.token.id },
    include: { queue: true },
  });

  // Record Event
  await prisma.tokenEvent.create({
    data: {
      tokenId: request.tokenId,
      queueId: request.token.queueId,
      eventType: "SPOOF_PENALTY_DEMOTED",
      actor: reviewer,
      metadata: JSON.stringify({
        displayNumber: request.token.displayNumber,
        oldPosition: request.token.position,
        newPosition: penalizedToken?.position,
        reason: request.reason,
        notes,
      }),
    },
  }).catch(() => {});

  realtimeBus.publish("EMERGENCY_REJECTED", {
    tokenId: request.token.id,
    queueId: request.token.queueId,
    data: {
      token: {
        id: request.token.id,
        displayNumber: request.token.displayNumber,
        position: penalizedToken?.position || request.token.position,
        triageLevel: "LEVEL_5_NON_URGENT",
      },
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
      },
      spoofPenalty: isSpoofPenalty,
    },
  });

  return { request: updatedRequest, token: penalizedToken || request.token };
}

/**
 * Direct Admin Priority Promotion / Demotion (without needing visitor request)
 */
export async function toggleDirectEmergency(
  tokenId: string,
  setEmergency: boolean,
  reviewer = "Admin",
  notes?: string
) {
  const token = await prisma.token.findUnique({
    where: { id: tokenId },
    include: { queue: true, emergencyRequest: true },
  });

  if (!token) {
    throw new Error("Token not found");
  }

  if (token.status !== "WAITING") {
    throw new Error("Only waiting tokens can have priority modified");
  }

  const newPriority = setEmergency ? "EMERGENCY" : "STANDARD";

  // Update token priority and triage level
  await prisma.token.update({
    where: { id: tokenId },
    data: {
      priority: newPriority,
      triageLevel: setEmergency ? "LEVEL_1_RESUSCITATION" : "LEVEL_5_NON_URGENT",
    },
  });

  // If there's an existing emergency request, update it as well
  if (token.emergencyRequest) {
    await prisma.emergencyRequest.update({
      where: { id: token.emergencyRequest.id },
      data: {
        status: setEmergency ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: reviewer,
        notes: notes || (setEmergency ? "Direct priority grant by Admin" : "Demoted to standard priority"),
      },
    });
  }

  // Re-index entire queue so emergency token moves to #1
  await reindexQueuePositions(prisma, token.queueId);

  const updatedToken = await prisma.token.findUnique({
    where: { id: tokenId },
    include: { queue: true },
  });

  // Publish event
  realtimeBus.publish(setEmergency ? "EMERGENCY_PROMOTED" : "TOKEN_CREATED", {
    tokenId: updatedToken!.id,
    queueId: updatedToken!.queueId,
    data: {
      token: {
        id: updatedToken!.id,
        displayNumber: updatedToken!.displayNumber,
        position: updatedToken!.position,
        priority: updatedToken!.priority,
        status: updatedToken!.status,
      },
    },
  });

  return updatedToken;
}

/**
 * Recall Token
 */
export async function recallToken(counterId: string) {
  const counter = await prisma.counter.findUnique({
    where: { id: counterId },
    include: { queue: true },
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  if (!counter.currentServingTokenId) {
    return { success: true, empty: true, message: "Counter has no active token to recall" };
  }

  const token = await prisma.token.findUnique({
    where: { id: counter.currentServingTokenId },
    include: { queue: true },
  });

  if (!token) {
    return { success: true, empty: true, message: "Called token not found" };
  }

  // Record recall event
  await prisma.tokenEvent.create({
    data: {
      tokenId: token.id,
      queueId: token.queueId,
      eventType: "TOKEN_RECALLED",
      actor: counter.operatorName || "OPERATOR",
      metadata: JSON.stringify({
        counterNumber: counter.number,
        counterName: counter.name,
        displayNumber: token.displayNumber,
      }),
    },
  }).catch(() => {});

  // Publish event with audio announcement
  realtimeBus.publish("TOKEN_RECALLED", {
    tokenId: token.id,
    queueId: token.queueId,
    counterId: counter.id,
    data: {
      token: {
        id: token.id,
        displayNumber: token.displayNumber,
        visitorName: token.visitorName,
        status: token.status,
        queueName: token.queue.name,
      },
      counter: {
        id: counter.id,
        number: counter.number,
        name: counter.name,
      },
      announcement: `Recall: Token ${token.displayNumber}, please proceed to ${counter.name}.`,
    },
  });

  return { token, counter };
}

/**
 * Complete serving current token
 */
export async function completeServing(counterId: string, operatorName?: string) {
  const counter = await prisma.counter.findUnique({
    where: { id: counterId },
    include: { queue: true },
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  if (!counter.currentServingTokenId) {
    // If already clear, ensure counter is AVAILABLE
    if (counter.status !== "PAUSED" && counter.status !== "CLOSED") {
      await prisma.counter.update({
        where: { id: counter.id },
        data: { status: "AVAILABLE" },
      });
    }
    return { success: true, empty: true, message: "Counter was already clear" };
  }

  const token = await prisma.token.update({
    where: { id: counter.currentServingTokenId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
    include: { queue: true },
  });

  // Set counter to AVAILABLE
  const updatedCounter = await prisma.counter.update({
    where: { id: counter.id },
    data: {
      status: counter.status === "PAUSED" ? "PAUSED" : "AVAILABLE",
      currentServingTokenId: null,
      ...(operatorName ? { operatorName } : {}),
    },
  });

  // Record audit event
  await prisma.tokenEvent.create({
    data: {
      tokenId: token.id,
      queueId: token.queueId,
      eventType: "TOKEN_COMPLETED",
      actor: operatorName || counter.operatorName || "OPERATOR",
      metadata: JSON.stringify({
        counterNumber: counter.number,
        counterName: counter.name,
        displayNumber: token.displayNumber,
        queueName: token.queue?.name,
      }),
    },
  }).catch(() => {});

  realtimeBus.publish("TOKEN_COMPLETED", {
    tokenId: token.id,
    queueId: token.queueId,
    counterId: counter.id,
    data: {
      token: {
        id: token.id,
        displayNumber: token.displayNumber,
        status: "COMPLETED",
      },
      counter: {
        id: counter.id,
        number: counter.number,
        name: counter.name,
        status: updatedCounter.status,
      },
    },
  });

  return { token, counter: updatedCounter };
}

/**
 * Mark Token as No-Show
 */
export async function markNoShow(counterId: string) {
  const counter = await prisma.counter.findUnique({
    where: { id: counterId },
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  if (!counter.currentServingTokenId) {
    return { success: true, empty: true, message: "No active token being served at this counter" };
  }

  const token = await prisma.token.update({
    where: { id: counter.currentServingTokenId },
    data: {
      status: "NO_SHOW",
      completedAt: new Date(),
    },
    include: { queue: true },
  });

  // Set counter to AVAILABLE
  const updatedCounter = await prisma.counter.update({
    where: { id: counter.id },
    data: {
      status: counter.status === "PAUSED" ? "PAUSED" : "AVAILABLE",
      currentServingTokenId: null,
    },
  });

  // Record event
  await prisma.tokenEvent.create({
    data: {
      tokenId: token.id,
      queueId: token.queueId,
      eventType: "TOKEN_NO_SHOW",
      actor: counter.operatorName || "OPERATOR",
      metadata: JSON.stringify({
        counterNumber: counter.number,
        counterName: counter.name,
        displayNumber: token.displayNumber,
      }),
    },
  }).catch(() => {});

  realtimeBus.publish("TOKEN_NO_SHOW", {
    tokenId: token.id,
    queueId: token.queueId,
    counterId: counter.id,
    data: {
      token: {
        id: token.id,
        displayNumber: token.displayNumber,
        status: "NO_SHOW",
      },
    },
  });

  return { token, counter: updatedCounter };
}

/**
 * Multi-stage clinical care transition and queue transfer function.
 * Allows a token to transition currentStage (e.g. DOCTOR_CONSULTATION -> DIAGNOSTICS_LAB)
 * and assign targetDepartment without changing the token's unique ID or display number.
 */
export async function transferToken(params: {
  tokenId: string;
  targetQueueId?: string;
  targetStage?: CareStage;
  targetDepartment?: DepartmentType;
  actor?: string;
  notes?: string;
}) {
  const {
    tokenId,
    targetQueueId,
    targetStage,
    targetDepartment,
    actor = "Clinical Staff",
    notes,
  } = params;

  const token = await prisma.token.findUnique({
    where: { id: tokenId },
    include: { queue: true },
  });

  if (!token) {
    throw new Error("Token not found");
  }

  const oldQueueId = token.queueId;
  const effectiveQueueId = targetQueueId || oldQueueId;

  let targetQueue = token.queue;
  if (targetQueueId && targetQueueId !== oldQueueId) {
    const foundQueue = await prisma.queue.findUnique({
      where: { id: targetQueueId },
    });
    if (foundQueue) {
      targetQueue = foundQueue;
    }
  }

  // Calculate new position in target queue
  const targetWaitingCount = await prisma.token.count({
    where: { queueId: effectiveQueueId, status: "WAITING" },
  });

  const updatedToken = await prisma.token.update({
    where: { id: tokenId },
    data: {
      queueId: effectiveQueueId,
      status: "WAITING",
      position: targetWaitingCount + 1,
      counterId: null,
      ...(targetStage ? { currentStage: targetStage } : {}),
      ...(targetDepartment ? { targetDepartment: targetDepartment } : {}),
    },
    include: { queue: true },
  });

  // Re-index remaining tokens in queues
  if (oldQueueId !== effectiveQueueId) {
    await reindexQueuePositions(prisma, oldQueueId);
  }
  await reindexQueuePositions(prisma, effectiveQueueId);

  // Record audit event
  await prisma.tokenEvent.create({
    data: {
      tokenId: token.id,
      queueId: effectiveQueueId,
      eventType: "TOKEN_TRANSFERRED",
      actor,
      metadata: JSON.stringify({
        fromQueue: token.queue.name,
        toQueue: targetQueue.name,
        fromStage: token.currentStage,
        toStage: updatedToken.currentStage,
        targetDepartment: updatedToken.targetDepartment,
        displayNumber: token.displayNumber,
        notes,
      }),
    },
  }).catch(() => {});

  realtimeBus.publish("TOKEN_TRANSFERRED", {
    tokenId: token.id,
    queueId: effectiveQueueId,
    data: {
      token: {
        id: token.id,
        displayNumber: token.displayNumber,
        position: updatedToken.position,
        queueName: targetQueue.name,
        currentStage: updatedToken.currentStage,
        targetDepartment: updatedToken.targetDepartment,
        status: updatedToken.status,
      },
    },
  });

  return updatedToken;
}

/**
 * Mark a waiting token as clinically deteriorating:
 * Sets isDeteriorating = true, grants +100,000 DeteriorationBoost, promotes priority to head of queue,
 * and broadcasts immediate alert to staff counters.
 */
export async function markTokenDeteriorating(tokenId: string, reason?: string, vitals?: any) {
  const token = await prisma.token.findUnique({
    where: { id: tokenId },
    include: { queue: true },
  });

  if (!token) {
    throw new Error("Token not found");
  }

  const updatedToken = await prisma.token.update({
    where: { id: tokenId },
    data: {
      isDeteriorating: true,
      priority: "EMERGENCY",
      ...(vitals ? { vitalSigns: vitals } : {}),
      lastVitalsCheckAt: new Date(),
    },
    include: { queue: true },
  });

  // Re-index queue with +100,000 deterioration boost
  await reindexQueuePositions(prisma, token.queueId);

  const refreshedToken = await prisma.token.findUnique({
    where: { id: tokenId },
    include: { queue: true },
  });

  // Record audit event
  await prisma.tokenEvent.create({
    data: {
      tokenId: token.id,
      queueId: token.queueId,
      eventType: "EMERGENCY_PROMOTED",
      actor: token.visitorName || "PATIENT",
      metadata: JSON.stringify({
        displayNumber: token.displayNumber,
        reason: reason || "Clinical deterioration reported",
        newPosition: refreshedToken?.position,
        vitals,
      }),
    },
  }).catch(() => {});

  realtimeBus.publish("EMERGENCY_PROMOTED", {
    tokenId: token.id,
    queueId: token.queueId,
    data: {
      token: {
        id: token.id,
        displayNumber: token.displayNumber,
        position: refreshedToken?.position,
        isDeteriorating: true,
        priority: "EMERGENCY",
        triageLevel: refreshedToken?.triageLevel,
        status: refreshedToken?.status,
        queueName: token.queue.name,
      },
      reason: reason || "Clinical deterioration reported",
    },
  });

  return refreshedToken;
}

/**
 * Toggle Counter Pause / Resume
 */
export async function toggleCounterPause(counterId: string, pause: boolean) {
  const currentCounter = await prisma.counter.findUnique({
    where: { id: counterId },
  });

  if (!currentCounter) {
    throw new Error("Counter not found");
  }

  const newStatus = pause ? "PAUSED" : "AVAILABLE";
  const updatedCounter = await prisma.counter.update({
    where: { id: counterId },
    data: { status: newStatus },
    include: { queue: true },
  });

  const eventType = pause ? "COUNTER_PAUSED" : "COUNTER_RESUMED";

  await prisma.tokenEvent.create({
    data: {
      queueId: updatedCounter.queueId,
      eventType,
      actor: updatedCounter.operatorName || "OPERATOR",
      metadata: JSON.stringify({
        counterNumber: updatedCounter.number,
        counterName: updatedCounter.name,
        newStatus,
      }),
    },
  }).catch(() => {});

  realtimeBus.publish(eventType as any, {
    queueId: updatedCounter.queueId || "ALL",
    counterId: updatedCounter.id,
    data: {
      counter: {
        id: updatedCounter.id,
        number: updatedCounter.number,
        name: updatedCounter.name,
        status: updatedCounter.status,
      },
    },
  });

  return updatedCounter;
}

/**
 * Realistic Clinical Demo Seeder:
 * Seeds clinical departments, examination cabins/stations, and patients across ESI Levels 1-5.
 */
export async function seedRealisticDemoData() {
  // Clear existing data cleanly
  await prisma.emergencyRequest.deleteMany({});
  await prisma.tokenEvent.deleteMany({});
  await prisma.token.deleteMany({});
  await prisma.counter.deleteMany({});
  await prisma.queue.deleteMany({});

  // 1. Create Clinical Department Queues
  const queueTriage = await prisma.queue.create({
    data: {
      name: "Triage & Acute Assessment",
      code: "TR",
      department: "TRIAGE_DESK",
      description: "Immediate clinical intake, vital signs, acuity scoring",
      status: "ACTIVE",
      estimatedServiceTime: 3,
    },
  });

  const queueEmergency = await prisma.queue.create({
    data: {
      name: "Emergency Room & Resuscitation",
      code: "ED",
      department: "EMERGENCY_ROOM",
      description: "Critical emergency care, trauma, acute stabilization",
      status: "ACTIVE",
      estimatedServiceTime: 12,
    },
  });

  const queueOPD = await prisma.queue.create({
    data: {
      name: "General Outpatient Clinics",
      code: "OPD",
      department: "GENERAL_OPD",
      description: "Physician consultations, chronic care, sub-specialty clinics",
      status: "ACTIVE",
      estimatedServiceTime: 8,
    },
  });

  const queueDiagnostics = await prisma.queue.create({
    data: {
      name: "Diagnostic Labs & Radiology",
      code: "DX",
      department: "PATHOLOGY_LAB",
      description: "Phlebotomy, rapid hematology, X-Ray, CT imaging",
      status: "ACTIVE",
      estimatedServiceTime: 6,
    },
  });

  const queuePharmacy = await prisma.queue.create({
    data: {
      name: "Outpatient Central Pharmacy",
      code: "RX",
      department: "CENTRAL_PHARMACY",
      description: "Prescription verification, patient counselling, drug dispensing",
      status: "ACTIVE",
      estimatedServiceTime: 4,
    },
  });

  // 2. Create Clinical Stations / Workstations
  const counter1 = await prisma.counter.create({
    data: {
      number: 1,
      name: "Triage Station 01",
      queueId: queueTriage.id,
      status: "AVAILABLE",
      operatorName: "Nurse Elena Vance, RN",
    },
  });

  const counter2 = await prisma.counter.create({
    data: {
      number: 2,
      name: "Doctor Cabin 01 (Acute)",
      queueId: queueOPD.id,
      status: "AVAILABLE",
      operatorName: "Dr. Marcus Chen, MD",
    },
  });

  const counter3 = await prisma.counter.create({
    data: {
      number: 3,
      name: "Doctor Cabin 02 (General)",
      queueId: queueOPD.id,
      status: "AVAILABLE",
      operatorName: "Dr. Sarah Jenkins, MBBS",
    },
  });

  const counter4 = await prisma.counter.create({
    data: {
      number: 4,
      name: "Diagnostics Phlebotomy Bay",
      queueId: queueDiagnostics.id,
      status: "AVAILABLE",
      operatorName: "Tech Rajesh Kumar",
    },
  });

  const counter5 = await prisma.counter.create({
    data: {
      number: 5,
      name: "Radiology Scan Room",
      queueId: queueDiagnostics.id,
      status: "AVAILABLE",
      operatorName: "Tech David O'Connor",
    },
  });

  const counter6 = await prisma.counter.create({
    data: {
      number: 6,
      name: "Pharmacy Dispense Counter",
      queueId: queuePharmacy.id,
      status: "AVAILABLE",
      operatorName: "Pharm. Ananya Rao, RPh",
    },
  });

  // 3. Seed Benchmark Patients across ESI Levels in General OPD Queue
  // Patient A: Level 2 Emergent (Severe Chest Pain, high priority)
  const tokenA = await prisma.token.create({
    data: {
      displayNumber: "OPD-001",
      sequenceNumber: 1,
      queueId: queueOPD.id,
      visitorSessionId: "session_patient_a",
      visitorName: "Arthur Pendelton",
      purpose: "Acute Chest Tightness & Cold Sweat",
      chiefComplaint: "Crushing retrosternal chest pain radiating to left arm",
      vitalSigns: { spo2: 92, hr: 115, systolicBp: 158, diastolicBp: 98, temp: 37.1 },
      riskFlags: ["CARDIAC_ALERT", "HYPOXIA_WATCH"],
      triageLevel: "LEVEL_2_EMERGENT",
      currentStage: "DOCTOR_CONSULTATION",
      targetDepartment: "CARDIOLOGY",
      status: "WAITING",
      position: 1,
      priority: "EMERGENCY",
      createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
      lastVitalsCheckAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  });

  // Patient B: Level 3 Urgent (Abdominal pain, stable vitals)
  const tokenB = await prisma.token.create({
    data: {
      displayNumber: "OPD-002",
      sequenceNumber: 2,
      queueId: queueOPD.id,
      visitorSessionId: "session_patient_b",
      visitorName: "Beatrice Morales",
      purpose: "Right Lower Quadrant Abdominal Pain",
      chiefComplaint: "Acute abdominal pain for 6 hours, nausea, localized guarding",
      vitalSigns: { spo2: 98, hr: 88, systolicBp: 122, diastolicBp: 78, temp: 38.2 },
      riskFlags: ["FEBRILE", "SURGICAL_EVAL"],
      triageLevel: "LEVEL_3_URGENT",
      currentStage: "DOCTOR_CONSULTATION",
      targetDepartment: "GENERAL_OPD",
      status: "WAITING",
      position: 2,
      priority: "STANDARD",
      createdAt: new Date(Date.now() - 52 * 60 * 1000), // 52 min ago -> Starvation boost active!
      lastVitalsCheckAt: new Date(Date.now() - 50 * 60 * 1000),
      starvationAlert: true,
    },
  });

  // Patient C: Level 4 Less Urgent (Suture removal / minor ankle sprain)
  const tokenC = await prisma.token.create({
    data: {
      displayNumber: "OPD-003",
      sequenceNumber: 3,
      queueId: queueOPD.id,
      visitorSessionId: "session_patient_c",
      visitorName: "Charles Davies",
      purpose: "Right Ankle Inversion Injury",
      chiefComplaint: "Twisted ankle while walking downstairs, mild swelling, able to bear weight",
      vitalSigns: { spo2: 99, hr: 74, systolicBp: 118, diastolicBp: 76, temp: 36.8 },
      riskFlags: [],
      triageLevel: "LEVEL_4_LESS_URGENT",
      currentStage: "DOCTOR_CONSULTATION",
      targetDepartment: "ORTHOPEDICS",
      status: "WAITING",
      position: 3,
      priority: "STANDARD",
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
      lastVitalsCheckAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  });

  // Patient D: Level 5 Non-Urgent (Routine Rx refill)
  const tokenD = await prisma.token.create({
    data: {
      displayNumber: "OPD-004",
      sequenceNumber: 4,
      queueId: queueOPD.id,
      visitorSessionId: "session_patient_d",
      visitorName: "Dorothy Sterling",
      purpose: "Hypertension Medication Refill",
      chiefComplaint: "Routine 90-day refill request for Amlodipine, asymptomatic",
      vitalSigns: { spo2: 99, hr: 68, systolicBp: 128, diastolicBp: 82, temp: 36.6 },
      riskFlags: [],
      triageLevel: "LEVEL_5_NON_URGENT",
      currentStage: "DOCTOR_CONSULTATION",
      targetDepartment: "GENERAL_OPD",
      status: "WAITING",
      position: 4,
      priority: "STANDARD",
      createdAt: new Date(Date.now() - 35 * 60 * 1000),
      lastVitalsCheckAt: new Date(Date.now() - 35 * 60 * 1000),
    },
  });

  // Seed completed consultation in Triage and ED for throughput metrics
  await prisma.token.create({
    data: {
      displayNumber: "TR-001",
      sequenceNumber: 1,
      queueId: queueTriage.id,
      visitorSessionId: "session_patient_e",
      visitorName: "Evelyn Reed",
      purpose: "Triage Intake Completed",
      triageLevel: "LEVEL_3_URGENT",
      status: "COMPLETED",
      position: 0,
      priority: "STANDARD",
      calledAt: new Date(Date.now() - 25 * 60 * 1000),
      completedAt: new Date(Date.now() - 21 * 60 * 1000),
    },
  });

  await prisma.token.create({
    data: {
      displayNumber: "ED-001",
      sequenceNumber: 1,
      queueId: queueEmergency.id,
      visitorSessionId: "session_patient_f",
      visitorName: "Franklin Ross",
      purpose: "Anaphylaxis Stabilization",
      triageLevel: "LEVEL_1_RESUSCITATION",
      status: "COMPLETED",
      position: 0,
      priority: "EMERGENCY",
      calledAt: new Date(Date.now() - 40 * 60 * 1000),
      completedAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  });

  // Re-index OPD queue with priority engine
  await reindexQueuePositions(prisma, queueOPD.id);

  return {
    queues: [queueTriage, queueEmergency, queueOPD, queueDiagnostics, queuePharmacy],
    counters: [counter1, counter2, counter3, counter4, counter5, counter6],
    tokens: [tokenA, tokenB, tokenC, tokenD],
  };
}
