"use client";

import React, { useState } from "react";
import { MessageSquare, Send, CheckCircle2, AlertCircle, X, Smartphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SmsPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayNumber: string;
  position: number;
  estimatedWaitMins: number;
  queueName: string;
}

export function SmsPassModal({
  isOpen,
  onClose,
  displayNumber,
  position,
  estimatedWaitMins,
  queueName,
}: SmsPassModalProps) {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    text: string;
    smsUrl?: string;
    provider?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, "").slice(-10);

    if (cleanDigits.length !== 10) {
      setResult({
        success: false,
        text: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanDigits,
          displayNumber,
          position,
          estimatedWaitMins,
          queueName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setResult({
          success: false,
          text: data.error || "Failed to dispatch SMS via gateway.",
          smsUrl: data.smsUrl,
        });
      } else {
        setResult({
          success: true,
          text:
            data.provider === "fast2sms"
              ? `Real SMS dispatched successfully to +91 ${cleanDigits} via Fast2SMS!`
              : `SMS ready for +91 ${cleanDigits}. Tap below to launch your phone's native SMS app.`,
          smsUrl: data.smsUrl,
          provider: data.provider,
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        text: err.message || "Network error sending SMS.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                SMS Pass Dispatch
              </h3>
              <span className="text-[11px] text-zinc-400 block font-mono">
                For Basic Keypad / Offline Phones
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Ticket Mini Pill */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 text-xs font-mono">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Token</span>
            <span className="font-bold text-white text-base">{displayNumber}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Position</span>
            <span className="font-bold text-emerald-400">#{position}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Est. Wait</span>
            <span className="font-bold text-amber-300">~{estimatedWaitMins}m</span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendSms} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5">
              10-Digit Mobile Number
            </label>
            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 focus-within:border-emerald-500 transition px-3 py-2">
              <span className="text-xs font-mono text-zinc-500 mr-2 select-none">+91</span>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-transparent text-sm font-mono text-white placeholder-zinc-600 focus:outline-none"
                autoFocus
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
              Works on any Jio, Airtel, Vi, or BSNL feature phone
            </span>
          </div>

          {result && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono space-y-2 ${
                result.success
                  ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                  : "bg-red-950/40 border-red-800/80 text-red-300"
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{result.text}</span>
              </div>

              {result.smsUrl && (
                <a
                  href={result.smsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch Native SMS App</span>
                </a>
              )}
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-1/3 text-xs font-mono text-zinc-400"
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="w-2/3 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500"
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Send Real SMS
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
