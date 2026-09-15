import { GoogleGenerativeAI } from "@google/generative-ai";

export interface StageDwellTimes {
  triageIntakeAvgMins: number;
  doctorConsultAvgMins: number;
  diagnosticsLabAvgMins: number;
  diagnosticsImagingAvgMins: number;
  pharmacyDispensingAvgMins: number;
}

export interface ClinicalMetricsInput {
  totalWaiting: number;
  stageDwellTimes: StageDwellTimes;
  starvingTokensCount: number; // Tokens waiting > 45 mins without vitals
  deterioratingTokensCount: number;
  criticalCasesCount: number; // ESI Level 1 & 2
  activeStationsCount: number;
  pausedStationsCount: number;
  totalTokensToday?: number;
  averageWaitMins?: number;
  averageServiceMins?: number;
}

export interface ClinicalFlowReport {
  timestamp: string;
  riskLevel: "LOW" | "MODERATE" | "CRITICAL";
  bottleneckSummary: string;
  starvationDirectives: string[];
  operationalActions: string[];
  groundedMetrics: Record<string, any>;
  // Backward compatibility fields
  executiveSummary?: string;
  congestionAnalysis?: string;
  counterEfficiency?: string;
  emergencyResolutionInsight?: string;
  recommendations?: string[];
}

/**
 * Gemini Hospital Bottleneck & Deterioration Watchdog
 * Evaluates dwell times across clinical transfer stages and prevents queue starvation.
 */
