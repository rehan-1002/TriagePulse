"use client";

import React, { useState } from "react";
import { AlertCircle, X, Activity, ShieldAlert } from "lucide-react";
import { Button } from "../ui/Button";

interface EmergencyModalProps {
  tokenId: string;
  displayNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const DISTRESS_SYMPTOMS = [
  "Increasing Chest Pain / Pressure",
  "Severe Dizziness / Fainting",
  "Difficulty Breathing / Shortness of Breath",
  "Acute Pain Spike / Severe Nausea",
  "Altered Speech / Numbness",
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

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0 && !notes.trim()) {
      setError("Please select at least one symptom or describe your condition.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const combinedReason = [
        ...selectedSymptoms,
        ...(notes.trim() ? [notes.trim()] : []),
      ].join("; ");

      const res = await fetch(`/api/tokens/${tokenId}/deteriorate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: combinedReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit distress alert");
      }

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log clinical distress");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-rose-400">
            <Activity className="w-5 h-5" />
            <h3 className="text-sm font-mono uppercase font-bold tracking-wider text-zinc-100">
              Report Clinical Distress
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 text-xs text-zinc-400 leading-relaxed">
          If you are feeling worse while waiting in the hall, report your distress immediately.
          <strong className="text-zinc-200 block mt-1">
            This instantly escalates your patient token to the Triage Nurse and Doctor Cabins with acute priority.
          </strong>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded border border-rose-900/80 bg-rose-950/40 p-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Patient Token Reference
            </label>
            <input
              type="text"
              readOnly
              value={displayNumber}
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-mono font-bold text-zinc-200 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Primary Acute Symptoms
            </label>
            <div className="space-y-2">
              {DISTRESS_SYMPTOMS.map((symptom) => {
                const isChecked = selectedSymptoms.includes(symptom);
                return (
                  <label
                    key={symptom}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? "border-rose-700 bg-rose-950/40 text-zinc-100"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSymptom(symptom)}
                      className="rounded border-zinc-700 text-rose-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                    />
                    <span>{symptom}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Describe changes in your pain, onset, or breathing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-rose-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
              Escalate Distress Alert
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
