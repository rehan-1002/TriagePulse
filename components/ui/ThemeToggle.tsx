"use client";

import React, { useEffect, useState, useRef } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const isLight = saved === "light";
    if (isLight) {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      setTheme("dark");
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    const x = e.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
    const y = e.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2);

    const nextTheme = theme === "dark" ? "light" : "dark";

    if (typeof window === "undefined") return;
    const doc = document as any;

    // Fallback if View Transitions API is unsupported
    if (!doc.startViewTransition) {
      setTheme(nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
      localStorage.setItem("theme", nextTheme);
      return;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      setTheme(nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
      localStorage.setItem("theme", nextTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 650,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  if (!mounted) {
    return (
      <div className={`h-8 w-16 rounded border border-zinc-800 bg-zinc-900/60 animate-pulse ${className}`} />
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`relative flex items-center gap-1.5 px-2.5 h-8 rounded border text-xs font-mono transition-all duration-200 cursor-pointer select-none ${
        theme === "dark"
          ? "border-amber-500/40 bg-zinc-900/90 text-amber-400 hover:border-amber-400 hover:bg-zinc-800 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          : "border-indigo-400/50 bg-white text-indigo-600 hover:border-indigo-600 hover:bg-zinc-50 shadow-sm"
      } ${className}`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-zinc-200">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px] font-semibold text-zinc-800">Dark</span>
        </>
      )}
    </button>
  );
}
