"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  QrCode,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronLeft,
  Activity,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  HeartPulse,
  Wind,
  Droplet,
  Baby,
  Thermometer,
  Stethoscope,
  ShieldAlert,
  Volume2,
  VolumeX,
  User,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { QRCodeDisplay } from "@/components/ui/QRCodeDisplay";
import { useRealtimeQueue } from "@/components/hooks/useRealtimeQueue";
import { VoiceIntakeModal } from "@/components/voice/VoiceIntakeModal";

interface QueueItem {
  id: string;
  name: string;
  code: string;
  department: string;
  description: string;
  status: string;
  estimatedServiceTime: number;
  waitingCount: number;
  activeCounters: number;
  waitingTokens: any[];
}

// Universal Pictorial Symptom Cards for Low-Literacy / Illiterate Users
interface PictorialCard {
  id: string;
  icon: any;
  hindiTitle: string;
  englishTitle: string;
  hindiSub: string;
  englishSub: string;
  severity: "EMERGENCY" | "URGENT" | "STANDARD";
  severityLabelHindi: string;
  severityLabelEnglish: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  defaultComplaint: string;
  preferredQueueCode?: string; // "A" for Emergency, "B" for Urgent, "C" for Standard
}

const PICTORIAL_SYMPTOMS: PictorialCard[] = [
  {
    id: "chest-pain",
    icon: HeartPulse,
    hindiTitle: "छाती में तेज दर्द",
    englishTitle: "Severe Chest Pain / Heart",
    hindiSub: "सीने में दबाव, बाएं हाथ में दर्द, घबराहट",
    englishSub: "Pressure, sweating, radiating pain",
    severity: "EMERGENCY",
    severityLabelHindi: "अति आवश्यक (आपातकाल)",
    severityLabelEnglish: "EMERGENCY",
    colorBorder: "border-red-500",
    colorBg: "bg-red-950/40 hover:bg-red-950/60",
    colorText: "text-red-400",
    defaultComplaint: "छाती में तेज दर्द / Severe Chest Pain - Acute Cardiac Concern",
    preferredQueueCode: "A",
  },
  {
    id: "breathing-trouble",
    icon: Wind,
    hindiTitle: "सांस लेने में तकलीफ",
    englishTitle: "Difficulty Breathing",
    hindiSub: "दम फूलना, हांफना, सांस न आना",
    englishSub: "Shortness of breath, wheezing",
    severity: "URGENT",
    severityLabelHindi: "तत्काल सहायता",
    severityLabelEnglish: "URGENT",
    colorBorder: "border-amber-500",
    colorBg: "bg-amber-950/40 hover:bg-amber-950/60",
    colorText: "text-amber-400",
    defaultComplaint: "सांस लेने में तकलीफ / Shortness of Breath - Respiratory Distress",
    preferredQueueCode: "A",
  },
  {
    id: "severe-bleeding",
    icon: Droplet,
    hindiTitle: "गंभीर चोट या खून बहना",
    englishTitle: "Severe Bleeding & Injury",
    hindiSub: "दुर्घटना, कट लगना, गहरा घाव",
    englishSub: "Accident, deep wound, hemorrhage",
    severity: "EMERGENCY",
    severityLabelHindi: "अति आवश्यक (आपातकाल)",
    severityLabelEnglish: "EMERGENCY",
    colorBorder: "border-red-500",
    colorBg: "bg-red-950/40 hover:bg-red-950/60",
    colorText: "text-red-400",
    defaultComplaint: "गंभीर चोट या खून बहना / Severe Bleeding and Trauma",
    preferredQueueCode: "A",
  },
  {
    id: "pregnancy-labour",
    icon: Activity,
    hindiTitle: "प्रसव / गर्भावस्था",
    englishTitle: "Labour Pain / Pregnancy",
    hindiSub: "डिलीवरी दर्द, गर्भावस्था में परेशानी",
    englishSub: "Labour contractions, maternal distress",
    severity: "URGENT",
    severityLabelHindi: "महिला वार्ड",
    severityLabelEnglish: "MATERNITY",
    colorBorder: "border-purple-500",
    colorBg: "bg-purple-950/40 hover:bg-purple-950/60",
    colorText: "text-purple-400",
    defaultComplaint: "प्रसव पीड़ा या गर्भावस्था संबंधी आपातकाल / Labour & Pregnancy Alert",
    preferredQueueCode: "B",
  },
  {
    id: "sick-baby",
    icon: Baby,
    hindiTitle: "शिशु या बच्चा बीमार",
    englishTitle: "Sick Infant / Child",
    hindiSub: "बच्चा रो रहा है, दूध नहीं पी रहा, तेज बुखार",
    englishSub: "Lethargic baby, high fever, crying",
    severity: "URGENT",
    severityLabelHindi: "बाल रोग वार्ड",
    severityLabelEnglish: "PEDIATRIC",
    colorBorder: "border-blue-500",
    colorBg: "bg-blue-950/40 hover:bg-blue-950/60",
    colorText: "text-blue-400",
    defaultComplaint: "शिशु या बच्चा बीमार / Pediatric Acute Assessment",
    preferredQueueCode: "B",
  },
  {
    id: "high-fever",
    icon: Thermometer,
    hindiTitle: "तेज बुखार व चक्कर",
    englishTitle: "High Fever & Dizziness",
    hindiSub: "कांपना, शरीर में दर्द, चक्कर आकर गिरना",
    englishSub: "Chills, extreme weakness, fainting",
    severity: "STANDARD",
    severityLabelHindi: "सामान्य ओपीडी",
    severityLabelEnglish: "GENERAL OPD",
    colorBorder: "border-yellow-500",
    colorBg: "bg-yellow-950/30 hover:bg-yellow-950/50",
    colorText: "text-yellow-400",
    defaultComplaint: "तेज बुखार व चक्कर / High Fever, Chills and Weakness",
    preferredQueueCode: "B",
  },
  {
    id: "general-consult",
    icon: Stethoscope,
    hindiTitle: "सामान्य डॉक्टर जांच",
    englishTitle: "General Consultation",
    hindiSub: "दवा लिखवाना, पुरानी बीमारी, चेकअप",
    englishSub: "Routine consult, reports, prescription",
    severity: "STANDARD",
    severityLabelHindi: "नियमित ओपीडी",
    severityLabelEnglish: "ROUTINE OPD",
    colorBorder: "border-emerald-500",
    colorBg: "bg-emerald-950/30 hover:bg-emerald-950/50",
    colorText: "text-emerald-400",
    defaultComplaint: "सामान्य डॉक्टर जांच / Routine General Consultation",
    preferredQueueCode: "C",
  },
];

