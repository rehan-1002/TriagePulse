"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ShieldCheck, Zap, Monitor, LayoutDashboard, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CrowdCanvas } from "@/components/ui/skiper-ui/skiper39";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Register GSAP Plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* =========================================================================
   SCROLL-TRIGGERED NARRATIVE LANDING PAGE WITH SKIPER39 CROWD CANVAS
   ========================================================================= */

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=350%",
          pin: true,
          scrub: 1,
        },
      });

      // Initial States
      gsap.set([text1Ref.current, text2Ref.current, text3Ref.current, heroRef.current], {
        opacity: 0,
        y: 40,
        filter: "blur(8px)",
      });

      // Stage 1: "TOO MUCH CROWD?" (0% - 25%)
      tl.to(text1Ref.current, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1 })
        .to(text1Ref.current, { opacity: 0, y: -40, filter: "blur(8px)", duration: 1 }, "+=0.8");

      // Stage 2: "CHAOTIC MANAGEMENT?" (25% - 50%)
      tl.to(text2Ref.current, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1 })
        .to(text2Ref.current, { opacity: 0, y: -40, filter: "blur(8px)", duration: 1 }, "+=0.8");

      // Stage 3: "DON'T WORRY. WE GOT YOU." (50% - 75%)
      tl.to(text3Ref.current, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1 })
        .to(text3Ref.current, { opacity: 0, y: -40, filter: "blur(8px)", duration: 1 }, "+=0.8");

      // Stage 4: LiveQueue Final Hero (75% - 100%)
      tl.to(heroRef.current, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2 });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 selection:bg-zinc-800 selection:text-white">
      {/* Pinned Scroll Wrapper */}
      <div ref={containerRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Exact Skiper39 Crowd Canvas Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-white dark:bg-zinc-950 transition-colors duration-300">
          {/* Light: black outlines on pure white. Dark: inverted white outlines on black. */}
          <div className="absolute inset-0 dark:invert opacity-70 dark:opacity-75 transition-all duration-300">
            <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
          </div>
          {/* Luminous overlay without any grey mud */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-white/10 dark:from-zinc-950/95 dark:via-zinc-950/60 dark:to-zinc-950/20 pointer-events-none transition-colors duration-300" />
        </div>

        {/* Narrative Stage 1: QUEUING SINCE DAWN? */}
        <div ref={text1Ref} className="absolute z-10 flex flex-col items-center text-center px-4 max-w-4xl">
          <Badge variant="outline" className="font-mono text-xs uppercase border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 mb-4 px-3 py-1 bg-zinc-100/90 dark:bg-zinc-900/80 shadow-sm">
            Stage 01 • The Unseen Waitlist
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black font-mono tracking-tighter uppercase text-zinc-900 dark:text-white">
            Queuing Since Dawn?
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 font-mono text-sm md:text-base max-w-xl">
            Packed hospital corridors, paper tokens, and patients waiting 6+ hours with zero visibility into when their doctor will actually see them.
          </p>
        </div>

        {/* Narrative Stage 2: EMERGENCIES SHATTER ESTIMATES */}
        <div ref={text2Ref} className="absolute z-10 flex flex-col items-center text-center px-4 max-w-4xl">
          <Badge variant="outline" className="font-mono text-xs uppercase border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 mb-4 px-3 py-1 bg-red-50 dark:bg-red-950/20 shadow-sm">
            Stage 02 • The Dynamic Twist
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black font-mono tracking-tighter uppercase text-red-600 dark:text-red-500">
            Emergencies Strike Mid-Morning.
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 font-mono text-sm md:text-base max-w-xl">
            Acute trauma and cardiac walk-ins legitimately jump the queue — destroying static linear predictions and compounding blind delays for everyone else.
          </p>
        </div>

        {/* Narrative Stage 3: RE-FORECAST LIVE */}
        <div ref={text3Ref} className="absolute z-10 flex flex-col items-center text-center px-4 max-w-4xl">
          <Badge variant="outline" className="font-mono text-xs uppercase border-emerald-300 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 mb-4 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm">
            Stage 03 • Acuity-Aware AI Orchestration
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black font-mono tracking-tighter uppercase text-emerald-600 dark:text-emerald-400">
            Re-Forecast Live.<br />Arrive Just In Time.
          </h1>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 font-mono text-sm md:text-base max-w-xl">
            Continuous dynamic wait-time calculation based on ESI 1–5 triage. Real-time updates delivered even to basic phones so patients arrive when called, not at dawn.
          </p>
        </div>

        {/* Narrative Stage 4: TriagePulse HERO COCKPIT */}
        <div ref={heroRef} className="absolute z-20 flex flex-col items-center text-center px-4 max-w-4xl">
          <Badge variant="outline" className="font-mono text-xs uppercase border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 mb-4 px-3 py-1 bg-white/90 dark:bg-zinc-900/90 shadow-md">
            <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 mr-1.5" /> Clinical OPD Intelligence • ESI 1–5 Triage
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-black font-mono tracking-tight uppercase text-zinc-900 dark:text-white">
            Triage<span className="text-emerald-600 dark:text-emerald-400">Pulse</span>
          </h1>

          <p className="mt-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs md:text-sm tracking-widest uppercase">
            Dynamic Hospital OPD Token & Emergency Re-Forecasting Engine
          </p>

          <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-sm md:text-base max-w-xl font-sans">
            Empowering government hospitals to replace paper blindness with live acuity-adjusted arrival predictions, instant emergency preemption, and anti-starvation safeguards.
          </p>

          {/* Action Hub */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center items-center">
            <Link href="/join">
              <Button className="h-12 px-6 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider shadow-md transition-all">
                Get Patient Token <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link href="/counter">
              <Button variant="outline" className="h-12 px-6 border-zinc-300 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs uppercase tracking-wider shadow-sm">
                <Monitor className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" /> Doctor Cabin
              </Button>
            </Link>

            <Link href="/display">
              <Button variant="outline" className="h-12 px-6 border-zinc-300 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-mono text-xs uppercase tracking-wider shadow-sm">
                <Monitor className="w-4 h-4 mr-2" /> OPD Signage TV
              </Button>
            </Link>

            <Link href="/admin">
              <Button variant="outline" className="h-12 px-6 border-zinc-300 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-mono text-xs uppercase tracking-wider shadow-sm">
                <LayoutDashboard className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" /> Clinical Admin
              </Button>
            </Link>
          </div>

          {/* Micro Footer Spec */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> ESI 1–5 Acuity
            </span>
            <span>•</span>
            <span>Live Emergency Preemption</span>
            <span>•</span>
            <span>Basic Phone / SMS Ready</span>
            <span>•</span>
            <span>Anti-Starvation Guard</span>
          </div>
        </div>

        {/* Bottom Scroll Indicator Helper */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-500 dark:text-zinc-600 font-mono text-[10px] uppercase tracking-widest pointer-events-none z-10">
          <span>Scroll to explore</span>
          <div className="w-4 h-7 border border-zinc-400 dark:border-zinc-700 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-zinc-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
