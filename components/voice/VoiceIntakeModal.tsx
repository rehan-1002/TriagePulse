"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  X,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";
import { useVoiceAssistant } from "./useVoiceAssistant";

interface VoiceIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenCreated?: (token: any) => void;
}

export function VoiceIntakeModal({ isOpen, onClose, onTokenCreated }: VoiceIntakeModalProps) {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<"hi" | "en">("hi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    isListening,
    transcript,
    setTranscript,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceAssistant();

  if (!isOpen) return null;

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      setErrorMessage(null);
      startListening(selectedLang === "hi" ? "hi-IN" : "en-IN");
    }
  };

  const handleProcessVoice = async () => {
    const textToProcess = transcript.trim();
    if (!textToProcess) {
      setErrorMessage(
        selectedLang === "hi"
          ? "कृपया पहले माइक दबाकर अपनी समस्या बोलें।"
          : "Please tap the microphone and describe your symptoms first."
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/ai/voice-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: textToProcess,
          language: selectedLang,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to issue token via voice intake.");
      }

      setGeneratedResult(data);
      if (onTokenCreated) onTokenCreated(data.token);

      // Play audio announcement automatically
      if (data.spokenScript) {
        speak(data.spokenScript, selectedLang === "hi" ? "hi-IN" : "en-IN");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Voice processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 text-white">
        {/* Close Button */}
        <button
          onClick={() => {
            stopSpeaking();
            stopListening();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!generatedResult ? (
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                {selectedLang === "hi" ? "आवाज़ से टोकन लें (Zero Typing)" : "Voice-Only Intake"}
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {selectedLang === "hi" ? "बोलकर अपनी परेशानी बताएं" : "Describe Your Symptoms"}
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-md">
                {selectedLang === "hi"
                  ? "माइक पर टैप करें और बोलें। AI अपने आप सही विभाग और टोकन तय करेगा।"
                  : "Tap the mic and speak naturally. The AI will categorize urgency and issue your token."}
              </p>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setSelectedLang("hi");
                  if (isListening) stopListening();
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedLang === "hi"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🇮🇳 हिंदी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLang("en");
                  if (isListening) stopListening();
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedLang === "en"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            {/* Big Pulsing Mic Button */}
            <div className="relative my-2">
              {isListening && (
                <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
              )}
              <button
                type="button"
                onClick={toggleMic}
                disabled={isProcessing}
                className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl border-4 ${
                  isListening
                    ? "bg-red-600 border-red-400 scale-105 shadow-red-500/40 animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-500 border-emerald-400 shadow-emerald-500/30"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-10 h-10 text-white" />
                    <span className="text-[10px] font-bold uppercase mt-1 tracking-wider">
                      {selectedLang === "hi" ? "रोकें" : "Stop"}
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-10 h-10 text-white" />
                    <span className="text-[10px] font-bold uppercase mt-1 tracking-wider">
                      {selectedLang === "hi" ? "बोलें" : "Speak"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Live Transcript / Speech Indicator */}
            <div className="w-full min-h-[70px] p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {isListening
                  ? selectedLang === "hi"
                    ? "🎙️ सुन रहे हैं... कृपया बोलें..."
                    : "🎙️ Listening... Speak now..."
                  : selectedLang === "hi"
                  ? "सुनाई दिया (Transcribed):"
                  : "Transcribed Speech:"}
              </span>
              <p className="text-sm font-medium text-emerald-300 italic min-h-[24px]">
                {transcript ||
                  (selectedLang === "hi"
                    ? "उदाहरण: 'मुझे दो दिन से पेट दर्द है और चक्कर आ रहे हैं...'"
                    : "Example: 'Severe chest pain radiating to left arm since 1 hour...'")}
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-left w-full">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Confirm & Generate Button */}
            <div className="w-full flex gap-3">
              <button
                type="button"
                onClick={handleProcessVoice}
                disabled={isProcessing || !transcript.trim()}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>
                      {selectedLang === "hi" ? "टोकन बनाया जा रहा है..." : "Analyzing & Issuing Token..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {selectedLang === "hi"
                        ? "टोकन जारी करें (Generate Token)"
                        : "Generate Token Now"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Result & Voice Guidance Card */
          <div className="space-y-6 text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                    {selectedLang === "hi" ? "टोकन सफलतापूर्वक जारी हुआ" : "Token Confirmed"}
                  </span>
                  <h3 className="text-2xl font-black tracking-tight text-white">
                    {generatedResult.token.displayNumber}
                  </h3>
                </div>
              </div>

              {/* Audio Replay Button */}
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speak(
                      generatedResult.spokenScript,
                      selectedLang === "hi" ? "hi-IN" : "en-IN"
                    );
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60 transition"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>{selectedLang === "hi" ? "आवाज़ रोकें" : "Stop Audio"}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span>{selectedLang === "hi" ? "फिर से सुनें" : "Replay Audio"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Department & Priority Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {selectedLang === "hi" ? "विभाग (Department)" : "Department"}
                </span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  {generatedResult.queue.name}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {selectedLang === "hi" ? "प्राथमिकता (Priority)" : "Acuity Level"}
                </span>
                <p className="text-sm font-bold text-amber-300 mt-0.5">
                  {generatedResult.guidance.triageLevel.replace("LEVEL_", "Level ").replace("_", " ")}
                </p>
              </div>
            </div>

            {/* Precautions to Take */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>
                  {selectedLang === "hi" ? "जरूरी सावधानियां (Precautions)" : "Immediate Precautions"}
                </span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {selectedLang === "hi"
                  ? generatedResult.guidance.precautions.hi
                  : generatedResult.guidance.precautions.en}
              </p>
            </div>

            {/* Anticipated Doctor Questions & Tests */}
            <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-800/40 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                <Stethoscope className="w-4 h-4" />
                <span>
                  {selectedLang === "hi"
                    ? "डॉक्टर आपसे क्या जांच करा सकते हैं (Expected Tests)"
                    : "Tests Doctor May Order"}
                </span>
              </div>
              <ul className="text-xs text-sky-200/90 space-y-1 list-disc list-inside">
                {generatedResult.guidance.anticipatedOrders.map((order: string, idx: number) => (
                  <li key={idx}>{order}</li>
                ))}
              </ul>
            </div>

            {/* Navigate to Ticket Link */}
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                router.push(`/ticket/${generatedResult.token.id}`);
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2"
            >
              <span>
                {selectedLang === "hi"
                  ? "लाइव टिकट देखें (View Live Ticket)"
                  : "View Live Pass & Ticket"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
