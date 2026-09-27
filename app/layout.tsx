import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Activity, Tv, Monitor, ShieldCheck, UserCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PwaProvider, InstallPwaNavButton } from "@/components/pwa/PwaProvider";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "TriagePulse | Dynamic OPD Wait-Time & Clinical Triage Engine",
  description:
    "Real-time acuity-aware hospital OPD token and wait-time re-forecasting platform for patients and clinicians.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TriagePulse",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/icons/favicon-32x32.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col antialiased selection:bg-zinc-800 selection:text-white overflow-x-hidden transition-colors duration-300">
        <PwaProvider>
        {/* Global Operational Top Bar */}
        <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
                <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-100 group-hover:border-zinc-500 transition-colors shrink-0">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-zinc-900 dark:text-white">
                    TRIAGEPULSE
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 ml-1.5 uppercase hidden lg:inline">
                    Clinical OS v2.4
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <Link
                href="/join"
                title="Patient Intake (/join)"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Patient Intake</span>
              </Link>

              <Link
                href="/counter"
                title="Doctor Cabin (/counter)"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
              >
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Doctor Cabin</span>
              </Link>

              <Link
                href="/admin"
                title="Clinical Admin (/admin)"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Clinical Admin</span>
              </Link>

              <Link
                href="/display"
                title="OPD Signage TV (/display)"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-700/80 transition-colors"
              >
                <Tv className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">OPD Signage TV</span>
              </Link>

              <InstallPwaNavButton />

              <div className="ml-0.5 sm:ml-1 pl-1 sm:pl-1.5 border-l border-zinc-200 dark:border-zinc-800 shrink-0">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Global Footer Meta */}
        <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black py-4 px-6 text-center text-xs font-mono text-zinc-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>TriagePulse Clinical Engine • Acuity-Time Hybrid Priority (ESI 1–5)</span>
            <span>Live Emergency Re-Forecasting • Zero-Install Web & Basic Phone Ready</span>
          </div>
        </footer>
        </PwaProvider>
      </body>
    </html>
  );
}