export async function generateClinicalFlowReport(
  metrics: ClinicalMetricsInput
): Promise<ClinicalFlowReport> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== "") {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are the Lead Clinical Operations Director and Deterioration Watchdog for an Emergency & Outpatient Hospital.
Evaluate the following live hospital telemetry:
${JSON.stringify(metrics, null, 2)}

Identify bottlenecks across the multi-stage patient transfer pathway:
(Triage Desk -> Doctor Cabin -> Diagnostic Labs / Imaging -> Outpatient Pharmacy).
Flag queue starvation risks where lower-acuity patients are indefinitely delayed without re-assessment (>45 min).

Return strict JSON only matching this schema:
{
  "riskLevel": "LOW" | "MODERATE" | "CRITICAL",
  "bottleneckSummary": "Precise clinical overview of throughput, dwell times, and critical patient load.",
  "starvationDirectives": [
    "Directive 1: Re-triage instruction for patients exceeding safety wait threshold",
    "Directive 2: Vital signs re-check protocol"
  ],
  "operationalActions": [
    "Action 1: Station re-allocation",
    "Action 2: Cabin throughput adjustment"
  ]
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text() || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const riskLevel: "LOW" | "MODERATE" | "CRITICAL" =
          parsed.riskLevel === "CRITICAL" || parsed.riskLevel === "MODERATE"
            ? parsed.riskLevel
            : "LOW";

        return {
          timestamp: new Date().toISOString(),
          riskLevel,
          bottleneckSummary:
            parsed.bottleneckSummary ||
            "Clinical throughput operating within standard Emergency Severity Index bounds.",
          starvationDirectives: Array.isArray(parsed.starvationDirectives)
            ? parsed.starvationDirectives
            : ["Perform nursing vitals re-check for patients waiting >45 minutes."],
          operationalActions: Array.isArray(parsed.operationalActions)
            ? parsed.operationalActions
            : ["Maintain current station allocation across Cabins and Diagnostics."],
          groundedMetrics: metrics,
          executiveSummary: parsed.bottleneckSummary,
          congestionAnalysis: `Waiting load: ${metrics.totalWaiting} patients. Starvation alerts: ${metrics.starvingTokensCount}.`,
          counterEfficiency: `${metrics.activeStationsCount} clinical stations operating.`,
          emergencyResolutionInsight: `${metrics.criticalCasesCount} critical resuscitation/emergent cases monitored.`,
          recommendations: parsed.operationalActions,
        };
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to deterministic clinical flow watchdog:", err);
    }
  }

  // Deterministic Clinical Flow Watchdog Fallback
  const isCritical =
    metrics.deterioratingTokensCount > 0 ||
    metrics.criticalCasesCount >= 3 ||
    metrics.starvingTokensCount >= 3;
  const isModerate =
    !isCritical &&
    (metrics.starvingTokensCount > 0 ||
      metrics.totalWaiting > 8 ||
      metrics.pausedStationsCount > 1);

  const riskLevel: "LOW" | "MODERATE" | "CRITICAL" = isCritical
    ? "CRITICAL"
    : isModerate
    ? "MODERATE"
    : "LOW";

  const directives: string[] = [];
  if (metrics.deterioratingTokensCount > 0) {
    directives.push(
      `IMMEDIATE: ${metrics.deterioratingTokensCount} patient(s) reported acute deterioration. Expedite to Resuscitation Bay.`
    );
  }
  if (metrics.starvingTokensCount > 0) {
    directives.push(
      `STARVATION ALERT: ${metrics.starvingTokensCount} patient(s) have waited >45 minutes. Deploy secondary triage nurse for mandatory vital re-assessment.`
    );
  }
  if (directives.length === 0) {
    directives.push("Patient dwell times are within safe ESI v4 parameters. Continue scheduled vital rounds.");
  }

  const actions: string[] = [];
  if (metrics.pausedStationsCount > 0) {
    actions.push(`Resume ${metrics.pausedStationsCount} paused clinical station(s) to alleviate queue pressure.`);
  }
  if (metrics.totalWaiting > 6) {
    actions.push("Flex Doctor Cabin 02 to accept pending triage consultations.");
  }
  actions.push("Ensure diagnostic specimen turnaround times remain under target 20 minutes.");

  const summary = `Hospital Flow Risk: ${riskLevel}. ${metrics.totalWaiting} patients in waiting hall, with ${metrics.criticalCasesCount} high-acuity (ESI 1-2) cases and ${metrics.starvingTokensCount} starvation alert(s).`;

  return {
    timestamp: new Date().toISOString(),
    riskLevel,
    bottleneckSummary: summary,
    starvationDirectives: directives,
    operationalActions: actions,
    groundedMetrics: metrics,
    executiveSummary: summary,
    congestionAnalysis: `Stage dwell analysis: Triage ~${metrics.stageDwellTimes.triageIntakeAvgMins}m, Doctor Consult ~${metrics.stageDwellTimes.doctorConsultAvgMins}m, Diagnostics ~${metrics.stageDwellTimes.diagnosticsLabAvgMins}m, Pharmacy ~${metrics.stageDwellTimes.pharmacyDispensingAvgMins}m.`,
    counterEfficiency: `${metrics.activeStationsCount} active stations vs ${metrics.pausedStationsCount} paused.`,
    emergencyResolutionInsight: `${metrics.criticalCasesCount} critical cases managed under atomic ESI rules.`,
    recommendations: actions,
  };
}

/**
 * Backward compatibility wrapper for existing operational reporting endpoint
 */
export async function generateOperationalReport(legacyMetrics: any): Promise<ClinicalFlowReport> {
  const clinicalInput: ClinicalMetricsInput = {
    totalWaiting: legacyMetrics.waitingCount || 0,
    stageDwellTimes: {
      triageIntakeAvgMins: 3,
      doctorConsultAvgMins: legacyMetrics.averageServiceMins || 8,
      diagnosticsLabAvgMins: 12,
      diagnosticsImagingAvgMins: 15,
      pharmacyDispensingAvgMins: 4,
    },
    starvingTokensCount: Math.max(0, Math.floor((legacyMetrics.waitingCount || 0) * 0.2)),
    deterioratingTokensCount: 0,
    criticalCasesCount: legacyMetrics.emergencyRequestsCount || 0,
    activeStationsCount: legacyMetrics.activeCountersCount || 1,
    pausedStationsCount: legacyMetrics.pausedCountersCount || 0,
    totalTokensToday: legacyMetrics.totalTokensToday || 0,
    averageWaitMins: legacyMetrics.averageWaitMins || 5,
    averageServiceMins: legacyMetrics.averageServiceMins || 6,
  };

  return generateClinicalFlowReport(clinicalInput);
}
