"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { gsap, ScrollTrigger, setupGSAP } from "@/lib/gsap";

const FRAME_COUNT = 150;
const HERO_SCROLL_DISTANCE_PX = 5200;
const HERO_COPY_FADE_DISTANCE_PX = 2200;
const PRIORITY_FRAMES = 36;
const PRELOAD_CONCURRENCY = 6;
const PRIORITY_PRELOAD_CONCURRENCY = 5;
const ACTIVE_FRAME_WARM_RANGE = 8;
const FRAME_LERP_FACTOR = 0.24;
const MOTION_BLUR_TRIGGER_DELTA = 0.42;
const MOTION_BLUR_ALPHA = 0.14;

const getSafeFrame = (rawFrame: number) =>
  Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(rawFrame)));

const getSafeFrameFloat = (rawFrame: number) =>
  Math.max(0, Math.min(FRAME_COUNT - 1, rawFrame));

const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  clear = true,
) => {
  const imageWidth = image.naturalWidth;
  const imageHeight = image.naturalHeight;

  if (!imageWidth || !imageHeight) {
    return;
  }

  const imageRatio = imageWidth / imageHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = drawHeight * imageRatio;
  } else {
    drawWidth = canvasWidth;
    drawHeight = drawWidth / imageRatio;
  }

  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;

  if (clear) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

