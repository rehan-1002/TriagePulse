"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";

interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  variant?: "compact" | "expanded";
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  variant = "compact",
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "expanded") {
    return (
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
        {SUPPORTED_LANGUAGES.map((opt) => {
          const isActive = opt.code === currentLanguage;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => onLanguageChange(opt.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <span className="mr-1 text-[10px] opacity-75 font-semibold">
                {opt.shortLabel}
              </span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800/90 text-xs font-mono text-zinc-200 transition-colors shadow-sm"
        aria-label="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold">{activeOption.label}</span>
        <span className="text-[10px] text-zinc-500 font-mono">
          ({activeOption.shortLabel})
        </span>
        <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-850 mb-1">
            Language / भाषा
          </div>
          <div className="space-y-0.5">
            {SUPPORTED_LANGUAGES.map((opt) => {
              const isSelected = opt.code === currentLanguage;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    onLanguageChange(opt.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left ${
                    isSelected
                      ? "bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-bold"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-850 text-zinc-400 font-semibold">
                      {opt.shortLabel}
                    </span>
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
