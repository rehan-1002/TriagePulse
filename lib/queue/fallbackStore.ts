import { HOSPITALS, Hospital } from "@/lib/hospitals/data";

export interface FallbackToken {
  id: string;
  displayNumber: string;
  visitorSessionId: string;
  visitorName: string;
  purpose: string;
  chiefComplaint: string;
  vitalSigns?: any;
  triageLevel: string;
  currentStage: string;
  targetDepartment: string;
  status: "WAITING" | "SERVING" | "COMPLETED" | "CANCELLED";
  priority: "EMERGENCY" | "STANDARD";
  position: number;
  queueId: string;
  hospitalCode: string;
  createdAt: string;
  queue: {
    id: string;
    name: string;
    code: string;
    department: string;
    estimatedServiceTime: number;
  };
  counter?: any;
  emergencyRequest?: any;
}

const globalFallbackStore = globalThis as unknown as {
  __triagepulse_fallback_tokens?: Map<string, FallbackToken>;
};

const memoryTokens: Map<string, FallbackToken> =
  globalFallbackStore.__triagepulse_fallback_tokens ||
  (globalFallbackStore.__triagepulse_fallback_tokens = new Map<string, FallbackToken>());

export function getFallbackQueuesForHospital(hospitalCodeOrId?: string | null) {
  const targetHospital = HOSPITALS.find(
    (h) =>
      h.code.toLowerCase() === (hospitalCodeOrId || "AIIMS").toLowerCase() ||
      h.id.toLowerCase() === (hospitalCodeOrId || "aiims-delhi").toLowerCase()
  ) || HOSPITALS[0];

  const queues = targetHospital.queueConfigs.map((qc, idx) => {
    const queueTokens = Array.from(memoryTokens.values()).filter(
      (t) => t.queue.code === qc.code && t.hospitalCode === targetHospital.code && t.status === "WAITING"
    );

    return {
      id: `queue-${targetHospital.code.toLowerCase()}-${qc.code.toLowerCase()}`,
      name: qc.name,
      code: qc.code,
      department: qc.department,
      description: qc.description,
      status: "ACTIVE",
      estimatedServiceTime: qc.estimatedServiceTime,
      waitingCount: queueTokens.length,
      activeCounters: 1,
      waitingTokens: queueTokens.map((t) => ({
        id: t.id,
        displayNumber: t.displayNumber,
        position: t.position,
        priority: t.priority,
        visitorName: t.visitorName,
        purpose: t.purpose,
        createdAt: t.createdAt,
      })),
    };
  });

  return {
    hospital: targetHospital.name,
    hospitalCode: targetHospital.code,
    queues,
  };
}

export function saveFallbackToken(token: FallbackToken) {
  memoryTokens.set(token.id, token);
  return token;
}

export function getFallbackToken(id: string): FallbackToken | undefined {
  return memoryTokens.get(id);
}

export function listFallbackTokens(hospitalCode?: string | null): FallbackToken[] {
  const tokens = Array.from(memoryTokens.values());
  if (!hospitalCode || hospitalCode === "ALL") return tokens;
  return tokens.filter((t) => t.hospitalCode.toLowerCase() === hospitalCode.toLowerCase());
}

export function cancelFallbackToken(id: string): FallbackToken | null {
  const token = memoryTokens.get(id);
  if (!token) return null;
  token.status = "CANCELLED";
  memoryTokens.set(id, token);
  return token;
}
