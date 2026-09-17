"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  ShieldAlert,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  QrCode,
  Smartphone,
  Share2,
  Activity,
  Volume2,
  VolumeX,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { QRCodeDisplay } from "@/components/ui/QRCodeDisplay";
import { EmergencyModal } from "@/components/visitor/EmergencyModal";
import { LiveQueueHero } from "@/components/queue/QueuePositionCounter";
import { useRealtimeQueue } from "@/components/hooks/useRealtimeQueue";
import { PatientCareAssistant } from "@/components/visitor/PatientCareAssistant";

interface TokenDetail {
  id: string;
  displayNumber: string;
  sequenceNumber: number;
  queueId: string;
  visitorSessionId: string;
  visitorName: string;
  purpose: string;
  chiefComplaint?: string | null;
  vitalSigns?: any;
  riskFlags?: string[];
  triageLevel?: string;
  currentStage?: string;
  targetDepartment?: string;
  isDeteriorating?: boolean;
  starvationAlert?: boolean;
  status: "WAITING" | "CALLED" | "SERVING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  position: number;
  priority: "STANDARD" | "EMERGENCY";
  counterId: string | null;
  createdAt: string;
  calledAt: string | null;
  queue: {
    id: string;
    name: string;
    code: string;
    department: string;
    estimatedServiceTime: number;
  };
  counter: {
    id: string;
    number: number;
    name: string;
  } | null;
  emergencyRequest: {
    id: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    requestedAt?: string;
    notes: string | null;
  } | null;
}

