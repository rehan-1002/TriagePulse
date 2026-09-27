"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Tv,
  Volume2,
  VolumeX,
  Clock,
  Building,
  CheckCircle2,
  Bell,
  ArrowRight,
} from "lucide-react";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { useRealtimeQueue } from "@/components/hooks/useRealtimeQueue";
import { QueueEventPayload } from "@/lib/realtime/events";
import { useHospital } from "@/components/hospital/HospitalProvider";

interface ServingCall {
  tokenId: string;
  displayNumber: string;
  patientName?: string;
  counterNumber: number;
  counterName: string;
  queueName: string;
  calledAt: string;
}

// Healthcare Privacy Compliance (HIPAA / NDHM) De-identification Helper
const formatDeidentifiedPatient = (displayNumber: string, patientName?: string) => {
  if (!patientName || patientName.trim() === "" || patientName.toLowerCase().includes("patient")) {
    return displayNumber;
  }
  const parts = patientName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return displayNumber;
  const initials = parts.map((p) => p[0]?.toUpperCase() + ".").join(" ");
  return `${displayNumber} (${initials})`;
};

// Clinical Station Mapping
const formatClinicalStationName = (counterNumber: number, fallbackName: string) => {
  switch (counterNumber) {
    case 1:
      return "Triage Desk";
    case 2:
      return "Doctor Cabin 1";
    case 3:
      return "Doctor Cabin 2";
    case 4:
      return "Phlebotomy Lab";
    case 5:
      return "Radiology Imaging";
    case 6:
      return "Central Pharmacy";
    default:
      return fallbackName.replace(/Counter\s*/i, "Station ");
  }
};

// Speech synthesis helper formatted for clinical announcements: "Patient P T 104, please proceed to Doctor Cabin 2."
const formatClinicalSpeechAnnouncement = (displayNumber: string, stationName: string) => {
  // Format letters with spaces for clear vocalization: "PT-104" -> "P T 104"
  const vocalToken = displayNumber.replace(/-/g, " ").replace(/([A-Za-z])/g, "$1 ");
  return `Patient ${vocalToken}, please proceed to ${stationName}.`;
};