export default function CheckInPage() {
  const router = useRouter();

  // Mode: Default is "EASY" (No login, zero barriers for low-literacy patients)
  const [intakeMode, setIntakeMode] = useState<"EASY" | "CLINICAL">("EASY");

  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string>("");
  const [selectedPictorialId, setSelectedPictorialId] = useState<string>("");
  const [visitorName, setVisitorName] = useState<string>("");
  const [patientRelationship, setPatientRelationship] = useState<string>("स्वयं (Self)");
  const [purpose, setPurpose] = useState<string>("");
  const [chiefComplaint, setChiefComplaint] = useState<string>("");

  // Clinical Mode specifics
  const [showVitals, setShowVitals] = useState<boolean>(false);
  const [spO2, setSpO2] = useState<string>("");
  const [heartRate, setHeartRate] = useState<string>("");
  const [bloodPressure, setBloodPressure] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [knownConditions, setKnownConditions] = useState<string>("");

  // Submission and Status
  const [honeypot, setHoneypot] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");

  // Voice Input (Web Speech API)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [speechFeedback, setSpeechFeedback] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // AI Triage state (for detailed mode)
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAiTriaging, setIsAiTriaging] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Initialize URL & Voice Recognition capabilities
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(`${window.location.origin}/join`);

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  // Fetch initial queues
  const fetchQueues = useCallback(async () => {
    try {
      const res = await fetch("/api/queues", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.queues) {
        setQueues(data.queues);
        setSelectedQueueId((prev) => {
          if (prev && data.queues.some((q: any) => q.id === prev)) {
            return prev;
          }
          return data.queues[0]?.id || "";
        });
      }
    } catch (err) {
      console.error("Failed to load queues:", err);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  // Realtime subscription to live updates
  const { connectionState } = useRealtimeQueue({
    onEvent: () => fetchQueues(),
    onReconcile: () => fetchQueues(),
  });

  // 3-second auto-polling fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueues();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchQueues]);

  // Handle Pictorial Card Selection
  const handleSelectPictorial = (card: PictorialCard) => {
    setSelectedPictorialId(card.id);
    setChiefComplaint(card.defaultComplaint);
    setPurpose(card.defaultComplaint);

    // Auto-match preferred queue
    if (card.preferredQueueCode && queues.length > 0) {
      const matched = queues.find((q) => q.code === card.preferredQueueCode);
      if (matched) {
        setSelectedQueueId(matched.id);
      } else {
        setSelectedQueueId(queues[0].id);
      }
    }

    // Audio Feedback for illiterate / low-literacy users
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          card.severity === "EMERGENCY"
            ? `${card.hindiTitle} चुना गया। यह आपातकालीन श्रेणी है।`
            : `${card.hindiTitle} चुना गया।`
        );
        utterance.lang = "hi-IN";
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Audio synthesis fallback silent
      }
    }
  };

  // Start / Stop Voice Recognition
  const toggleVoiceInput = () => {
    if (!speechSupported) {
      alert("Voice input is not supported in this browser. Please tap a picture instead.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = voiceLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechFeedback(
          voiceLang === "hi-IN"
            ? "सुन रहे हैं... कृपया अपनी परेशानी बताएं..."
            : "Listening... Please describe your problem..."
        );
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(" ");

        setChiefComplaint(transcript);
        setPurpose(transcript);
        setSpeechFeedback(`"${transcript}"`);

        // Check for emergency keywords in speech
        const lower = transcript.toLowerCase();
        if (
          lower.includes("chest") ||
          lower.includes("छाती") ||
          lower.includes("सीने") ||
          lower.includes("सांस") ||
          lower.includes("breath") ||
          lower.includes("खून") ||
          lower.includes("blood") ||
          lower.includes("emergency")
        ) {
          const emergencyQueue = queues.find((q) => q.code === "A");
          if (emergencyQueue) setSelectedQueueId(emergencyQueue.id);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setSpeechFeedback(
          voiceLang === "hi-IN"
            ? "आवाज़ सुनाई नहीं दी। दोबारा माइक दबाएं।"
            : "Voice not detected. Tap mic again."
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech init error:", err);
      setIsListening(false);
    }
  };

  // One-Tap Instant Emergency SOS Handler
  const handleImmediateEmergencySOS = () => {
    const emergencyCard = PICTORIAL_SYMPTOMS[0]; // Chest pain / emergency
    handleSelectPictorial(emergencyCard);

    const emergencyQueue = queues.find((q) => q.code === "A") || queues[0];
    if (emergencyQueue) {
      setSelectedQueueId(emergencyQueue.id);
    }

    setChiefComplaint("🚨 तत्काल आपातकाल / IMMEDIATE CODE RED EMERGENCY");
    setPurpose("आपातकालीन चिकित्सा सहायता / Acute Resuscitation");

    // Audio confirmation
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          "आपातकाल दर्ज किया गया। कृपया सीधे इमरजेंसी वार्ड में जाएं।"
        );
        utterance.lang = "hi-IN";
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  };

  // Handle Token Creation
  const handleCreateToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedQueueId) {
      setError("कृपया अस्पताल विभाग या श्रेणी चुनें (Please select department).");
      return;
    }

    const complaint = (chiefComplaint || purpose).trim();
    if (!complaint) {
      setError("कृपया चित्र पर टैप करें या बोलकर बताएं (Please select a symptom picture or speak).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Audio announce token generation
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("आपका टोकन तैयार किया जा रहा है।");
        utterance.lang = "hi-IN";
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }

    try {
      const vitalsPayload: any = {};
      if (spO2.trim()) vitalsPayload.spO2 = Number(spO2.trim());
      if (heartRate.trim()) vitalsPayload.heartRate = Number(heartRate.trim());
      if (bloodPressure.trim()) vitalsPayload.bloodPressure = bloodPressure.trim();
      if (age.trim()) vitalsPayload.age = Number(age.trim());
      if (knownConditions.trim()) vitalsPayload.knownConditions = knownConditions.trim();

      const finalPatientName =
        visitorName.trim() ||
        (patientRelationship ? `मरीज़ (${patientRelationship})` : "मरीज़ (Patient)");

      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId: selectedQueueId,
          visitorName: finalPatientName,
          purpose: complaint,
          chiefComplaint: complaint,
          vitalSigns: Object.keys(vitalsPayload).length > 0 ? vitalsPayload : undefined,
          turnstileToken: "bypass-dev-token",
          honeypot,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Unable to create clinical ticket. Please check connection.");
      }

      if (!res.ok || !data || !data.success) {
        throw new Error(data?.error || "Failed to create token. Please try again.");
      }

      // Navigate to Patient Care Pass
      router.push(`/ticket/${data.token.id}`);
    } catch (err: any) {
      setError(err.message || "टोकन बनाने में समस्या आई (Failed to join queue)");
      setIsSubmitting(false);
    }
  };

  // AI Triage in Clinical mode
  const handleAiTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiTriaging(true);
    setError(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "TRIAGE", prompt: aiPrompt.trim() }),
      });
      const data = await res.json();
      if (data.success && data.suggestions && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions);
        setSelectedQueueId(data.suggestions[0].queueId);
        setChiefComplaint(aiPrompt.trim());
        setPurpose(aiPrompt.trim());
      }
    } catch (err) {
      console.error("AI Triage error:", err);
    } finally {
      setIsAiTriaging(false);
    }
  };

  const getQueueIcon = (code: string) => {
    switch (code) {
      case "A":
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case "B":
        return <Users className="w-5 h-5 text-blue-400" />;
      case "C":
        return <Clock className="w-5 h-5 text-amber-400" />;
      default:
        return <Users className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 px-3 sm:px-4">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> मुख्य पृष्ठ (Home)
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white flex items-center gap-2">
            <span>अस्पताल टोकन व जांच</span>
            <span className="text-emerald-400 text-sm font-normal">/ Patient OPD Token</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            बिना कतार में खड़े रहे तुरंत टोकन प्राप्त करें (Fast Accessible OPD Intake)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ConnectionBadge state={connectionState} />

          {/* Discreet Staff Switch */}
          <button
            onClick={() => setIntakeMode(intakeMode === "EASY" ? "CLINICAL" : "EASY")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Switch View"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>
              {intakeMode === "EASY" ? "डॉक्टर फॉर्म (Staff View)" : "सरल मोड (Easy Mode)"}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ONE-TAP EMERGENCY SOS HEADER (ALWAYS PROMINENT AT TOP)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-xl border-2 border-red-600 bg-gradient-to-r from-red-950 via-zinc-950 to-red-950 p-4 sm:p-5 shadow-lg shadow-red-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                  तत्काल आपातकालीन सहायता
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300">
                  CODE RED SOS
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                सीने में तेज दर्द, सांस न आना, भारी खून, बेहोशी?
              </h2>
              <p className="text-xs text-zinc-300">
                फॉर्म भरने की जरूरत नहीं है — तुरंत 1-क्लिक में आपातकालीन नंबर पाएं।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleImmediateEmergencySOS}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-sm shadow-md shadow-red-900/50 transition-all flex-shrink-0"
          >
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            <span>🚨 1-क्लिक इमरजेंसी सहायता (SOS)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VOICE-FIRST PATIENT INTAKE (ONE-TAP ZERO TYPING)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-zinc-950 to-teal-950/80 p-4 sm:p-5 shadow-xl shadow-emerald-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-zinc-950 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  बोलकर टोकन लें (Voice-First Intake)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI ASSISTANT
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                माइक पर बोलें — टोकन, सावधानियां व डॉक्टर जांच की जानकारी तुरंत पाएं
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Speak symptoms in Hindi or English. AI automatically assigns department, gives precautions & expected doctor tests.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex-shrink-0 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mic className="w-4 h-4" />
            <span>🎙️ बोलकर टोकन लें / Voice Intake</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800/80 bg-red-950/40 p-3 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* =========================================================================
          EASY PICTORIAL & VOICE MODE (DEFAULT FOR ALL ILLITERATE & GENERAL USERS)
          ========================================================================= */}
      {intakeMode === "EASY" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Easy Flow */}
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1: VOICE INPUT (VERNACULAR "बोलकर बताएं") */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    कदम 1 / Step 1: बोलकर बताएं
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    माइक दबाकर बोलें (Tap Mic & Speak)
                  </h3>
                </div>

                {/* Voice Language Selector */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setVoiceLang("hi-IN")}
                    className={`px-2 py-1 rounded transition-colors ${
                      voiceLang === "hi-IN"
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    🇮🇳 हिंदी
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceLang("en-IN")}
                    className={`px-2 py-1 rounded transition-colors ${
                      voiceLang === "en-IN"
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* Large Animated Microphone Button */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 text-center space-y-3">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isListening
                      ? "bg-red-600 text-white ring-8 ring-red-500/30 scale-110 animate-pulse"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/20 hover:scale-105 active:scale-95"
                  }`}
                  aria-label="Toggle voice input"
                >
                  {isListening ? (
                    <MicOff className="w-10 h-10 sm:w-12 sm:h-12 animate-spin" />
                  ) : (
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
                  )}
                </button>

                <div>
                  <span className="text-sm font-bold text-zinc-100 block">
                    {isListening
                      ? "🔴 सुन रहे हैं... कृपया बोलें... (Listening...)"
                      : "माइक दबाकर अपनी परेशानी बताएं"}
                  </span>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    (उदा. &quot;सीने में दर्द है&quot; या &quot;बच्चे को तेज बुखार है&quot;)
                  </span>
                </div>

                {speechFeedback && (
                  <div className="px-3 py-2 rounded bg-zinc-900 border border-emerald-800/80 text-xs font-mono text-emerald-300 max-w-md w-full">
                    {speechFeedback}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: PICTORIAL SYMPTOM GRID (NO READING REQUIRED) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  कदम 2 / Step 2: या चित्र पर टैप करें
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  बीमारी का चित्र चुनें (Select Illness Picture)
                </h3>
                <p className="text-xs text-zinc-400">
                  जो तकलीफ महसूस हो रही है, उस बड़े चित्र को दबाएं:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PICTORIAL_SYMPTOMS.map((card) => {
                  const Icon = card.icon;
                  const isSelected = selectedPictorialId === card.id;

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSelectPictorial(card)}
                      className={`relative flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? `${card.colorBorder} ${card.colorBg} ring-2 ring-emerald-400 scale-[1.02] shadow-lg`
                          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          isSelected
                            ? "bg-zinc-950 border-white/20"
                            : "bg-zinc-900 border-zinc-800"
                        }`}
                      >
                        <Icon className={`w-7 h-7 ${card.colorText}`} />
                      </div>

                      {/* Labels */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-bold text-white truncate">
                            {card.hindiTitle}
                          </span>
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                              card.severity === "EMERGENCY"
                                ? "bg-red-500/20 text-red-300"
                                : card.severity === "URGENT"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {card.severityLabelHindi}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 block font-medium">
                          {card.englishTitle}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-1 line-clamp-1">
                          {card.hindiSub}
                        </span>
                      </div>

                      {/* Selected Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: PATIENT QUICK IDENTITY & SUBMIT */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  कदम 3 / Step 3: अंतिम पुष्टि
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  टोकन किसके लिए है? (Who is the patient?)
                </h3>
              </div>

              {/* Relationship Quick Pills */}
              <div className="flex flex-wrap gap-2">
                {["स्वयं (Self)", "माता/पिता (Parent)", "बच्चा (Child)", "अन्य (Other)"].map(
                  (rel) => (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setPatientRelationship(rel)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                        patientRelationship === rel
                          ? "border-emerald-500 bg-emerald-950/50 text-emerald-300 font-bold"
                          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {rel}
                    </button>
                  )
                )}
              </div>

              {/* Optional Name */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  मरीज का नाम (Patient Name) - <i>वैकल्पिक / Optional</i>
                </label>
                <input
                  type="text"
                  placeholder="उदा. राहुल कुमार / Rahul Kumar"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              {/* GIANT CALL TO ACTION BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleCreateToken()}
                  disabled={isSubmitting}
                  className="w-full h-14 sm:h-16 flex items-center justify-center gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-mono font-bold text-base sm:text-lg shadow-xl shadow-emerald-950/50 transition-all disabled:opacity-50"
                >
                  <ArrowRight className="w-6 h-6" />
                  <span>
                    {isSubmitting
                      ? "टोकन बनाया जा रहा है... (Creating...)"
                      : "🎫 टोकन नंबर प्राप्त करें (Get Patient Token)"}
                  </span>
                </button>
                <p className="text-[11px] text-zinc-500 text-center mt-2">
                  टोकन मिलने के बाद आपका नंबर स्क्रीन पर बोला जाएगा और फोन पर दिखेगा।
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Physical Kiosk QR Code & Active Queue Summary */}
          <div className="lg:col-span-4 space-y-6">
            <Panel
              title="कियोस्क क्यूआर कोड (Mobile Portal)"
              subtitle="मोबाइल कैमरे से स्कैन करें और अपने फोन पर टोकन रखें"
            >
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <QRCodeDisplay value={currentUrl} size={180} className="mb-3" />
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold mt-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Scannable Live Portal</span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-2">
                  किसी भी स्मार्टफोन कैमरे से स्कैन कर सीधे पर्ची अपने फोन पर खोलें
                </span>
              </div>
            </Panel>

            <Panel
              title="अस्पताल वार्ड स्थिति (Live OPD Status)"
              subtitle="वर्तमान में प्रतीक्षारत मरीज"
            >
              <div className="space-y-2.5">
                {queues.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-850 bg-zinc-900/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        {getQueueIcon(q.code)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-200 block">{q.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">[{q.code}]</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        {q.waitingCount} प्रतीक्षारत
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ~{q.estimatedServiceTime}m औसत
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* =========================================================================
          DETAILED CLINICAL MODE (FOR STAFF / DOCTORS / NURSES ONLY)
          ========================================================================= */}
      {intakeMode === "CLINICAL" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* AI Smart Clinical Routing */}
            <Panel
              title="Clinical Symptom Classifier & Triage"
              subtitle="Describe acute symptoms in natural language for automated ESI v4 acuity scoring"
              badge={
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> COHERE ESI v4
                </span>
              }
            >
              <form onSubmit={handleAiTriage} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="E.g., Crushing central chest pain radiating to left jaw, severe shortness of breath..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full rounded border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    isLoading={isAiTriaging}
                    icon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Analyze Clinical Acuity
                  </Button>
                </div>
              </form>

              {aiSuggestions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-850 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Recommended Clinical Pathway:
                  </span>
                  {aiSuggestions.slice(0, 1).map((sug, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded bg-zinc-900 border border-emerald-900/60 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-emerald-400">
                          Queue [{sug.queueCode}] - {sug.queueName}
                        </span>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{sug.reasoning}</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        {Math.round(sug.confidence * 100)}% match
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Main Clinical Form */}
            <Panel
              title="Staff Clinical Intake Form"
              subtitle="Provide patient identification, chief medical complaint, and optional baseline vitals"
            >
              <form onSubmit={handleCreateToken} className="space-y-4">
                {/* Honeypot for bots */}
                <input
                  type="text"
                  name="user_ref_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Department Queue Selection */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                    Target Clinical Pathway *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {queues.map((q) => {
                      const isSelected = selectedQueueId === q.id;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setSelectedQueueId(q.id)}
                          className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "bg-zinc-900 border-zinc-200 ring-1 ring-zinc-200"
                              : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                              {getQueueIcon(q.code)}
                            </div>
                            <span className="text-xs font-mono font-bold text-zinc-400">
                              [{q.code}]
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-zinc-100 line-clamp-1">
                            {q.name}
                          </span>
                          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                            <span>{q.waitingCount} waiting</span>
                            <span>~{q.estimatedServiceTime}m avg</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Patient Name */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Patient Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                </div>

                {/* Chief Medical Complaint */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Chief Medical Complaint *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe symptoms, location, duration, severity..."
                    value={chiefComplaint}
                    onChange={(e) => {
                      setChiefComplaint(e.target.value);
                      setPurpose(e.target.value);
                    }}
                    className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none resize-none font-mono"
                  />
                </div>

                {/* Baseline Vitals Assessment */}
                <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/60 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowVitals(!showVitals)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                        Baseline Vitals Assessment
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">(Optional)</span>
                    </div>
                    {showVitals ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>

                  {showVitals && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-850">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          SpO2 (%)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 98"
                          value={spO2}
                          onChange={(e) => setSpO2(e.target.value)}
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-zinc-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Pulse / HR (bpm)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 78"
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value)}
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-zinc-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          BP (mmHg)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 120/80"
                          value={bloodPressure}
                          onChange={(e) => setBloodPressure(e.target.value)}
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-zinc-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 45"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:border-zinc-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full font-mono font-bold"
                    isLoading={isSubmitting}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Submit Intake & Generate Care Pass
                  </Button>
                </div>
              </form>
            </Panel>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Panel
              title="Physical Kiosk QR Code"
              subtitle="Scan with mobile camera to open live clinical intake on phone"
            >
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <QRCodeDisplay value={currentUrl} size={190} className="mb-3" />
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold mt-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Scannable Clinical Portal</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* Voice-First Intake Modal */}
      <VoiceIntakeModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
