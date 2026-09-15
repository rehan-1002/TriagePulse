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

      // Initial States: Stage 1 is immediately visible on landing with full presence
      gsap.set(text1Ref.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
      });
      gsap.set([text2Ref.current, text3Ref.current, heroRef.current], {
        opacity: 0,
        scale: 0.92,
        y: 50,
        filter: "blur(12px)",
      });

      // Stage 1: "QUEUING SINCE DAWN?"
      // Holds prominence, then gracefully scales up and blurs away into distance
      tl.to(text1Ref.current, {
        opacity: 0,
        scale: 1.08,
        y: -50,
        filter: "blur(12px)",
        duration: 1,
        ease: "power2.inOut",
      }, "+=0.4");

      // Stage 2: "EMERGENCIES STRIKE MID-MORNING."
      // Snaps into sharp focus with smooth camera depth-of-field reveal
      tl.to(text2Ref.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power2.out",
      })
      .to(text2Ref.current, {
        opacity: 0,
        scale: 1.08,
        y: -50,
        filter: "blur(12px)",
        duration: 1,
        ease: "power2.in",
      }, "+=0.8");

      // Stage 3: "RE-FORECAST LIVE. ARRIVE JUST IN TIME."
      // Emerges smoothly from depth with luminous presence
      tl.to(text3Ref.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power2.out",
      })
      .to(text3Ref.current, {
        opacity: 0,
        scale: 1.08,
        y: -50,
        filter: "blur(12px)",
        duration: 1,
        ease: "power2.in",
      }, "+=0.8");

      // Stage 4: TriagePulse Main Solution Cockpit
      // Grand cinematic focus reveal with spring momentum
      tl.to(heroRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.4,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300 selection:bg-zinc-800 selection:text-white">
      {/* Pinned Scroll Wrapper */}
      <div ref={containerRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Exact Skiper39 Crowd Canvas Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-white dark:bg-black transition-colors duration-300">
          <div className="crowd-canvas-wrapper absolute bottom-0 h-full w-screen dark:invert transition-all duration-300">
            <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
          </div>
        </div>

        {/* Narrative Stage 1: QUEUING SINCE DAWN? (Heavier, no stage tag, elevated for clean readability) */}
        <div ref={text1Ref} className="absolute z-10 flex flex-col items-center text-center px-4 max-w-5xl -translate-y-12 sm:-translate-y-16">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-tighter uppercase text-zinc-950 dark:text-white leading-[0.88] drop-shadow-sm">
            Queuing Since<br />Dawn?
          </h1>
          <p className="mt-6 text-zinc-800 dark:text-zinc-200 font-mono text-base sm:text-lg md:text-xl max-w-2xl font-bold leading-relaxed drop-shadow-sm">
            Packed hospital corridors, paper tokens, and patients waiting 6+ hours with zero visibility into when their doctor will actually see them.
          </p>
        </div>

        {/* Narrative Stage 2: EMERGENCIES STRIKE MID-MORNING. (Heavier, no stage tag) */}
        <div ref={text2Ref} className="absolute z-10 flex flex-col items-center text-center px-4 max-w-5xl -translate-y-12 sm:-translate-y-16">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-mono tracking-tighter uppercase text-red-600 dark:text-red-500 leading-[0.9] drop-shadow-sm">
            Emergencies Strike<br />Mid-Morning.
          </h1>
          <p className="mt-6 text-zinc-800 dark:text-zinc-200 font-mono text-base sm:text-lg md:text-xl max-w-2xl font-bold leading-relaxed drop-shadow-sm">
            Acute trauma and cardiac walk-ins legitimately jump the queue — destroying static linear predictions and compounding blind delays for everyone else.
          </p>
        </div>

        {/* Narrative Stage 3: RE-FORECAST LIVE. (Heavier, no stage tag) */}
        <div ref={text3Ref} className="absolute z-10 flex flex-col items-center text-center px-4 max-w-5xl -translate-y-12 sm:-translate-y-16">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-mono tracking-tighter uppercase text-emerald-600 dark:text-emerald-400 leading-[0.9] drop-shadow-sm">
            Re-Forecast Live.<br />Arrive Just In Time.
          </h1>
          <p className="mt-6 text-zinc-800 dark:text-zinc-200 font-mono text-base sm:text-lg md:text-xl max-w-2xl font-bold leading-relaxed drop-shadow-sm">
            Continuous dynamic wait-time calculation based on ESI 1–5 triage. Real-time updates delivered even to basic phones so patients arrive when called, not at dawn.
          </p>
        </div>

        {/* Narrative Stage 4: TriagePulse MAIN SOLUTION COCKPIT */}
        <div ref={heroRef} className="absolute z-20 flex flex-col items-center text-center px-4 max-w-4xl -translate-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider mb-5 shadow-sm backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Clinical OPD Intelligence • ESI 1–5 Triage
          </div>
          
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black font-mono tracking-tight uppercase text-zinc-950 dark:text-white leading-[0.88]">
            Triage<span className="text-emerald-600 dark:text-emerald-400">Pulse</span>
          </h1>

          <p className="mt-4 text-zinc-700 dark:text-zinc-300 font-mono text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase">
            Dynamic Hospital OPD Token & Emergency Re-Forecasting Engine
          </p>

          <p className="mt-5 text-zinc-800 dark:text-zinc-200 text-sm sm:text-base md:text-lg max-w-2xl font-medium leading-relaxed">
            Empowering government hospitals to replace paper blindness with live acuity-adjusted arrival predictions, instant emergency preemption, and anti-starvation safeguards.
          </p>

          {/* Action Hub */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center items-center">
            <Link href="/join">
              <Button className="h-12 px-6 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                Get Patient Token <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link href="/counter">
              <Button variant="outline" className="h-12 px-6 border-zinc-300 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all">
                <Monitor className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" /> Doctor Cabin
              </Button>
            </Link>

            <Link href="/display">
              <Button variant="outline" className="h-12 px-6 border-zinc-300 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-mono text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all">
                <Monitor className="w-4 h-4 mr-2" /> OPD Signage TV
              </Button>
            </Link>

            <Link href="/admin">
              <Button variant="outline" className="h-12 px-6 border-zinc-300 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-mono text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all">
                <LayoutDashboard className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" /> Clinical Admin
              </Button>
            </Link>
          </div>

          {/* Micro Footer Spec */}
          <div className="mt-10 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> ESI 1–5 Acuity
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
