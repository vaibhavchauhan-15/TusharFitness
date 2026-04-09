"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isRegistered = false;

export const setupGSAP = () => {
  if (typeof window === "undefined" || isRegistered) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Tuning: lag smoothing disabled — Lenis drives the RAF loop
  gsap.ticker.lagSmoothing(0);

  // ScrollTrigger config
  ScrollTrigger.config({
    ignoreMobileResize: true,
    // Use window as the default scroller — Lenis intercepts scroll events
    // and updates document scroll position, so ScrollTrigger reads correctly
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
  });

  isRegistered = true;
};

export { gsap, ScrollTrigger };

