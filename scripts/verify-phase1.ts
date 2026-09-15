import { classifyPatientSymptoms, checkDeterministicOverrides } from "../lib/ai/cohere";
import { calculatePriorityScore, ACUITY_WEIGHTS, STARVATION_RATES } from "../lib/queue/engine";
import { calculateEstimatedWaitTime } from "../lib/eta/calculator";

async function runVerification() {
  console.log("==================================================");
  console.log("TRIAGEPULSE PHASE 1 ARCHITECTURAL VERIFICATION");
  console.log("==================================================");

  // 1. Test Mock Cardiac Symptom Input
  console.log("\n[Test 1: Cardiac Red-Flag Classification]");
  const cardiacComplaint = "Sharp radiating chest pain, tightness, and cold sweat";
  const cardiacVitals = { spo2: 91, hr: 110, systolicBp: 155, diastolicBp: 95 };

  const cardiacResult = await classifyPatientSymptoms(cardiacComplaint, cardiacVitals);
  console.log("Complaint:", cardiacComplaint);
  console.log("Vitals:", cardiacVitals);
  console.log("Output Dept:", cardiacResult.departmentType);
  console.log("Output Acuity:", cardiacResult.triageLevel);
  console.log("Risk Flags:", cardiacResult.riskFlags);
  console.log("Clinical Rationale:", cardiacResult.clinicalRationale);

  const test1Passed =
    cardiacResult.departmentType === "EMERGENCY_ROOM" &&
    cardiacResult.triageLevel === "LEVEL_2_EMERGENT" &&
    cardiacResult.riskFlags.includes("CARDIAC_ALERT");

  console.log("Result Test 1:", test1Passed ? "PASSED" : "FAILED");

  // 2. Test Severe Hypoxia Level 1 Override
  console.log("\n[Test 2: Critical Hypoxia / Resuscitation Trigger]");
  const hypoxiaResult = await classifyPatientSymptoms("Shortness of breath", { spo2: 85 });
  console.log("Output Dept:", hypoxiaResult.departmentType);
  console.log("Output Acuity:", hypoxiaResult.triageLevel);
  console.log("Risk Flags:", hypoxiaResult.riskFlags);

  const test2Passed =
    hypoxiaResult.departmentType === "EMERGENCY_ROOM" &&
    hypoxiaResult.triageLevel === "LEVEL_1_RESUSCITATION" &&
    hypoxiaResult.riskFlags.includes("CRITICAL_HYPOXIA");

  console.log("Result Test 2:", test2Passed ? "PASSED" : "FAILED");

  // 3. Test Acuity-Time Hybrid Priority Ranking (R) & Starvation Formula
  console.log("\n[Test 3: Acuity-Time Priority Ranking (R) & Starvation]");
  const now = Date.now();

  // Patient 1: Level 2 Emergent, just arrived (0 mins)
  const tokenL2 = {
    triageLevel: "LEVEL_2_EMERGENT",
    createdAt: new Date(now),
    isDeteriorating: false,
  };
  const scoreL2 = calculatePriorityScore(tokenL2);

  // Patient 2: Level 5 Non-Urgent, arrived 60 mins ago
  const tokenL5_starving = {
    triageLevel: "LEVEL_5_NON_URGENT",
    createdAt: new Date(now - 60 * 60 * 1000),
    isDeteriorating: false,
  };
  const scoreL5_starving = calculatePriorityScore(tokenL5_starving);

  // Patient 3: Level 4 Less Urgent, acutely deteriorating
  const tokenL4_deteriorating = {
    triageLevel: "LEVEL_4_LESS_URGENT",
    createdAt: new Date(now - 10 * 60 * 1000),
    isDeteriorating: true,
  };
  const scoreL4_deteriorating = calculatePriorityScore(tokenL4_deteriorating);

  console.log(`Score Level 2 (Just arrived): ${scoreL2} (Expected: ~50000)`);
  console.log(`Score Level 5 (60 min wait): ${scoreL5_starving} (Base: 50 + 60*4 = 290)`);
  console.log(`Score Level 4 (Deteriorating): ${scoreL4_deteriorating} (Base: 500 + 80 + 100000 = 100580)`);

  const test3Passed =
    scoreL4_deteriorating > scoreL2 && // Deteriorating patient supersedes emergent
    scoreL2 > scoreL5_starving &&
    scoreL5_starving > 50; // Starvation boosted

  console.log("Result Test 3:", test3Passed ? "PASSED" : "FAILED");

  // 4. Test ETA calculation
  console.log("\n[Test 4: Acuity-Adjusted Wait Estimator]");
  const etaL1 = calculateEstimatedWaitTime({ position: 1, estimatedServiceTimeMins: 5, activeCounterCount: 2, triageLevel: "LEVEL_1_RESUSCITATION" });
  const etaL2 = calculateEstimatedWaitTime({ position: 2, estimatedServiceTimeMins: 5, activeCounterCount: 2, triageLevel: "LEVEL_2_EMERGENT" });
  const etaL4 = calculateEstimatedWaitTime({ position: 4, estimatedServiceTimeMins: 5, activeCounterCount: 1, triageLevel: "LEVEL_4_LESS_URGENT" });

  console.log(`ETA Level 1: ${etaL1} min (Expected: 0)`);
  console.log(`ETA Level 2: ${etaL2} min (Expected: <= 2)`);
  console.log(`ETA Level 4 (pos 4, 1 counter): ${etaL4} min (Expected: 15)`);

  const test4Passed = etaL1 === 0 && etaL2 <= 2 && etaL4 === 15;
  console.log("Result Test 4:", test4Passed ? "PASSED" : "FAILED");

  if (test1Passed && test2Passed && test3Passed && test4Passed) {
    console.log("\nALL PHASE 1 ENGINE TESTS PASSED SUCCESSFULLY.");
  } else {
    console.error("\nTEST FAILURE OCCURRED.");
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification execution error:", err);
  process.exit(1);
});
