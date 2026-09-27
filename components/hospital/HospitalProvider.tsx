"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  Building2,
  ChevronDown,
  Check,
  AlertCircle,
  Clock,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { HOSPITALS, Hospital, DEFAULT_HOSPITAL_ID, getHospitalById } from "@/lib/hospitals/data";

interface HospitalContextType {
  currentHospitalId: string;
  currentHospital: Hospital;
  setHospitalId: (id: string) => void;
  hospitals: Hospital[];
  isAllHospitals: boolean;
  setIsAllHospitals: (val: boolean) => void;
}

const HospitalContext = createContext<HospitalContextType>({
  currentHospitalId: DEFAULT_HOSPITAL_ID,
  currentHospital: HOSPITALS[0],
  setHospitalId: () => {},
  hospitals: HOSPITALS,
  isAllHospitals: false,
  setIsAllHospitals: () => {},
});

export const useHospital = () => useContext(HospitalContext);

const STORAGE_KEY = "triagepulse_active_hospital_id";

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [currentHospitalId, setCurrentHospitalIdState] = useState<string>(DEFAULT_HOSPITAL_ID);
  const [isAllHospitals, setIsAllHospitals] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && HOSPITALS.some((h) => h.id === saved)) {
        setCurrentHospitalIdState(saved);
      }
    } catch (_) {}
  }, []);

  const setHospitalId = (id: string) => {
    setCurrentHospitalIdState(id);
    setIsAllHospitals(false);
    try {
      localStorage.setItem(STORAGE_KEY, id);
      // Dispatch custom window event so any concurrent components re-sync immediately
      window.dispatchEvent(new CustomEvent("triagepulse:hospital_change", { detail: { hospitalId: id } }));
    } catch (_) {}
  };

  const currentHospital = getHospitalById(currentHospitalId);

  return (
    <HospitalContext.Provider
      value={{
        currentHospitalId,
        currentHospital,
        setHospitalId,
        hospitals: HOSPITALS,
        isAllHospitals,
        setIsAllHospitals,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

interface HospitalSelectorProps {
  allowAllOption?: boolean;
  className?: string;
}

export function HospitalSelector({ allowAllOption = false, className = "" }: HospitalSelectorProps) {
  const { currentHospital, currentHospitalId, setHospitalId, hospitals, isAllHospitals, setIsAllHospitals } =
    useHospital();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CRITICAL":
      case "SURGE":
        return "bg-rose-500 text-rose-400 border-rose-500/30";
      case "MODERATE":
        return "bg-amber-500 text-amber-400 border-amber-500/30";
      default:
        return "bg-emerald-500 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transition-all font-mono text-xs shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 max-w-[200px] sm:max-w-none truncate"
        title="Switch Active Hospital"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${
              isAllHospitals ? "bg-cyan-400" : getStatusColor(currentHospital.status).split(" ")[0]
            }`}
          />
        </div>

        <span className="font-semibold truncate">
          {isAllHospitals ? "All Hospitals (City Network)" : currentHospital.shortName}
        </span>

        {!isAllHospitals && (
          <span className="text-[10px] hidden md:inline px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono shrink-0">
            ~{currentHospital.currentWaitMin}m
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-72 sm:w-80 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-850">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold block">
              Regional Healthcare Network
            </span>
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono block">
              Select facility to view or route queues:
            </span>
          </div>

          {allowAllOption && (
            <button
              type="button"
              onClick={() => {
                setIsAllHospitals(true);
                setIsOpen(false);
              }}
              className={`w-full text-left p-2 rounded-lg font-mono text-xs flex items-center justify-between transition-colors ${
                isAllHospitals
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="block font-bold">All Hospitals (City Overview)</span>
                  <span className="text-[10px] text-zinc-500 block">Regional load-balancer command matrix</span>
                </div>
              </div>
              {isAllHospitals && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
            </button>
          )}

          <div className="max-h-72 overflow-y-auto space-y-1 pr-0.5">
            {hospitals.map((h) => {
              const isSelected = !isAllHospitals && h.id === currentHospitalId;
              const statusClass = getStatusColor(h.status);

              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setHospitalId(h.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg font-mono text-xs transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-900 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/80 text-zinc-800 dark:text-zinc-200 border border-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold truncate">{h.shortName}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {h.code}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                      {h.tagline}
                    </span>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <div className="flex items-center gap-1 text-[10px]">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span className="font-bold">~{h.currentWaitMin}m</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase ${statusClass}`}
                    >
                      {h.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-850 px-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>Live Sync: Active</span>
            <span className="text-emerald-500 font-bold">4 Facilities</span>
          </div>
        </div>
      )}
    </div>
  );
}
