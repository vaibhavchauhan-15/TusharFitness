"use client";

import { useEffect } from "react";
import { gsap, setupGSAP } from "@/lib/gsap";

export function LandingScrollEffects() {
  useEffect(() => {
    const root = document.getElementById("landing-root");

    if (!root) {
      return;
    }

    setupGSAP();

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        return;
      }

      const revealTargets = gsap
        .utils
        .toArray<HTMLElement>("[data-scroll-reveal]")
        .filter((element) => element.id !== "features");
      revealTargets.forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 52 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.92,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 84%",
              once: true,
            },
          },
        );
      });

      const staggerGroups = gsap.utils.toArray<HTMLElement>("[data-scroll-stagger]");
      staggerGroups.forEach((group) => {
        const items = group.querySelectorAll<HTMLElement>("[data-stagger-item]");

        if (!items.length) {
          return;
        }

        gsap.fromTo(
          items,
          { autoAlpha: 0, y: 42, scale: 0.97 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: group,
              start: "top 82%",
              once: true,
            },
          },
        );
      });

      const floatTargets = gsap.utils.toArray<HTMLElement>("[data-scroll-float]");
      floatTargets.forEach((element) => {
        gsap.fromTo(
          element,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      const zoomTargets = gsap.utils.toArray<HTMLElement>("[data-scroll-zoom]");
      zoomTargets.forEach((element) => {
        gsap.fromTo(
          element,
          { scale: 0.96 },
          {
            scale: 1,
            ease: "power1.out",
            scrollTrigger: {
              trigger: element,
              start: "top 78%",
              end: "bottom 42%",
              scrub: true,
            },
          },
        );
      });

      const heroCanvas = root.querySelector<HTMLElement>(".hero-canvas-wrap");
      const heroContent = root.querySelector<HTMLElement>(".hero-content");
      const featuresSection = root.querySelector<HTMLElement>("#features");
      const featuresHeadline = root.querySelector<HTMLElement>("[data-features-headline]");
      const featuresIntro = root.querySelector<HTMLElement>("[data-features-intro]");

      if (featuresSection && featuresHeadline && featuresIntro) {
        gsap.set(featuresHeadline, {
          y: 96,
          autoAlpha: 0,
          filter: "blur(10px)",
        });

        gsap.set(featuresIntro, {
          y: 40,
          autoAlpha: 0,
        });

        const handoffTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: featuresSection,
            start: "top 92%",
            end: "top 38%",
            scrub: 1.1,
          },
        });

        if (heroCanvas) {
          handoffTimeline.to(
            heroCanvas,
            {
              scale: 1.02,
              yPercent: 0,
              ease: "none",
            },
            0,
          );
        }

        if (heroContent) {
          handoffTimeline.to(
            heroContent,
            {
              y: -72,
              autoAlpha: 0.08,
              ease: "none",
            },
            0,
          );
        }

        handoffTimeline
          .to(
            featuresHeadline,
            {
              y: 0,
              autoAlpha: 1,
              filter: "blur(0px)",
              ease: "none",
            },
            0.1,
          )
          .to(
            featuresIntro,
            {
              y: 0,
              autoAlpha: 1,
              ease: "none",
            },
            0.18,
          );
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, []);

  return null;
}
