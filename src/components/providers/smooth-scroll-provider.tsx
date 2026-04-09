"use client";

import { useEffect } from "react";
import { destroyLenis, initLenis } from "@/lib/lenis";

/**
 * SmoothScrollProvider
 * Drop this anywhere above the content you want smooth-scrolled.
 * It initialises Lenis + GSAP ScrollTrigger sync on mount and
 * tears it down on unmount (important for Next.js page transitions).
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    initLenis();

    return () => {
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
