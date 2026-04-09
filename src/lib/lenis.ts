"use client";

import Lenis from "lenis";
import { gsap, ScrollTrigger, setupGSAP } from "@/lib/gsap";

let lenis: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

export function initLenis(): Lenis {
  if (lenis) return lenis;

  setupGSAP();

  // Remove stale triggers left from fast refresh/remounts if their DOM nodes are detached.
  ScrollTrigger.getAll().forEach((trigger) => {
    const triggerTarget = trigger.vars.trigger;
    if (triggerTarget instanceof Element && !document.contains(triggerTarget)) {
      trigger.kill(true);
    }
  });

  lenis = new Lenis({
    duration: 1.4,           // scroll momentum duration (seconds)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease-out
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.8,
    infinite: false,
  });

  // Connect Lenis to GSAP ScrollTrigger so all pin/scrub animations sync perfectly
  lenis.on("scroll", ScrollTrigger.update);

  // Drive Lenis inside GSAP's ticker (ensures frame-perfect sync)
  tickerCallback = (time) => {
    lenis?.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);

  // Tell GSAP ticker not to use requestAnimationFrame itself (Lenis handles it)
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function destroyLenis() {
  if (!lenis) return;

  lenis.off("scroll", ScrollTrigger.update);
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
  lenis.destroy();
  lenis = null;
}

export function getLenis(): Lenis | null {
  return lenis;
}
