"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function CoachSection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="coach" aria-label="About the coach">
      <div className="bg-surface-container rounded-[2rem] overflow-hidden border border-outline-variant/10">
        <div className="flex flex-col md:flex-row">
          {/* Coach Image Side */}
          <div className="md:w-2/5 relative min-h-[400px] md:min-h-[600px] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center grayscale contrast-125"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=600&q=80')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-container" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />

            {/* Stats overlay */}
            <div className="absolute bottom-8 left-8 right-8">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "5+", label: "Years Exp." },
                  { value: "500+", label: "Clients" },
                  { value: "10K+", label: "Users" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-background/80 backdrop-blur rounded-xl p-3 text-center">
                    <div className="font-[Epilogue] font-black italic text-xl text-primary">{stat.value}</div>
                    <div className="font-[Space_Grotesk] text-[10px] uppercase tracking-widest text-on-surface-variant">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coach Info Side */}
          <div className="md:w-3/5 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-12 h-px bg-primary" />
              <span className="text-primary font-[Space_Grotesk] text-xs uppercase tracking-widest">Your Coach</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-[Epilogue] font-black italic tracking-tight uppercase mb-2">
              Tushar
            </h2>
            <p className="text-on-surface-variant font-[Space_Grotesk] uppercase tracking-widest text-sm mb-6">
              Certified Fitness Trainer & Nutritionist
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-8 max-w-lg">
              With over 5 years of experience transforming 500+ clients across India, Tushar brings together scientific training methods and deep understanding of Indian dietary culture to create truly personalized fitness journeys.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { icon: "verified", text: "ISSA Certified Personal Trainer" },
                { icon: "nutrition", text: "Sports Nutrition Specialist" },
                { icon: "phone_iphone", text: "Built AI tools for personalized coaching" },
                { icon: "group", text: "Helped 500+ people transform their bodies" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name={item.icon} filled size={16} className="text-primary" />
                  </div>
                  <span className="text-on-surface-variant font-[Inter]">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                id="coach-cta"
                className="px-8 py-4 bg-linear-to-br from-primary to-primary-container text-on-accent font-[Epilogue] font-extrabold rounded-xl text-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,145,89,0.3)] active:scale-95"
              >
                TRAIN WITH TUSHAR
              </Link>
              <Link
                href="/#pricing"
                className="px-8 py-4 bg-surface-container-highest text-primary font-[Epilogue] font-extrabold rounded-xl text-center hover:bg-surface-bright transition-colors"
              >
                VIEW PLANS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
