export interface ClientQueueEvent {
  id: string;
  sequenceId: number;
  type: string;
  tokenId?: string;
  queueId?: string;
  counterId?: string;
  data: Record<string, any>;
  timestamp: string;
}

const BROADCAST_CHANNEL_NAME = "triagepulse_realtime_bus";

export function broadcastLocalQueueEvent(event: Partial<ClientQueueEvent> & { type: string }) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const fullEvent: ClientQueueEvent = {
      id: event.id || `evt_local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sequenceId: event.sequenceId || Date.now(),
      type: event.type,
      tokenId: event.tokenId,
      queueId: event.queueId,
      counterId: event.counterId,
      data: event.data || {},
      timestamp: event.timestamp || new Date().toISOString(),
    };
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.postMessage(fullEvent);
    bc.close();
  } catch (err) {
    console.warn("BroadcastChannel postMessage error:", err);
  }
}
