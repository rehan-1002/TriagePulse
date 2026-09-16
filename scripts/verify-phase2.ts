import {
  submitEmergencyRequest,
  approveEmergencyRequest,
  rejectEmergencyRequest,
  resolveUnattendedEmergencyRequests,
  createToken,
} from "../lib/queue/engine";
import { prisma } from "../lib/db/prisma";

async function verifyPhase2() {
  console.log("==================================================");
  console.log("TRIAGEPULSE PHASE 2 ANTI-SPOOF & FAIL-SAFE TEST");
  console.log("==================================================");

  // 1. Get or create an active queue
  const queue = await prisma.queue.findFirst();
  if (!queue) {
    console.error("No queue found in database. Skipping DB verification.");
    return;
  }

  // 2. Create a test patient token
  const testToken = await createToken({
    queueId: queue.id,
    visitorSessionId: `test_${Date.now()}`,
    visitorName: "Test Anti-Spoof Patient",
    purpose: "Routine consult",
    chiefComplaint: "Routine consult",
    triageLevel: "LEVEL_3_URGENT",
    currentStage: "TRIAGE_INTAKE",
  });
  console.log(`Created test token: ${testToken.displayNumber} (ID: ${testToken.id}, Initial Pos: ${testToken.position})`);

  // 3. Test submitting emergency request
  const emergencyReq = await submitEmergencyRequest(testToken.id, "Testing emergency submission with anti-spoof");
  console.log(`Emergency Request created: ${emergencyReq.id}, Status: ${emergencyReq.status}`);

  if (emergencyReq.status !== "PENDING") {
    console.error("FAIL: Emergency request should start in PENDING state");
    process.exit(1);
  }

  // 4. Test Anti-Spoof Penalty rejection
  console.log("\n[Testing Anti-Spoof Penalty Rejection]");
  const rejectResult = await rejectEmergencyRequest(
    emergencyReq.id,
    "Dr. Test Reviewer",
    "Verified non-emergency spoof attempt",
    true // isSpoofPenalty = true
  );

  console.log(`Reject Status: ${rejectResult.request.status}`);
  console.log(`Penalized Token Triage Level: ${rejectResult.token.triageLevel} (Expected: LEVEL_5_NON_URGENT)`);
  console.log(`Penalized Token Priority: ${rejectResult.token.priority} (Expected: STANDARD)`);

  const spoofPenaltyPassed =
    rejectResult.request.status === "REJECTED" &&
    rejectResult.token.triageLevel === "LEVEL_5_NON_URGENT" &&
    rejectResult.token.priority === "STANDARD";

  console.log("Spoof Penalty Test:", spoofPenaltyPassed ? "PASSED ✅" : "FAILED ❌");

  // 5. Test 60-Second Fail-Safe Timeout Auto-Promote
  console.log("\n[Testing 60-Second Unattended Fail-Safe]");
  // Create another emergency request and simulate 61 seconds elapsed
  const testToken2 = await createToken({
    queueId: queue.id,
    visitorSessionId: `test2_${Date.now()}`,
    visitorName: "Test Unattended Patient",
    purpose: "Acute distress",
    chiefComplaint: "Acute distress",
    triageLevel: "LEVEL_3_URGENT",
    currentStage: "TRIAGE_INTAKE",
  });

  const req2 = await prisma.emergencyRequest.create({
    data: {
      tokenId: testToken2.id,
      reason: "Simulated unattended acute distress",
      status: "PENDING",
      requestedAt: new Date(Date.now() - 65 * 1000), // 65 seconds ago
    },
  });

  console.log(`Created simulated unattended request (${req2.id}) requested 65s ago.`);
  const resolved = await resolveUnattendedEmergencyRequests();
  console.log(`Auto-promoted ${resolved.length} unattended request(s).`);

  const updatedReq2 = await prisma.emergencyRequest.findUnique({
    where: { id: req2.id },
    include: { token: true },
  });

  console.log(`Unattended Request Status: ${updatedReq2?.status} (Expected: APPROVED)`);
  console.log(`Promoted Token Priority: ${updatedReq2?.token.priority} (Expected: EMERGENCY)`);
  console.log(`Promoted Token Position: ${updatedReq2?.token.position} (Expected: 1)`);

  const failSafePassed =
    updatedReq2?.status === "APPROVED" &&
    updatedReq2?.token.priority === "EMERGENCY" &&
    updatedReq2?.token.position === 1;

  console.log("60s Fail-Safe Test:", failSafePassed ? "PASSED ✅" : "FAILED ❌");

  // Cleanup test tokens
  await prisma.token.deleteMany({
    where: { id: { in: [testToken.id, testToken2.id] } },
  });

  if (spoofPenaltyPassed && failSafePassed) {
    console.log("\nALL PHASE 2 ARCHITECTURAL TESTS PASSED SUCCESSFULLY! 🚀");
  } else {
    process.exit(1);
  }
}

verifyPhase2().catch((e) => {
  console.error("Verification error:", e);
  process.exit(1);
});
