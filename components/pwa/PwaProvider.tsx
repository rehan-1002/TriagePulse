"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Download, WifiOff, CheckCircle2, X } from "lucide-react";

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

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("PWA Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("PWA Service Worker registration non-fatal:", error);
          });
      });
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
      alert("To install TriagePulse on your device:\n\n• On Android/Chrome: Tap Chrome menu (⋮) -> 'Add to Home screen' or 'Install app'.\n• On iPhone/Safari: Tap Share button (⎙) -> 'Add to Home Screen'.");
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
