"use client";

import React, { useState } from "react";
import { AlertCircle, X, Activity, ShieldAlert, AlertTriangle, Clock, HeartPulse } from "lucide-react";
import { Button } from "../ui/Button";

interface EmergencyModalProps {
  tokenId: string;
  displayNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const DISTRESS_SYMPTOMS = [
  {
    hindi: "छाती में तेज दर्द या दबाव",
    english: "Increasing Chest Pain / Pressure",
    code: "CHEST_PAIN",
  },
  {
    hindi: "सांस लेने में भारी तकलीफ / दम फूलना",
    english: "Severe Shortness of Breath / Choking",
    code: "RESPIRATORY",
  },
  {
    hindi: "गंभीर चक्कर आना / बेहोश होना",
    english: "Severe Dizziness / Fainting",
    code: "SYNCOPE",
  },
  {
    hindi: "गंभीर घाव या खून बहना",
    english: "Acute Bleeding / Hemorrhage",
    code: "BLEEDING",
  },
  {
    hindi: "असहनीय दर्द / अचानक बोलने में असमर्थता",
    english: "Acute Pain Spike / Speech Loss / Stroke Signs",
    code: "ACUTE_NEURO",
  },
];

export function EmergencyModal({
  tokenId,
  displayNumber,
  isOpen,
  onClose,
  onSubmitted,
}: EmergencyModalProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSymptom = (symptomText: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomText) ? prev.filter((s) => s !== symptomText) : [...prev, symptomText]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0 && !notes.trim()) {
      setError("कृपया कम से कम एक लक्षण चुनें (Please select at least one symptom).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const combinedReason = [
        ...selectedSymptoms,
        ...(notes.trim() ? [notes.trim()] : []),
      ].join("; ");

      // Submit formal emergency priority request
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          reason: combinedReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit emergency request");
      }

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || "आपातकालीन अनुरोध दर्ज करने में समस्या आई");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-red-600 bg-zinc-950 p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5 text-red-400">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-800/60">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-mono uppercase font-bold text-white">
                आपातकालीन प्राथमिकता अनुरोध
              </h3>
              <span className="text-[11px] text-red-400 font-mono">
                Emergency Priority Verification
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anti-Spoof Warning Box */}
        <div className="mb-4 rounded-xl border border-amber-500/60 bg-amber-950/30 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>सख्त चेतावनी / Anti-Spoof Penalty Warning</span>
          </div>
          <p className="text-zinc-200 text-xs leading-relaxed">
            यह बटन केवल <strong>गंभीर व जानलेवा स्थिति</strong> के लिए है। यदि बिना वास्तविक आपातकाल के केवल लाइन काटने के लिए यह बटन दबाया गया, तो स्टाफ द्वारा जांच के बाद आपका टोकन <strong>कतार में सबसे पीछे भेज दिया जाएगा</strong>।
          </p>
          <p className="text-zinc-400 text-[10px] font-mono">
            (Warning: Falsely claiming an emergency will penalize your token, demoting it to the back of the queue).
          </p>
        </div>

        {/* 60-Second Fail-Safe Reassurance */}
        <div className="mb-4 rounded-xl border border-emerald-500/50 bg-emerald-950/20 p-3 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-emerald-300 block">
              60-सेकंड सुरक्षा गारंटी (Unattended Desk Fail-Safe)
            </span>
            <span className="text-zinc-400 text-[11px]">
              यदि नर्स डेस्क पर कोई उपस्थित नहीं हुआ, तो 60 सेकंड बाद सिस्टम स्वतः आपको #1 पर प्रमोट कर देगा। किसी भी आपातकाल में मरीज रुकेगा नहीं।
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800/80 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono px-1">
            <span className="text-zinc-400">टोकन नंबर / Token:</span>
            <span className="font-bold text-emerald-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
              {displayNumber}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              लक्षण चुनें / Select Urgent Symptoms:
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {DISTRESS_SYMPTOMS.map((item) => {
                const label = `${item.hindi} (${item.english})`;
                const isChecked = selectedSymptoms.includes(label);
                return (
                  <label
                    key={item.code}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? "border-red-500 bg-red-950/50 text-white shadow-sm"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSymptom(label)}
                      className="rounded border-zinc-700 text-red-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                    />
                    <div>
                      <span className="font-bold block">{item.hindi}</span>
                      <span className="text-[10px] text-zinc-400 block">{item.english}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              अन्य विवरण (वैकल्पिक / Optional Notes):
            </label>
            <textarea
              rows={2}
              placeholder="तकलीफ कब शुरू हुई, कितना दर्द है..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-red-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              रद्द करें (Cancel)
            </Button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-xs shadow-lg shadow-red-950/50 transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? "अनुरोध भेजा जा रहा है..."
                : "🚨 आपातकाल सत्यापित करें (Request Priority)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
