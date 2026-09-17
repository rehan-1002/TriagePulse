"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldAlert,
  Stethoscope,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { useVoiceAssistant } from "../voice/useVoiceAssistant";

interface PatientCareAssistantProps {
  token: {
    id: string;
    displayNumber: string;
    vitalSigns?: any;
    targetDepartment?: string;
    queue?: {
      name: string;
      department: string;
    };
  };
  preferredLang?: "hi" | "en";
}

export function PatientCareAssistant({ token, preferredLang = "hi" }: PatientCareAssistantProps) {
  const [lang, setLang] = useState<"hi" | "en">(preferredLang);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [faqInput, setFaqInput] = useState<string>("");
  const [isFaqLoading, setIsFaqLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: "user" | "assistant"; text: string }>
  >([]);

  const rag = token.vitalSigns?.ragClinical;
  const precautions = rag?.precautions;
  const anticipatedOrders = rag?.anticipatedOrders || [];
  const voiceScript = rag?.patientVoiceScript;

  const {
    isListening,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSpeaking,
  } = useVoiceAssistant();

  const handleReplaySpokenGuidance = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const script =
      lang === "hi"
        ? voiceScript?.hi || `आपका टोकन नंबर ${token.displayNumber} है। कृपया धैर्यपूर्वक प्रतीक्षा करें।`
        : voiceScript?.en || `Your token number is ${token.displayNumber}. Please wait for your turn.`;

    speak(script, lang === "hi" ? "hi-IN" : "en-IN");
  };

  const handleAskFaq = async (queryToAsk?: string) => {
    const q = (queryToAsk || faqInput).trim();
    if (!q) return;

    setFaqInput("");
    setChatHistory((prev) => [...prev, { sender: "user", text: q }]);
    setIsFaqLoading(true);

    try {
      const res = await fetch("/api/ai/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, language: lang }),
      });
      const data = await res.json();
      if (data.success && data.answer) {
        setChatHistory((prev) => [...prev, { sender: "assistant", text: data.answer }]);
        speak(data.answer, lang === "hi" ? "hi-IN" : "en-IN");
      } else {
        const errorText =
          lang === "hi"
            ? "उत्तर प्राप्त करने में असमर्थ। कृपया मुख्य सहायता केंद्र से संपर्क करें।"
            : "Unable to retrieve answer. Please check at the Main Help Desk.";
        setChatHistory((prev) => [...prev, { sender: "assistant", text: errorText }]);
      }
    } catch (err) {
      const errFallback =
        lang === "hi"
          ? "नेटवर्क त्रुटि। कृपया सहायता केंद्र पर संपर्क करें।"
          : "Network error. Please ask the hospital help desk.";
      setChatHistory((prev) => [...prev, { sender: "assistant", text: errFallback }]);
    } finally {
      setIsFaqLoading(false);
    }
  };

  const quickQuestions =
    lang === "hi"
      ? [
          "क्या मुझे ब्लड टेस्ट के लिए खाली पेट रहना होगा?",
          "अल्ट्रासाउंड (सोनोग्राफी) से पहले क्या तैयारी चाहिए?",
          "डॉक्टर मुझसे क्या सवाल और रिपोर्ट्स मांगेंगे?",
          "खून जांच की रिपोर्ट कब और कहां मिलेगी?",
        ]
      : [
          "Do I need to be fasting for a blood test?",
          "How to prepare for an abdominal ultrasound?",
          "What will the doctor ask me?",
          "Where is the diagnostic blood lab?",
        ];

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-zinc-950 to-slate-950 p-4 sm:p-5 shadow-xl space-y-4 text-white">
      {/* Header with Accordion Toggle & Audio Playback */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>{lang === "hi" ? "स्मार्ट मरीज सहायक" : "Smart Care Assistant"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                AI GROUNDED
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              {lang === "hi"
                ? "जरूरी सावधानियां, संभावित जांच व अस्पताल सहायता"
                : "Precautions, anticipated tests & hospital guidance"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Replay */}
          <button
            type="button"
            onClick={handleReplaySpokenGuidance}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60 transition"
            title="Listen to Guidance"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">{lang === "hi" ? "सुनें" : "Listen"}</span>
              </>
            )}
          </button>

          {/* Language Switch */}
          <button
            type="button"
            onClick={() => setLang(lang === "hi" ? "en" : "hi")}
            className="px-2 py-1 rounded-md text-[11px] font-mono border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
          >
            {lang === "hi" ? "🇬🇧 EN" : "🇮🇳 हिंदी"}
          </button>

          {/* Toggle Expand */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-zinc-400 hover:text-white"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4 animate-fadeIn">
          {/* Precautions Box */}
          {precautions && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>{lang === "hi" ? "जरूरी सावधानियां" : "Care Precautions"}</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {lang === "hi" ? precautions.hi : precautions.en}
              </p>
            </div>
          )}

          {/* Anticipated Tests Box */}
          {anticipatedOrders.length > 0 && (
            <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                <Stethoscope className="w-4 h-4" />
                <span>
                  {lang === "hi"
                    ? "डॉक्टर आपसे ये टेस्ट लिख सकते हैं (Anticipated Tests)"
                    : "Doctor May Order These Tests"}
                </span>
              </div>
              <ul className="text-xs text-sky-200/90 space-y-1 list-disc list-inside">
                {anticipatedOrders.map((order: string, idx: number) => (
                  <li key={idx}>{order}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick FAQ Question Chips */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "hi" ? "अक्सर पूछे जाने वाले सवाल (Quick Tap):" : "Frequently Asked Questions:"}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskFaq(q)}
                  disabled={isFaqLoading}
                  className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-emerald-950/50 border border-zinc-800 hover:border-emerald-700/50 text-zinc-300 hover:text-emerald-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] text-xs rounded-xl p-2.5 ${
                      msg.sender === "user"
                        ? "bg-emerald-600 text-white rounded-br-none"
                        : "bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-bl-none leading-relaxed"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ask Input with Voice Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskFaq();
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              value={faqInput}
              onChange={(e) => setFaqInput(e.target.value)}
              placeholder={
                lang === "hi"
                  ? "सवाल पूछें (उदा. 'फास्टिंग चाहिए क्या?')..."
                  : "Ask question (e.g. 'Fasting required?')..."
              }
              className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening(lang === "hi" ? "hi-IN" : "en-IN");
                }
              }}
              className={`p-2 rounded-xl border transition ${
                isListening
                  ? "bg-red-600 border-red-400 text-white animate-pulse"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
              title="Speak Question"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isFaqLoading || !faqInput.trim()}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 transition"
              title="Submit Question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
