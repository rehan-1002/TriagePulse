"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Download, WifiOff, CheckCircle2, X, Smartphone, Share2, PlusSquare, MonitorCheck } from "lucide-react";

interface PwaContextType {
  isInstallable: boolean;
  isOffline: boolean;
  installApp: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isOffline: false,
  installApp: async () => {},
});

export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration (immediate if ready, or on load)
    const registerServiceWorker = () => {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("PWA Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("PWA Service Worker registration non-fatal:", error);
          });
      }
    };

    if (typeof window !== "undefined") {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
      }
    }

    // 2. Listen for Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // 3. Online/Offline Network Listeners
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineNotice(true);
      setTimeout(() => setShowOfflineNotice(false), 4000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineNotice(true);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstallGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isOffline,
        installApp: handleInstallClick,
      }}
    >
      {children}

      {/* Connectivity Alert (Offline / Reconnected) */}
      {showOfflineNotice && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm animate-in fade-in slide-from-bottom-3 duration-300">
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md ${
              isOffline
                ? "bg-amber-950/95 border-amber-600/80 text-amber-200"
                : "bg-emerald-950/95 border-emerald-600/80 text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isOffline ? (
                <WifiOff className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-bold block">
                  {isOffline ? "Offline Mode (लोकल मोड)" : "Online (नेटवर्क पुनः चालू)"}
                </span>
                <span className="text-[10px] opacity-80 block">
                  {isOffline
                    ? "Cached queue data available. Auto-sync on reconnect."
                    : "Live queue sync re-established."}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowOfflineNotice(false)}
              className="p-1 rounded hover:bg-black/30 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Install App Banner */}
      {isInstallable && !dismissedBanner && (
        <aside
          aria-label="Install TriagePulse Application"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-40 animate-in fade-in slide-from-bottom-3 duration-300"
        >
          <div className="rounded-xl border border-emerald-500/60 bg-zinc-950/95 p-3.5 shadow-2xl backdrop-blur-md space-y-2 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold block">
                    Install TriagePulse
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block">
                    Fast access & offline queue pass
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDismissedBanner(true)}
                className="text-zinc-500 hover:text-white p-1"
                aria-label="Dismiss install prompt"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono font-bold text-xs shadow-md transition-all text-center"
              >
                + Add to Home Screen
              </button>
              <button
                type="button"
                onClick={() => setDismissedBanner(true)}
                className="py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 text-xs font-mono transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Install Guidance Modal (for Safari iOS, Chrome desktop, or when direct prompt is not supported) */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono">Install TriagePulse App</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Hospital Triage &amp; OPD Queue System</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              {/* iOS Safari */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px]">
                  <li>
                    Tap the <strong className="text-white">Share</strong> button (
                    <Share2 className="w-3 h-3 inline text-emerald-400" />) at the bottom bar.
                  </li>
                  <li>Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong>.</li>
                  <li>Tap <strong className="text-emerald-400">Add</strong> at top right to install.</li>
                </ol>
              </div>

              {/* Android / Chrome */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Android (Chrome / Edge / Firefox)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px]">
                  <li>Tap the browser menu (<strong className="text-white">⋮ 3 dots</strong>) in top/bottom right.</li>
                  <li>Select <strong className="text-white">&quot;Install app&quot;</strong> or <strong className="text-white">&quot;Add to Home screen&quot;</strong>.</li>
                  <li>Confirm installation.</li>
                </ol>
              </div>

              {/* Desktop Chrome / Edge */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <MonitorCheck className="w-4 h-4" />
                  <span>Laptop / PC (Chrome or Edge)</span>
                </div>
                <p className="text-zinc-300 text-[11px]">
                  Look for the <strong className="text-white">Install icon</strong> in the right side of the address bar, or click browser menu (⋮) → <strong className="text-white">&quot;Install TriagePulse&quot;</strong>.
                </p>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-mono text-xs font-bold text-white transition active:scale-98"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function InstallPwaNavButton() {
  const { isInstallable, installApp } = usePwa();
  return (
    <button
      type="button"
      onClick={installApp}
      className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-xs font-mono border transition-all ${
        isInstallable
          ? "text-emerald-400 bg-emerald-950/60 border-emerald-700/60 hover:bg-emerald-900 animate-pulse"
          : "text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border-zinc-800"
      }`}
      title="Install TriagePulse PWA App"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
}