export default function PublicDisplayPage() {
  const { currentHospital } = useHospital();
  const [currentCall, setCurrentCall] = useState<ServingCall | null>(null);
  const [recentCalls, setRecentCalls] = useState<ServingCall[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const announcedEventIdsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pre-fetch and cache available speech synthesis voices for iOS Safari / Chrome
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          availableVoicesRef.current = voices;
        }
      } catch (err) {
        console.warn("Error loading speech voices:", err);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Synthesize dual-tone hospital chime via persistent Web Audio API context
  const playHospitalChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      // Tone 1: 587.33 Hz (D5) - Bell Ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Tone 2: 880 Hz (A5) - High Dong
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.22);
      gain2.gain.setValueAtTime(0.45, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.85);
    } catch (e) {
      console.warn("Audio Context chime failed:", e);
    }
  }, []);

  // Web Speech API Voice Announcement with Chime & Safari/Chrome garbage-collection guard
  const announceCall = useCallback(
    (text: string, eventId: string) => {
      if (!isAudioEnabled) return;
      if (eventId && announcedEventIdsRef.current.has(eventId)) return; // Prevent duplicate speech
      if (eventId) announcedEventIdsRef.current.add(eventId);

      // 1. Play auditory chime immediately
      playHospitalChime();

      // 2. Synthesize vocal speech after chime intro
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          setTimeout(() => {
            try {
              window.speechSynthesis.resume();
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.rate = 0.92; // Clear operational cadence
              utterance.pitch = 1.0;
              utterance.volume = 1.0;

              const voices =
                availableVoicesRef.current.length > 0
                  ? availableVoicesRef.current
                  : window.speechSynthesis.getVoices();

              const preferredVoice = voices.find(
                (v) =>
                  v.lang.startsWith("en-IN") ||
                  v.lang.startsWith("en-US") ||
                  v.lang.startsWith("en-GB")
              );
              if (preferredVoice) utterance.voice = preferredVoice;

              // Retain utterance reference on ref & window so iOS Safari does not garbage-collect it mid-sentence
              activeUtteranceRef.current = utterance;
              (window as any).__lastDisplayUtterance = utterance;

              utterance.onend = () => {
                activeUtteranceRef.current = null;
              };
              utterance.onerror = () => {
                activeUtteranceRef.current = null;
              };

              window.speechSynthesis.speak(utterance);
            } catch (err) {
              console.warn("Speech Synthesis speak error:", err);
            }
          }, 450);
        } catch (err) {
          console.warn("Speech Synthesis error:", err);
        }
      }
    },
    [isAudioEnabled, playHospitalChime]
  );

  // Permanent Audio Engine Unlock (primes Web Audio & Speech on first user touch)
  const unlockAudioEngine = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume().catch(() => {});
        }
        // Warm up audio buffer for iOS WebKit
        const buffer = audioCtxRef.current.createBuffer(1, 1, 22050);
        const src = audioCtxRef.current.createBufferSource();
        src.buffer = buffer;
        src.connect(audioCtxRef.current.destination);
        src.start(0);
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.resume();
        availableVoicesRef.current = window.speechSynthesis.getVoices();
      }

      setHasInteracted(true);
      setIsAudioEnabled(true);
      playHospitalChime();
    } catch (err) {
      console.warn("Error unlocking audio engine:", err);
    }
  }, [playHospitalChime]);

  // Manual Test Audio Trigger
  const handleTestAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    unlockAudioEngine();
    setTimeout(() => {
      announceCall("Attention: Patient A 101, please proceed to Doctor Cabin 1.", `test_${Date.now()}`);
    }, 200);
  };

  // Fetch initial active counters & called tokens
  const fetchDisplayState = useCallback(async () => {
    try {
      const [cRes, tRes] = await Promise.allSettled([
        fetch("/api/counters").then((r) => r.json()),
        fetch("/api/tokens?status=CALLED").then((r) => r.json()),
      ]);

      let callFound: ServingCall | null = null;

      if (cRes.status === "fulfilled" && cRes.value.success && cRes.value.counters) {
        const busyCounters = cRes.value.counters.filter(
          (c: any) => c.currentServingTokenId && c.currentServingToken
        );

        if (busyCounters.length > 0) {
          const latest = busyCounters[0];
          callFound = {
            tokenId: latest.currentServingToken.id,
            displayNumber: latest.currentServingToken.displayNumber,
            patientName: latest.currentServingToken.visitorName || latest.currentServingToken.patientName,
            counterNumber: latest.number,
            counterName: formatClinicalStationName(latest.number, latest.name),
            queueName: latest.queue?.name || "Clinical Pathway",
            calledAt: latest.currentServingToken.calledAt || new Date().toISOString(),
          };
        }
      }

      if (!callFound && tRes.status === "fulfilled" && tRes.value.success && tRes.value.tokens?.length > 0) {
        const latestToken = tRes.value.tokens[0];
        const counterNum = latestToken.counter?.number || 1;
        const rawName = latestToken.counter?.name || "Station 01";
        callFound = {
          tokenId: latestToken.id,
          displayNumber: latestToken.displayNumber,
          patientName: latestToken.visitorName || latestToken.patientName,
          counterNumber: counterNum,
          counterName: formatClinicalStationName(counterNum, rawName),
          queueName: latestToken.queue?.name || "Clinical Pathway",
          calledAt: latestToken.calledAt || new Date().toISOString(),
        };
      }

      if (callFound) {
        setCurrentCall(callFound);
        setRecentCalls((prev) => {
          if (!prev.some((c) => c.displayNumber === callFound!.displayNumber)) {
            return [callFound!, ...prev.slice(0, 4)];
          }
          return prev;
        });
      } else {
        // No counter is actively serving or calling a token — clear hero view
        setCurrentCall(null);
      }
    } catch (err) {
      console.error("Failed to load display state:", err);
    }
  }, []);

  useEffect(() => {
    fetchDisplayState();
  }, [fetchDisplayState]);

  // Handle Realtime Events
  const handleRealtimeEvent = useCallback(
    (event: QueueEventPayload) => {
      if (event.type === "TOKEN_CALLED" || event.type === "TOKEN_RECALLED") {
        const { token, counter } = event.data;
        if (token && counter) {
          const stationName = formatClinicalStationName(counter.number, counter.name);
          const newCall: ServingCall = {
            tokenId: token.id,
            displayNumber: token.displayNumber,
            patientName: token.visitorName || token.patientName,
            counterNumber: counter.number,
            counterName: stationName,
            queueName: token.queueName || "Clinical Pathway",
            calledAt: new Date().toISOString(),
          };

          setCurrentCall(newCall);
          setRecentCalls((prev) => [newCall, ...prev.filter((c) => c.displayNumber !== token.displayNumber).slice(0, 5)]);

          // Trigger clinical speech announcement with hospital chime
          const speechText = formatClinicalSpeechAnnouncement(token.displayNumber, stationName);
          announceCall(speechText, event.id);
        }
      } else if (
        event.type === "TOKEN_COMPLETED" ||
        event.type === "TOKEN_NO_SHOW" ||
        event.type === "TOKEN_CANCELLED" ||
        event.type === "TOKEN_TRANSFERRED"
      ) {
        // Immediately remove completed/abandoned token from hero view
        setCurrentCall((prev) => {
          if (prev && (!event.tokenId || prev.tokenId === event.tokenId)) {
            return null;
          }
          return prev;
        });
        fetchDisplayState();
      } else {
        fetchDisplayState();
      }
    },
    [announceCall, fetchDisplayState]
  );

  const { connectionState } = useRealtimeQueue({
    onEvent: handleRealtimeEvent,
    onReconcile: () => {
      fetchDisplayState();
    },
  });

  // 2-second auto-polling fallback to guarantee display never falls out of sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDisplayState();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchDisplayState]);

  return (
    <div
      onClick={unlockAudioEngine}
      className="min-h-[85vh] flex flex-col justify-between space-y-8 max-w-7xl mx-auto select-none px-3 sm:px-6"
    >
      {/* Top TV Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                🏥 {currentHospital.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-mono font-extrabold tracking-wider text-white mt-0.5">
              {currentHospital.code} CLINICAL FLOW DISPLAY
            </h1>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
              {currentHospital.tagline} • Live OPD & Emergency Screen
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          {/* Digital Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-zinc-900 border border-zinc-800">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="font-mono text-base sm:text-xl font-bold tracking-widest text-zinc-100 tabular-nums">
              {currentTime || "00:00:00"}
            </span>
          </div>

          {/* Test Audio Button */}
          <button
            onClick={handleTestAudio}
            title="Test hospital chime and voice announcement"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs font-mono text-emerald-300 hover:bg-emerald-900 hover:text-white transition"
          >
            <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Test Chime</span>
          </button>

          {/* Audio Announce Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAudioEnabled(!isAudioEnabled);
              if (!hasInteracted) unlockAudioEngine();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white"
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Voice ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="hidden sm:inline">Voice Muted</span>
              </>
            )}
          </button>

          <ConnectionBadge state={connectionState} />
        </div>
      </div>

      {/* Browser Autoplay Standby Prompt / Live Status */}
      {!hasInteracted ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            unlockAudioEngine();
          }}
          className="cursor-pointer bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-emerald-950/90 border-2 border-emerald-500/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-200 text-xs sm:text-sm font-mono animate-pulse hover:border-emerald-400 transition-all shadow-[0_0_35px_rgba(16,185,129,0.25)]"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-emerald-500 text-black shrink-0 animate-bounce">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block text-sm sm:text-base">
                Tap anywhere to unlock iPad / Screen Audio
              </span>
              <span className="text-emerald-300/80 text-xs">
                Unlocks acoustic chimes & vocal announcements. Audio runs 100% hands-free and automatic after this tap!
              </span>
            </div>
          </div>
          <button
            onClick={handleTestAudio}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-mono font-bold rounded-xl text-xs tracking-wider shrink-0 shadow-lg transition"
          >
            TAP TO ACTIVATE AUDIO ⚡
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-3 py-1.5 flex items-center justify-between text-xs font-mono text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Automatic Audio System Active • Calling out patient tokens live</span>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">iPadOS / WebKit Audio Context Live</span>
        </div>
      )}

      {/* Main Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto">
        {/* Dominant Hero Call Card (TV View Distance Hero) */}
        <div className="lg:col-span-8">
          <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/80 bg-zinc-950 p-8 sm:p-12 text-center shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center min-h-[420px]">
            {/* Top Indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-xs sm:text-sm font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              NOW CALLING / SERVING
            </div>

            {currentCall ? (
              <div className="space-y-6 w-full">
                {/* Hero Token Display Number & De-identified Patient */}
                <div>
                  <div className="font-mono text-7xl sm:text-9xl font-black text-white tracking-widest tabular-nums leading-none">
                    {currentCall.displayNumber}
                  </div>
                  {currentCall.patientName && (
                    <div className="text-sm sm:text-base font-mono font-medium text-zinc-400 mt-3">
                      Patient: {formatDeidentifiedPatient(currentCall.displayNumber, currentCall.patientName)}
                    </div>
                  )}
                </div>

                {/* Counter & Proceed Instruction */}
                <div className="pt-6 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 block">
                      PROCEED TO STATION
                    </span>
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-wider">
                      {currentCall.counterName}
                    </span>
                  </div>

                  <div className="hidden sm:block h-10 w-px bg-zinc-800" />

                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 block">
                      CLINICAL PATHWAY
                    </span>
                    <span className="text-sm font-mono text-zinc-300 font-semibold">
                      {currentCall.queueName}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Tv className="w-16 h-16 text-zinc-700 mx-auto" />
                <span className="font-mono text-2xl font-bold uppercase text-zinc-400 block tracking-wider">
                  Waiting for Next Call
                </span>
                <span className="text-sm font-mono text-zinc-600">
                  Clinical stations will announce patient tokens shortly.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Calls Ledger */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <span className="text-xs font-mono uppercase font-bold tracking-widest text-zinc-300">
                Recent Calls
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Clinical Routing Ledger
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {recentCalls.length > 0 ? (
                recentCalls.map((call, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 font-mono"
                  >
                    <div>
                      <span className="text-base font-bold text-zinc-200 tracking-wider block">
                        {formatDeidentifiedPatient(call.displayNumber, call.patientName)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-xs font-semibold text-emerald-400">
                        {call.counterName}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-xs font-mono text-zinc-600">
                  No prior calls recorded today.
                </div>
              )}
            </div>

            {/* Public Audio Hint */}
            {!hasInteracted && (
              <div className="mt-4 pt-3 border-t border-zinc-850 text-center">
                <span className="text-[10px] font-mono text-zinc-500">
                  Tap anywhere on screen to enable audio speech
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer System Ticker */}
      <div className="border-t border-zinc-900 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-2">
        <span>Please have your Patient Clinical Care Pass or token reference ready upon approach.</span>
        <span>Clinical Flow Realtime Broadcast • De-identified Patient Stream</span>
      </div>
    </div>
  );
}
