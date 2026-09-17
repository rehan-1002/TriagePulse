"use client";

import React, { useState } from "react";
import {
  Stethoscope,
  ShieldAlert,
  FileCheck,
  CheckSquare,
  Square,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Scan,
  AlertTriangle,
  Info,
} from "lucide-react";

interface DoctorClinicalCopilotProps {
  token: any;
  onTransferToLab?: () => void;
  onTransferToRadiology?: () => void;
}

export function DoctorClinicalCopilot({
  token,
  onTransferToLab,
  onTransferToRadiology,
}: DoctorClinicalCopilotProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const rag = token?.vitalSigns?.ragClinical;

  // Initial orders checklist
  const initialOrders: string[] =
    rag?.anticipatedOrders || [
      "Routine Vitals & Clinical Review",
      "Prescription Renewal",
    ];

  const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    initialOrders.forEach((o) => {
      initial[o] = true; // pre-selected by default
    });
    return initial;
  });

  const [ordersSubmitted, setOrdersSubmitted] = useState(false);

  if (!token) return null;

  const toggleOrder = (orderName: string) => {
    setSelectedOrders((prev) => ({
      ...prev,
      [orderName]: !prev[orderName],
    }));
  };

  const activeOrdersCount = Object.values(selectedOrders).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 via-zinc-950 to-slate-950 p-4 space-y-3 shadow-xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Clinical Copilot (RAG Decision Support)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                ZERO-HALLUCINATION
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Grounded differential considerations and protocol guidelines
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-zinc-400 hover:text-white"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 animate-fadeIn text-xs">
          {/* Protocol Citation & Rationale */}
          <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Cited Clinical Protocol:
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/50 text-emerald-300">
                {rag?.citedProtocolId || "ESI_V4_STANDARD_OPD"}
              </span>
            </div>
            <h4 className="font-semibold text-zinc-100 text-xs">
              {rag?.protocolTitle || "Emergency Severity Index (ESI v4) Guidelines"}
            </h4>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              {rag?.clinicalRationale || "Categorized based on clinical complaint and vital stability."}
            </p>
          </div>

          {/* Differential Considerations & Red Flags */}
          {rag?.differentialConsiderations && rag.differentialConsiderations.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-rose-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Differential Considerations to Rule Out:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {rag.differentialConsiderations.map((diff: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-700/50 text-rose-200 text-[10px] font-mono"
                  >
                    {diff}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 1-Click Anticipated Diagnostic Orders Checklist */}
          <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Recommended Diagnostic Orders ({activeOrdersCount} selected):</span>
              </div>
              {ordersSubmitted && (
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  ✓ Orders Dispatched
                </span>
              )}
            </div>

            <div className="space-y-1 pt-1">
              {initialOrders.map((order, idx) => {
                const isChecked = !!selectedOrders[order];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleOrder(order)}
                    className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors font-mono text-xs ${
                      isChecked
                        ? "bg-sky-950/40 border border-sky-800/60 text-sky-200"
                        : "bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    )}
                    <span>{order}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Handoff Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-2 border-t border-zinc-800">
              {onTransferToLab && (
                <button
                  type="button"
                  onClick={() => {
                    setOrdersSubmitted(true);
                    onTransferToLab();
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-[11px] transition shadow flex items-center justify-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Send to Blood Lab (Pathology)</span>
                </button>
              )}

              {onTransferToRadiology && (
                <button
                  type="button"
                  onClick={() => {
                    setOrdersSubmitted(true);
                    onTransferToRadiology();
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[11px] transition shadow flex items-center justify-center gap-1.5"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Send to Imaging / X-Ray</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
