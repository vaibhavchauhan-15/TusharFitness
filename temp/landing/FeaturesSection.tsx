"use client";

const features = [
  {
    icon: "psychology",
    color: "text-primary",
    title: "Neural Adaptation Engine",
    description:
      "Our AI learns your metabolic rate and recovery patterns, adjusting every workout based on your biometric feedback and progress.",
    span: "md:col-span-2",
    large: true,
  },
  {
    icon: "restaurant",
    color: "text-tertiary",
    title: "Indian Contextual Diet",
    description:
      "From Paneer Tikka to Dal Tadka — we translate traditional Indian meals into high-performance fuel macros without losing the soul of the food.",
    span: "",
    large: false,
  },
  {
    icon: "monitoring",
    color: "text-secondary",
    title: "Hyper-Local Analytics",
    description:
      "Detailed body metrics tracking that accounts for genetic predispositions and regional dietary habits common in India.",
    span: "",
    large: false,
  },
  {
    icon: "local_fire_department",
    color: "text-primary",
    title: "Gamified Progress",
    description:
      "Streak system, XP points, levels, and badges keep you motivated. From Beginner to Beast Mode 💪",
    span: "",
    large: false,
  },
  {
    icon: "watch",
    color: "text-tertiary",
    title: "Connect Everything",
    description:
      "Sync with Apple Watch, Garmin, or FitBit for seamless integration and automatic workout logging.",
    span: "md:col-span-2",
    large: false,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="features" aria-label="Platform features">
      <div className="flex items-center gap-4 mb-4">
        <span className="w-12 h-px bg-primary" />
        <span className="text-primary font-[Space_Grotesk] text-xs uppercase tracking-widest">Why Choose Us</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-[Epilogue] font-black italic tracking-tight uppercase mb-16">
        Everything You Need<br />
        <span className="text-transparent bg-clip-text bg-linear-to-br from-primary to-primary-container">
          To Transform
        </span>
      </h2>

      <div className="grid md:grid-cols-3 gap-5">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`group relative bg-surface-container rounded-3xl p-8 border border-outline-variant/10 hover:border-outline-variant/30 transition-all duration-300 ${feature.span} overflow-hidden`}
          >
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <span
                  className={`material-symbols-outlined text-4xl mb-6 block ${feature.color}`}
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  {feature.icon}
                </span>
                <h3 className={`font-[Epilogue] font-extrabold uppercase italic mb-4 ${feature.large ? "text-3xl" : "text-xl"}`}>
                  {feature.title}
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">
                  {feature.description}
                </p>
              </div>
            </div>

            {/* Hover glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}>
              <div className="absolute inset-0 bg-linear-to-br from-primary/3 to-transparent" />
            </div>

            {/* Number decoration */}
            <div className="absolute bottom-6 right-6 text-8xl font-[Epilogue] font-black italic text-on-surface/3 leading-none">
              {String(i + 1).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
