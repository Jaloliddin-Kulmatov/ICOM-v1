"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (running as standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if user dismissed within the last hour
    const last = localStorage.getItem("icom_install_dismissed_v2");
    if (last && Date.now() - parseInt(last) < 60 * 60 * 1000) return;

    // iOS detection — Safari doesn't fire beforeinstallprompt
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream;
    if (ios) {
      // Only show on Safari (not Chrome/Firefox on iOS)
      const isSafari = /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios/i.test(navigator.userAgent);
      if (isSafari) {
        setIsIOS(true);
        // Delay so it doesn't show immediately on first load
        setTimeout(() => setShow(true), 3000);
      }
      return;
    }

    // Android / Desktop Chrome: listen for install prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("icom_install_dismissed_v2", String(Date.now()));
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  if (!show || dismissed) return null;

  // iOS: show "Share → Add to Home Screen" instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[200] md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="ICOM" className="w-10 h-10 rounded-xl" />
              <div>
                <p className="text-sm font-bold text-foreground">Add ICOM to Home Screen</p>
                <p className="text-xs text-muted-foreground">Use it like an app, offline too</p>
              </div>
            </div>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tap the <span className="font-semibold text-foreground">Share</span> button{" "}
            <span className="inline-block">⬆</span> at the bottom of Safari, then choose{" "}
            <span className="font-semibold text-foreground">Add to Home Screen</span>.
          </p>
          {/* iOS share arrow indicator */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
            <Download size={12} /> Tap Share → Add to Home Screen
          </div>
        </div>
      </div>
    );
  }

  // Android / Chrome: native install button
  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[200] md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="ICOM" className="w-12 h-12 rounded-2xl shadow-md" />
            <div>
              <p className="text-sm font-bold text-foreground">Install ICOM App</p>
              <p className="text-xs text-muted-foreground">Fast, offline-ready, no App Store needed</p>
            </div>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 h-9 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Not now
          </button>
          <button
            onClick={install}
            className="flex-1 h-9 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download size={14} /> Install
          </button>
        </div>
      </div>
    </div>
  );
}
