"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useEffect, useRef } from "react";

export function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    setTimeout(() => {
      el.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 100);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden" aria-label="Hero section">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-150 h-150 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-100 h-100 rounded-full bg-primary-container/10 blur-[80px]" />
        <div className="absolute top-1/2 left-0 w-75 h-75 rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      {/* Hero image — right side */}
      <div className="absolute right-0 top-0 w-full md:w-3/5 h-full -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10" />
        <div
          className="w-full h-full bg-cover bg-center grayscale contrast-125 opacity-40"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80')`,
          }}
          aria-hidden="true"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant/40 rounded-full font-[Space_Grotesk] text-primary text-xs tracking-widest uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI-Powered • Built for India
          </div>

          {/* Heading */}
          <h1
            ref={titleRef}
            className="text-6xl md:text-8xl xl:text-9xl font-[Epilogue] font-black italic leading-[0.88] tracking-tight uppercase mb-8"
          >
            Your Personal<br />
            <span className="text-transparent bg-clip-text bg-linear-to-br from-primary to-primary-container">
              AI Fitness
            </span>
            <br />
            Coach.
          </h1>

          {/* Subtext */}
          <p className="text-on-surface-variant text-lg md:text-xl max-w-lg mb-12 leading-relaxed font-[Inter]">
            Tailored Indian diet plans, hyper-accurate progress tracking, and AI-driven coaching that understands your lifestyle. Weight loss, muscle gain — your goal, our plan.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard"
              id="hero-cta-primary"
              className="px-8 py-4 bg-linear-to-br from-primary to-primary-container text-on-accent font-[Epilogue] font-extrabold rounded-xl text-lg shadow-[0_10px_30px_rgba(255,145,89,0.4)] hover:scale-105 transition-transform active:scale-95 text-center"
            >
              STARTER
            </Link>
            <Link
              href="/#pricing"
              id="hero-cta-secondary"
              className="px-8 py-4 bg-surface-container border border-outline-variant/40 text-primary font-[Epilogue] font-extrabold rounded-xl text-lg hover:bg-surface-container-highest transition-colors text-center"
            >
              EXPLORE PLANS ↗
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 mt-12">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-surface-container-highest flex items-center justify-center">
                  <Icon name="person" filled size={18} className="text-on-surface-variant" />
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Icon key={i} name="star" filled size={14} className="text-secondary" />
                ))}
              </div>
              <p className="text-on-surface-variant text-xs font-[Space_Grotesk]">10,000+ transformations across India</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-on-surface-variant">
        <span className="text-xs font-[Space_Grotesk] uppercase tracking-widest">Scroll to explore</span>
        <div className="w-5 h-8 border border-outline-variant rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
