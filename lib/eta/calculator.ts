/**
 * Acuity-Adjusted Clinical Wait Estimator
 *
 * Computes estimated wait time (in minutes) based on:
 * - Emergency Severity Index (ESI Level 1-5)
 * - Deterioration status
 * - Current position in queue
 * - Configured average service time
 * - Number of active clinical counters/cabins
 */
export function calculateEstimatedWaitTime(params: {
  position: number; // 1-based position (1 = next up)
  estimatedServiceTimeMins: number; // default service time per ticket (e.g. 5 mins)
  activeCounterCount: number; // number of operating counters (>= 1)
  triageLevel?: string;
  isDeteriorating?: boolean;
}): number {
  const { position, estimatedServiceTimeMins, activeCounterCount, triageLevel, isDeteriorating } = params;

  // Level 1 Resuscitation: Immediate life threat, zero wait tolerance
  if (triageLevel === "LEVEL_1_RESUSCITATION") {
    return 0;
  }

  // Level 2 Emergent or acutely deteriorating: expedited evaluation
  if (triageLevel === "LEVEL_2_EMERGENT" || isDeteriorating) {
    return Math.min(2, Math.max(1, Math.round(estimatedServiceTimeMins * 0.2)));
  }

  if (position <= 0) return 0;
  if (position === 1) {
    return Math.max(1, Math.round(estimatedServiceTimeMins * 0.4));
  }

  // Active serving throughput
  const effectiveCounters = Math.max(1, activeCounterCount);
  const peopleAhead = position - 1;

  // Formula: (peopleAhead / effectiveCounters) * avgServiceTime
  const rawWait = (peopleAhead / effectiveCounters) * estimatedServiceTimeMins;
  return Math.max(1, Math.round(rawWait));
}
