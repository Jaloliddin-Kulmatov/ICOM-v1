"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Smooth spring-like easing used for the slide in/out.
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const ANIM_MS = 380;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  // Three-stage lifecycle for buttery enter/exit:
  //   mounted  -> is the node in the DOM at all?
  //   entered  -> has it slid up into view? (drives the transform)
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  // Bring the card in: mount it, then on the next frame flip `entered`
  // so the CSS transition animates from off-screen to resting position.
  const reveal = useCallback(() => {
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Already installed (standalone) → never show.
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Dismissed within the last hour → stay hidden.
    const last = localStorage.getItem("icom_install_dismissed_v2");
    if (last && Date.now() - parseInt(last) < 60 * 60 * 1000) return;

    // iOS: no beforeinstallprompt anywhere, but every iOS browser supports
    // Share → Add to Home Screen, so we show instructions.
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as unknown as Record<string, unknown>).MSStream;
    if (ios) {
      setIsIOS(true);
      const t = setTimeout(reveal, 2500);
      return () => clearTimeout(t);
    }

    // Android / desktop Chrome: wait for the install event, then reveal.
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      timer = setTimeout(reveal, 1800);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, [reveal]);

  // Register the service worker (independent of the prompt UI).
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Slide the card out, then unmount once the transition finishes.
  const close = useCallback((remember: boolean) => {
    if (remember) {
      localStorage.setItem("icom_install_dismissed_v2", String(Date.now()));
    }
    setEntered(false);
    setTimeout(() => setMounted(false), ANIM_MS);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return close(true);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    close(false);
  };

  if (!mounted) return null;

  // Shared transition styles for the card + backdrop.
  const cardStyle: React.CSSProperties = {
    transform: entered ? "translateY(0) scale(1)" : "translateY(120%) scale(0.98)",
    opacity: entered ? 1 : 0,
    transition: `transform ${ANIM_MS}ms ${EASE}, opacity ${ANIM_MS}ms ${EASE}`,
    willChange: "transform, opacity",
  };
  const backdropStyle: React.CSSProperties = {
    opacity: entered ? 1 : 0,
    transition: `opacity ${ANIM_MS}ms ease`,
  };

  return (
    <>
      {/* Subtle dimming backdrop — mobile only, tap to dismiss */}
      <div
        onClick={() => close(true)}
        style={backdropStyle}
        className="fixed inset-0 z-[199] bg-black/30 backdrop-blur-[2px] md:hidden"
        aria-hidden="true"
      />

      <div
        className="fixed z-[200] left-3 right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] md:left-auto md:right-6 md:bottom-6 md:max-w-sm"
        style={cardStyle}
        role="dialog"
        aria-label="Install ICOM"
      >
        <div className="relative bg-card/95 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Gradient accent strip */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

          {/* Drag handle (mobile affordance) */}
          <div className="md:hidden flex justify-center pt-2.5">
            <span className="h-1 w-9 rounded-full bg-muted-foreground/25" />
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              {/* App icon */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt="ICOM"
                className="w-12 h-12 rounded-2xl shadow-md shrink-0 ring-1 ring-black/5"
              />
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-bold text-foreground leading-tight">
                  {isIOS ? "Add ICOM to Home Screen" : "Install the ICOM app"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Faster, full-screen, works offline — no App Store needed.
                </p>
              </div>
              <button
                onClick={() => close(true)}
                className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            {isIOS ? (
              // iOS: show the Share → Add to Home Screen instruction.
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-indigo-500/8 border border-indigo-500/15 px-3 py-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/15 shrink-0">
                  <Share size={14} className="text-indigo-400" />
                </span>
                <p className="text-[11px] text-foreground/80 leading-snug">
                  Tap <span className="font-semibold text-foreground">Share</span> then{" "}
                  <span className="font-semibold text-foreground">Add to Home Screen</span>.
                </p>
              </div>
            ) : (
              // Android / Chrome: native install button.
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => close(true)}
                  className="flex-1 h-10 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent active:scale-[0.98] transition-all"
                >
                  Not now
                </button>
                <button
                  onClick={install}
                  className="flex-1 h-10 rounded-2xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/25"
                >
                  <Download size={15} /> Install
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