export default function VisitorMobilePassPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params.id as string;

  const [token, setToken] = useState<TokenDetail | null>(null);
  const [estimatedWaitMins, setEstimatedWaitMins] = useState<number>(0);
  const [peopleAhead, setPeopleAhead] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [ticketUrl, setTicketUrl] = useState<string>("");
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [failSafeCountdown, setFailSafeCountdown] = useState<number>(60);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [audioLanguage, setAudioLanguage] = useState<"hi-IN" | "en-IN">("hi-IN");
  const lastAnnouncedRef = useRef<string>("");

  // Synthesize dual-tone hospital chime via Web Audio API (pre-speech attention alert)
  const playHospitalChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Tone 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.2);
      gain2.gain.setValueAtTime(0.22, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);
    } catch (e) {
      // Audio context silenced if unprompted
    }
  }, []);

  // Voice Announcement Announcer via browser SpeechSynthesis
  const speakAnnouncement = useCallback(
    (hindiText: string, englishText: string) => {
      if (!isAudioEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      try {
        playHospitalChime();

        // Trigger gentle haptic vibration
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate([150, 100, 200]);
          } catch (e) {}
        }

        setTimeout(() => {
          window.speechSynthesis.cancel();
          const isHindi = audioLanguage === "hi-IN";
          const textToSpeak = isHindi ? hindiText : englishText;
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = audioLanguage;
          utterance.rate = 0.92;
          utterance.pitch = 1.0;

          const voices = window.speechSynthesis.getVoices();
          if (isHindi) {
            const hiVoice = voices.find(
              (v) => v.lang.startsWith("hi") || v.name.toLowerCase().includes("hindi")
            );
            if (hiVoice) utterance.voice = hiVoice;
          } else {
            const enVoice = voices.find(
              (v) => v.lang.startsWith("en-IN") || v.lang.startsWith("en-US")
            );
            if (enVoice) utterance.voice = enVoice;
          }

          window.speechSynthesis.speak(utterance);
        }, 400);
      } catch (err) {
        console.warn("Speech synthesis error:", err);
      }
    },
    [isAudioEnabled, audioLanguage, playHospitalChime]
  );

  const handleTestAudio = () => {
    speakAnnouncement(
      `आवाज़ चालू है। टोकन ${token?.displayNumber || "A-101"} के आगे ${peopleAhead} मरीज़ हैं।`,
      `Voice alert enabled. Token ${token?.displayNumber || "A-101"} has ${peopleAhead} patients ahead.`
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTicketUrl(window.location.href);
    }
  }, []);

  // Fetch authoritative fresh state
  const fetchTokenState = useCallback(async () => {
    if (!tokenId) return;
    try {
      const res = await fetch(`/api/tokens/${tokenId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Token not found");
      }
      setToken(data.token);
      setEstimatedWaitMins(data.estimatedWaitMins || 0);
      setPeopleAhead(data.peopleAhead || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unable to synchronize queue state");
    } finally {
      setIsLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    fetchTokenState();
  }, [fetchTokenState]);

  // Proximity Queue Milestone Tracker: 5 ahead, 2 ahead, and Called
  useEffect(() => {
    if (!token) return;

    if (token.status === "CALLED" || token.status === "SERVING") {
      if (lastAnnouncedRef.current !== "CALLED") {
        lastAnnouncedRef.current = "CALLED";
        speakAnnouncement(
          `टोकन नंबर ${token.displayNumber}, आपका नंबर आ गया है! कृपया ${
            token.counter?.name || "कमरा नंबर 1"
          } में तुरंत जाएं।`,
          `Token ${token.displayNumber}, your turn has arrived! Please proceed to ${
            token.counter?.name || "Counter 1"
          } immediately.`
        );
      }
    } else if (token.status === "WAITING") {
      if (peopleAhead <= 2 && peopleAhead > 0) {
        if (lastAnnouncedRef.current !== "2_AHEAD" && lastAnnouncedRef.current !== "CALLED") {
          lastAnnouncedRef.current = "2_AHEAD";
          speakAnnouncement(
            `सावधान! टोकन ${token.displayNumber}, आपके आगे केवल 2 मरीज़ हैं। कृपया डॉक्टर के कमरे के बाहर आ जाएं।`,
            `Attention! Token ${token.displayNumber}, only 2 patients ahead. Please wait right outside the doctor's room.`
          );
        }
      } else if (peopleAhead <= 5 && peopleAhead > 2) {
        if (
          lastAnnouncedRef.current !== "5_AHEAD" &&
          lastAnnouncedRef.current !== "2_AHEAD" &&
          lastAnnouncedRef.current !== "CALLED"
        ) {
          lastAnnouncedRef.current = "5_AHEAD";
          speakAnnouncement(
            `कृपया ध्यान दें, टोकन ${token.displayNumber}, आपके आगे केवल 5 मरीज़ हैं। कृपया ओपीडी एरिया के पास आ जाएं।`,
            `Please note, token ${token.displayNumber}, only 5 patients ahead. Please move near the OPD waiting area.`
          );
        }
      }
    }
  }, [token, peopleAhead, speakAnnouncement]);

  // 60-Second Dead-Man's Switch Timer for Pending Emergency Requests
  useEffect(() => {
    if (!token?.emergencyRequest || token.emergencyRequest.status !== "PENDING") {
      setFailSafeCountdown(60);
      return;
    }

    const reqTime = token.emergencyRequest.requestedAt
      ? new Date(token.emergencyRequest.requestedAt).getTime()
      : Date.now();

    const updateCountdown = () => {
      const elapsed = Math.floor((Date.now() - reqTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setFailSafeCountdown(remaining);

      if (remaining === 0) {
        fetchTokenState();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [token?.emergencyRequest, fetchTokenState]);

  // Realtime hook with instant reconciliation
  const { connectionState } = useRealtimeQueue({
    tokenId,
    onEvent: () => {
      fetchTokenState();
    },
    onReconcile: () => {
      fetchTokenState();
    },
  });

  const handleCancelToken = async () => {
    if (!confirm("Are you sure you want to cancel your active queue token?")) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/tokens/${tokenId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel token");
      }
      await fetchTokenState();
    } catch (err: any) {
      alert(err.message || "Failed to cancel token");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
          Synchronizing Live Queue State...
        </span>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-xl border border-red-900/50 bg-red-950/20 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <h2 className="text-base font-mono uppercase font-bold text-red-300">
          Queue State Unavailable
        </h2>
        <p className="text-xs text-zinc-400">
          {error || "Unable to find the specified queue token reference."}
        </p>
        <Link href="/">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Return to Check-in
          </Button>
        </Link>
      </div>
    );
  }

  const isEmergency = token.priority === "EMERGENCY";
  const isCalled = token.status === "CALLED" || token.status === "SERVING";
  const isCompleted = token.status === "COMPLETED";
  const isCancelled = token.status === "CANCELLED";
  const isNoShow = token.status === "NO_SHOW";
  const hasPendingEmergency = token.emergencyRequest?.status === "PENDING";
  const hasApprovedEmergency = token.emergencyRequest?.status === "APPROVED";
  const hasRejectedEmergency = token.emergencyRequest?.status === "REJECTED";

  const getStageIndex = (stage?: string) => {
    switch (stage) {
      case "TRIAGE_INTAKE":
        return 0;
      case "DOCTOR_CONSULTATION":
        return 1;
      case "DIAGNOSTICS_LAB":
      case "DIAGNOSTICS_IMAGING":
        return 2;
      case "PHARMACY_DISPENSING":
        return 3;
      case "COMPLETED":
        return 4;
      default:
        return 0;
    }
  };
  const currentStepIndex = getStageIndex(token.currentStage);

  return (
    <div className="max-w-md mx-auto space-y-5 sm:space-y-6 pb-12">
      {/* Top Header & Connection Badge */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            title="Show Ticket QR"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <ConnectionBadge state={connectionState} />
        </div>
      </div>

      {/* Surface Header */}
      {/* Audio Announcement Controls & Live Proximity Status Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                isAudioEnabled
                  ? "border-emerald-600 bg-emerald-950/60 text-emerald-300 shadow-sm"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500"
              }`}
              title="Toggle Audio Turn Announcements"
            >
              {isAudioEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              )}
              <span>{isAudioEnabled ? "आवाज़ चालू (Audio ON)" : "मूक (Mute)"}</span>
            </button>

            {/* Test Audio Button */}
            {isAudioEnabled && (
              <button
                type="button"
                onClick={handleTestAudio}
                className="px-2 py-1 rounded text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition-colors"
                title="Test Voice Announcement"
              >
                🔊 टेस्ट
              </button>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-xs font-mono">
            <button
              type="button"
              onClick={() => setAudioLanguage("hi-IN")}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                audioLanguage === "hi-IN"
                  ? "bg-emerald-600 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              🇮🇳 हिंदी
            </button>
            <button
              type="button"
              onClick={() => setAudioLanguage("en-IN")}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                audioLanguage === "en-IN"
                  ? "bg-emerald-600 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              🇬🇧 Eng
            </button>
          </div>
        </div>

        {/* Live Proximity Milestone Alert Banners */}
        {token.status === "WAITING" && peopleAhead <= 2 && (
          <div className="rounded-lg border border-orange-500/80 bg-orange-950/40 p-2.5 flex items-center justify-between gap-2 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <span className="text-xs font-bold text-orange-200">
                ⚠️ ध्यान दें: केवल {peopleAhead} मरीज आगे हैं!
              </span>
            </div>
            <span className="text-[10px] font-mono text-orange-300 font-bold uppercase bg-orange-900/60 px-2 py-0.5 rounded border border-orange-700/60">
              कमरे के बाहर पहुंचें
            </span>
          </div>
        )}

        {token.status === "WAITING" && peopleAhead > 2 && peopleAhead <= 5 && (
          <div className="rounded-lg border border-amber-500/70 bg-amber-950/30 p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-amber-200">
                🔔 केवल {peopleAhead} मरीज आगे हैं।
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded border border-amber-700/50">
              ओपीडी के पास आ जाएं
            </span>
          </div>
        )}
      </div>

      {/* Visual Linear 4-Stage Stepper */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400">
          <span>Clinical Care Pathway</span>
          <span className="text-zinc-200 font-semibold">
            {token.currentStage ? token.currentStage.replace(/_/g, " ") : "TRIAGE INTAKE"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          {[
            { label: "Triage Intake", active: currentStepIndex >= 0, current: currentStepIndex === 0 },
            { label: "Doctor Cabin", active: currentStepIndex >= 1, current: currentStepIndex === 1 },
            { label: "Diagnostics", active: currentStepIndex >= 2, current: currentStepIndex === 2 },
            { label: "Pharmacy", active: currentStepIndex >= 3, current: currentStepIndex === 3 },
          ].map((step, idx) => (
            <div
              key={idx}
              className={`text-center py-1.5 px-1 rounded text-[10px] font-mono border transition-colors ${
                step.current
                  ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold"
                  : step.active
                  ? "border-zinc-700 bg-zinc-800/60 text-zinc-300"
                  : "border-zinc-800/80 bg-zinc-950/40 text-zinc-600"
              }`}
            >
              <span className="block truncate">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Distress Alert Banner */}
      {token.isDeteriorating && (
        <div className="rounded-lg border border-rose-600/90 bg-rose-950/50 p-3 flex items-start gap-2.5 animate-pulse">
          <Activity className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-mono uppercase font-bold text-rose-200 block">
              Clinical Distress Reported
            </span>
            <span className="text-rose-300/80 text-[11px]">
              Nursing station alerted. Your position has been escalated to immediate review.
            </span>
          </div>
        </div>
      )}

      {/* Emergency Status Banner if active */}
      {hasPendingEmergency && (
        <div className="rounded-xl border-2 border-amber-600/90 bg-amber-950/40 p-4 space-y-2.5 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-mono">
              <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
              <span>आपातकालीन समीक्षा सक्रिय / Priority Review Active</span>
            </div>
            <div className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex-shrink-0">
              {failSafeCountdown > 0 ? `Fail-safe: ${failSafeCountdown}s` : "Auto-Promoting..."}
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            स्टाफ डेस्क पर आपातकालीन अलार्म भेजा गया है।
            <span className="block font-bold text-amber-200 mt-1">
              सुरक्षा गारंटी (Fail-Safe): यदि 60 सेकंड में स्टाफ उपस्थित नहीं हुआ, तो सिस्टम आपको स्वचालित रूप से #1 पर प्रमोट कर देगा।
            </span>
          </p>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 transition-all duration-1000"
              style={{ width: `${Math.min(100, Math.max(0, (failSafeCountdown / 60) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {hasApprovedEmergency && (
        <div className="rounded-xl border-2 border-red-600 bg-red-950/40 p-4 flex items-start gap-3 shadow-lg shadow-red-950/40">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
          <div className="text-xs">
            <span className="font-mono uppercase font-bold text-red-300 block text-sm">
              आपातकाल स्वीकृत (Priority #1 Approved)
            </span>
            <span className="text-zinc-200 text-xs block mt-1">
              आपकी आपातकालीन स्थिति सत्यापित हो चुकी है। आप कतार में <strong>सर्वोच्च #1 स्थान</strong> पर हैं। कृपया सीधे आपातकालीन डॉक्टर के पास पहुंचें।
            </span>
          </div>
        </div>
      )}

      {hasRejectedEmergency && (
        <div className="rounded-xl border-2 border-amber-800/80 bg-amber-950/30 p-3.5 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-mono uppercase font-bold text-amber-300 block">
              आपातकालीन अनुरोध अस्वीकृत (Anti-Spoof Penalty Applied)
            </span>
            <span className="text-zinc-400 text-[11px] block mt-0.5">
              स्टाफ समीक्षा में स्थिति आपातकालीन नहीं पाई गई। लाइन काटने से रोकने के नियम अनुसार, आपका टोकन कतार के अंत में स्थानांतरित किया गया है।
            </span>
          </div>
        </div>
      )}

      {/* Smart Grounded Patient Care Assistant (Precautions, Expected Tests & FAQs) */}
      <PatientCareAssistant
        token={token}
        preferredLang={audioLanguage === "hi-IN" ? "hi" : "en"}
      />

      {/* Dominant Visual State: NOW SERVING TAKEOVER */}
      {isCalled && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-emerald-950/30 p-6 sm:p-8 text-center shadow-[0_0_40px_rgba(16,185,129,0.2)] animate-pulse">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 font-mono text-xs font-bold uppercase tracking-widest mb-3">
            NOW SERVING
          </span>
          <div className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-wider my-2">
            {token.displayNumber}
          </div>
          <div className="mt-4 pt-4 border-t border-emerald-800/80">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 block">
              Please Proceed To
            </span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white mt-1 block">
              {token.counter?.name || "Counter 01"}
            </span>
          </div>
          <p className="mt-4 text-xs text-emerald-300/80 font-mono">
            Operator is ready to assist you.
          </p>
        </div>
      )}

      {/* COMPLETED STATE */}
      {isCompleted && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <span className="font-mono text-base font-bold uppercase tracking-wider text-zinc-100 block">
            Service Complete
          </span>
          <p className="text-xs text-zinc-400">
            Token {token.displayNumber} has completed service. Thank you for visiting!
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="secondary" size="sm">
                Join Another Queue
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* CANCELLED STATE */}
      {isCancelled && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-8 text-center space-y-3">
          <XCircle className="w-10 h-10 text-red-400 mx-auto" />
          <span className="font-mono text-base font-bold uppercase tracking-wider text-red-300 block">
            Token Cancelled
          </span>
          <p className="text-xs text-zinc-400">
            This token was cancelled and removed from the active queue.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="secondary" size="sm">
                Get New Token
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* NO SHOW STATE */}
      {isNoShow && (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-8 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <span className="font-mono text-base font-bold uppercase tracking-wider text-amber-300 block">
            Marked as No-Show
          </span>
          <p className="text-xs text-zinc-400">
            Your turn was called, but the counter recorded no response.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="secondary" size="sm">
                Rejoin Queue
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* WAITING HERO COMPONENT - LOCKED COMPONENT SPEC */}
      {token.status === "WAITING" && (
        <div className="space-y-4">
          <LiveQueueHero
            position={token.position}
            estimatedWaitMins={estimatedWaitMins}
            tokenNumber={token.displayNumber}
            isEmergency={isEmergency}
          />

          {/* People Ahead Context */}
          <div className="flex items-center justify-between px-2 text-xs font-mono text-zinc-400">
            <span>
              {peopleAhead === 0
                ? "You are next in line"
                : `${peopleAhead} ${peopleAhead === 1 ? "person" : "people"} ahead of you`}
            </span>
            <span className="text-zinc-500 truncate max-w-[140px]">
              {token.visitorName}
            </span>
          </div>
        </div>
      )}

      {/* Token Metadata Card */}
      <Panel className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500 uppercase">Chief Complaint</span>
          <span className="text-zinc-200 font-medium truncate max-w-[200px]">
            {token.chiefComplaint || token.purpose}
          </span>
        </div>

        {token.triageLevel && (
          <div className="flex items-center justify-between text-xs font-mono border-t border-zinc-850 pt-2">
            <span className="text-zinc-500 uppercase">Triage Acuity</span>
            <span className="text-zinc-300 font-bold">
              {token.triageLevel.replace("LEVEL_", "ESI ")}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-mono border-t border-zinc-850 pt-2">
          <span className="text-zinc-500 uppercase">Intake Timestamp</span>
          <span className="text-zinc-400">
            {new Date(token.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono border-t border-zinc-850 pt-2">
          <span className="text-zinc-500 uppercase">Current Status</span>
          <StatusBadge status={token.priority === "EMERGENCY" ? "EMERGENCY" : token.status} />
        </div>
      </Panel>

      {/* Action Controls for Active Waiting Tokens */}
      {token.status === "WAITING" && (
        <div className="space-y-3 pt-2">
          {!token.isDeteriorating && !token.emergencyRequest && (
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-mono font-bold text-xs sm:text-sm shadow-lg shadow-red-950/50 transition-all"
            >
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>🚨 आपातकाल / गंभीर तकलीफ (Report Emergency SOS)</span>
            </button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-zinc-500 hover:text-red-400"
            onClick={handleCancelToken}
            isLoading={isCancelling}
          >
            Cancel My Care Pass
          </Button>
        </div>
      )}

      {/* Emergency Request Modal */}
      <EmergencyModal
        tokenId={token.id}
        displayNumber={token.displayNumber}
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSubmitted={fetchTokenState}
      />

      {/* Share / Save QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center space-y-4">
            <h3 className="text-sm font-mono uppercase font-bold text-white">
              Pass #{token.displayNumber} QR
            </h3>
            <div className="flex justify-center">
              <QRCodeDisplay value={ticketUrl} size={180} />
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Scan on another phone to monitor this token
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setShowQrModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