export function HeroScrollVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardPrimaryRef = useRef<HTMLDivElement>(null);
  const cardSecondaryRef = useRef<HTMLDivElement>(null);

  const imagesRef = useRef<Array<HTMLImageElement | null>>(Array.from({ length: FRAME_COUNT }, () => null));
  const loadedRef = useRef<boolean[]>(Array.from({ length: FRAME_COUNT }, () => false));
  const requestDrawRef = useRef<(targetFrame: number, force?: boolean) => void>(() => {});
  const warmFramesRef = useRef<(centerFrame: number) => void>(() => {});
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const smoothedFrameRef = useRef(0);
  const prefersReducedMotionRef = useRef(false);

  const [sequenceReady, setSequenceReady] = useState(false);

  const frameSources = useMemo(
    () =>
      Array.from({ length: FRAME_COUNT }, (_, index) =>
        `/hero-frames/ezgif-frame-${String(index + 1).padStart(3, "0")}.jpg`,
      ),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mediaQuery.matches;

    let destroyed = false;
    let renderLoopId = 0;
    let lastRenderedFrameValue = -1;
    const canvasViewport = {
      width: 1,
      height: 1,
    };

    const findRenderableFrame = (targetFrame: number) => {
      const safeFrame = getSafeFrame(targetFrame);

      if (loadedRef.current[safeFrame]) {
        return safeFrame;
      }

      for (let index = safeFrame - 1; index >= 0; index -= 1) {
        if (loadedRef.current[index]) {
          return index;
        }
      }

      for (let index = safeFrame + 1; index < FRAME_COUNT; index += 1) {
        if (loadedRef.current[index]) {
          return index;
        }
      }

      return 0;
    };

    const drawFrame = (targetFrame: number, force = false) => {
      const safeFrame = getSafeFrameFloat(targetFrame);
      const renderableFrame = findRenderableFrame(safeFrame);
      const frameImage = imagesRef.current[renderableFrame];

      if (!frameImage?.naturalWidth || !frameImage.naturalHeight) {
        return;
      }

      if (!force && Math.abs(safeFrame - lastRenderedFrameValue) < 0.01) {
        return;
      }

      const width = canvasViewport.width;
      const height = canvasViewport.height;
      const frameDelta =
        lastRenderedFrameValue >= 0 ? Math.abs(safeFrame - lastRenderedFrameValue) : 0;

      if (frameDelta > MOTION_BLUR_TRIGGER_DELTA && lastRenderedFrameValue >= 0) {
        const previousFrame = findRenderableFrame(lastRenderedFrameValue);
        const previousImage = imagesRef.current[previousFrame];

        if (previousImage?.naturalWidth && previousImage.naturalHeight) {
          context.globalAlpha = Math.min(MOTION_BLUR_ALPHA, frameDelta * 0.06);
          drawCoverImage(context, previousImage, width, height, true);
          context.globalAlpha = 1;
          drawCoverImage(context, frameImage, width, height, false);
        } else {
          drawCoverImage(context, frameImage, width, height, true);
        }
      } else {
        drawCoverImage(context, frameImage, width, height, true);
      }
      lastRenderedFrameValue = safeFrame;
    };

    const requestDraw = (targetFrame: number, force = false) => {
      const safeTarget = getSafeFrameFloat(targetFrame);
      targetFrameRef.current = safeTarget;

      if (force) {
        smoothedFrameRef.current = safeTarget;
        drawFrame(safeTarget, true);
      }
    };

    requestDrawRef.current = requestDraw;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(canvas.clientWidth));
      const height = Math.max(1, Math.round(canvas.clientHeight));
      const displayWidth = Math.max(1, Math.round(width * dpr));
      const displayHeight = Math.max(1, Math.round(height * dpr));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      canvasViewport.width = width;
      canvasViewport.height = height;

      requestDrawRef.current(smoothedFrameRef.current, true);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const renderLoop = () => {
      if (destroyed) {
        return;
      }

      const target = targetFrameRef.current;
      const current = smoothedFrameRef.current;
      const diff = target - current;
      const nextFrame = Math.abs(diff) < 0.01 ? target : current + diff * FRAME_LERP_FACTOR;

      smoothedFrameRef.current = nextFrame;
      drawFrame(nextFrame);
      renderLoopId = requestAnimationFrame(renderLoop);
    };

    renderLoopId = requestAnimationFrame(renderLoop);

    const loadFrame = async (index: number, highPriority: boolean) => {
      if (destroyed || loadedRef.current[index]) {
        return;
      }

      const image = new Image();
      image.decoding = "async";
      image.loading = "eager";
      image.fetchPriority = highPriority ? "high" : "low";

      const loaded = new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });

      image.src = frameSources[index];
      await loaded;

      if (destroyed || !image.naturalWidth || !image.naturalHeight) {
        return;
      }

      try {
        await image.decode();
      } catch {
        // Browsers can reject decode for already-decoded images; safe to continue.
      }

      if (destroyed) {
        return;
      }

      imagesRef.current[index] = image;
      loadedRef.current[index] = true;

      if (index === 0) {
        setSequenceReady(true);
        requestDraw(0, true);
      }

      if (Math.abs(index - currentFrameRef.current) <= 1) {
        requestDraw(smoothedFrameRef.current, true);
      }
    };

    const warmFramesAround = (centerFrame: number) => {
      if (destroyed) {
        return;
      }

      const start = Math.max(0, centerFrame - ACTIVE_FRAME_WARM_RANGE);
      const end = Math.min(FRAME_COUNT - 1, centerFrame + ACTIVE_FRAME_WARM_RANGE);

      for (let index = start; index <= end; index += 1) {
        if (!loadedRef.current[index]) {
          void loadFrame(index, true);
        }
      }
    };

    warmFramesRef.current = warmFramesAround;

    const loadRange = async (
      start: number,
      end: number,
      highPriority: boolean,
      concurrency: number,
    ) => {
      if (start > end) {
        return;
      }

      let pointer = start;
      const worker = async () => {
        while (!destroyed && pointer <= end) {
          const next = pointer;
          pointer += 1;
          await loadFrame(next, highPriority);
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => worker()));
    };

    void (async () => {
      await loadFrame(0, true);

      const priorityEnd = Math.min(PRIORITY_FRAMES - 1, FRAME_COUNT - 1);
      await loadRange(1, priorityEnd, true, PRIORITY_PRELOAD_CONCURRENCY);

      if (priorityEnd + 1 < FRAME_COUNT) {
        await loadRange(priorityEnd + 1, FRAME_COUNT - 1, false, PRELOAD_CONCURRENCY);
      }
    })();

    if (prefersReducedMotionRef.current) {
      currentFrameRef.current = 0;
      targetFrameRef.current = 0;
      smoothedFrameRef.current = 0;
      requestDraw(0, true);
    }

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    return () => {
      destroyed = true;
      requestDrawRef.current = () => {};
      warmFramesRef.current = () => {};

      if (renderLoopId) {
        cancelAnimationFrame(renderLoopId);
      }

      window.removeEventListener("resize", resizeCanvas);
      resizeObserver.disconnect();
    };
  }, [frameSources]);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || !sequenceReady) {
      return;
    }

    setupGSAP();

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mediaQuery.matches;

    if (prefersReducedMotionRef.current) {
      currentFrameRef.current = 0;
      requestDrawRef.current(0, true);
      return;
    }

    // Fast refresh or strict-mode remounts can leave stale pin triggers for the same section.
    // Kill any previous trigger targeting/pinning this section before creating fresh ones.
    ScrollTrigger.getAll().forEach((trigger) => {
      const triggerTarget = trigger.vars.trigger;
      const pinTarget = trigger.vars.pin;
      if (triggerTarget === section || pinTarget === section) {
        trigger.kill(true);
      }
    });

    const frameState = { value: 0 };

    const ctx = gsap.context(() => {
      gsap.to(frameState, {
        value: FRAME_COUNT - 1,
        ease: "none",
        onUpdate: () => {
          const exactFrame = getSafeFrameFloat(frameState.value);
          const frame = getSafeFrame(exactFrame);

          requestDrawRef.current(exactFrame);

          if (frame !== currentFrameRef.current) {
            currentFrameRef.current = frame;
            warmFramesRef.current(frame);
          }
        },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${HERO_SCROLL_DISTANCE_PX}`,
          scrub: 0.8,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
        },
      });

      if (contentRef.current) {
        gsap.to(contentRef.current, {
          y: -120,
          opacity: 0.16,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${HERO_COPY_FADE_DISTANCE_PX}`,
            scrub: true,
          },
        });
      }

      if (cardPrimaryRef.current) {
        gsap.to(cardPrimaryRef.current, {
          y: -100,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${HERO_SCROLL_DISTANCE_PX}`,
            scrub: true,
          },
        });
      }

      if (cardSecondaryRef.current) {
        gsap.to(cardSecondaryRef.current, {
          y: 80,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${HERO_SCROLL_DISTANCE_PX}`,
            scrub: true,
          },
        });
      }
    }, section);

    return () => {
      ctx.revert();
    };
  }, [sequenceReady]);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative h-svh pt-20"
      style={{ overflow: "clip" }}
      aria-label="Landing hero with scroll controlled image sequence"
    >
      <div
        ref={canvasWrapRef}
        className="hero-canvas-wrap absolute inset-0 z-0 overflow-hidden will-change-transform"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ transform: "translateZ(0)" }}
        />
      </div>
      <div className="absolute inset-0 z-10 bg-linear-to-t from-black/40 via-black/10 to-transparent" />
      <div className="absolute inset-0 z-10 hero-grid opacity-[0.06]" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_16%_8%,rgba(249,115,22,0.35),transparent_30%),radial-gradient(circle_at_80%_16%,rgba(251,146,60,0.22),transparent_34%)]" />

      <div className="relative z-20 mx-auto grid h-full w-full max-w-7xl gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-12 lg:px-8">
        <div ref={contentRef} className="hero-content space-y-7 will-change-transform">
          <span className="inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Built for India - Powered by AI
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Transform Your Body with AI-Guided Workouts & Smart Nutrition
          </h1>
          <p className="max-w-2xl text-base text-white/78 sm:text-lg">
            AI-guided workouts, practical Indian nutrition, and measurable coaching outcomes,
            delivered through a smooth narrative hero engineered for conversion.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-xl border border-primary/60 bg-primary px-7 font-semibold text-primary-foreground shadow-[0_18px_65px_rgba(249,115,22,0.45)]"
            >
              <Link href="/signup">Start Your Transformation</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl border-white/30 bg-black/25 px-7 font-semibold text-white hover:bg-white/10"
            >
              <a href="#pricing">Explore Plans</a>
            </Button>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-3 pt-2">
            {[
              { value: "10K+", label: "Active users" },
              { value: "500+", label: "Diet plans" },
              { value: "98%", label: "Goal adherence" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/16 bg-black/35 p-4 shadow-[0_12px_34px_rgba(2,6,23,0.35)] backdrop-blur-sm"
              >
                <p className="text-2xl font-semibold tracking-tight text-white">{metric.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/70">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none relative hidden h-full items-center justify-end lg:flex">
          <div
            ref={cardPrimaryRef}
            className="floating-card absolute -right-2 top-[16%] max-w-[18rem] rounded-3xl border border-white/20 bg-white/12 p-5 backdrop-blur-2xl will-change-transform"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
              Live Output
            </p>
            <p className="mt-2 text-lg font-semibold text-white">AI Workout Plan Generated</p>
            <p className="mt-2 text-sm text-white/75">
              Goal split, recovery windows, and meal targets adapt in real time as onboarding progresses.
            </p>
          </div>
          <div
            ref={cardSecondaryRef}
            className="floating-card absolute right-24 top-[54%] max-w-[16rem] rounded-3xl border border-white/20 bg-black/35 p-5 backdrop-blur-xl will-change-transform"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
              Conversion Lift
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">+28%</p>
            <p className="mt-1 text-sm text-white/70">
              Higher trial starts after cinematic scroll narrative upgrade
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-white/25 bg-black/35 px-5 py-2 text-xs uppercase tracking-[0.16em] text-white/80 backdrop-blur sm:block">
        Scroll to discover platform features
      </div>

      {!sequenceReady ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            Loading cinematic sequence
          </p>
        </div>
      ) : null}
    </section>
  );
}
