import {
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineCpuChip,
  HiOutlineDevicePhoneMobile,
  HiOutlineSparkles,
} from "react-icons/hi2";

const features = [
  {
    title: "Adaptive AI Coach",
    description:
      "Our engine studies user adherence, recovery, and progression to continuously tune workouts and weekly targets.",
    icon: HiOutlineCpuChip,
    layout: "xl:col-span-6",
    tone: "from-orange-500/20 via-orange-400/8 to-transparent",
  },
  {
    title: "Indian Diet Intelligence",
    description:
      "Meal recommendations map directly to Indian kitchens, from high-protein veg plans to lean non-veg routines.",
    icon: HiOutlineSparkles,
    layout: "xl:col-span-3",
    tone: "from-amber-500/14 via-orange-400/5 to-transparent",
  },
  {
    title: "Progress Analytics",
    description:
      "Weight, strength, and body metrics are unified in one dashboard that explains trends and next actions.",
    icon: HiOutlineChartBar,
    layout: "xl:col-span-3",
    tone: "from-sky-500/16 via-transparent to-transparent",
  },
  {
    title: "Habit & Streak Loop",
    description:
      "Daily check-ins, streak momentum, and XP milestones keep users engaged without noisy, distracting gamification.",
    icon: HiOutlineBolt,
    layout: "xl:col-span-6",
    tone: "from-emerald-500/14 via-transparent to-transparent",
  },
  {
    title: "Works Everywhere",
    description:
      "A single account experience across desktop and mobile, designed with fast interactions and clear information hierarchy.",
    icon: HiOutlineDevicePhoneMobile,
    layout: "xl:col-span-6",
    tone: "from-zinc-400/20 via-transparent to-transparent",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="border-b border-border/60 py-24"
      aria-label="Platform features"
      data-scroll-reveal
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Features</p>
          <h2
            data-features-headline
            className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          >
            A premium product surface designed for conversion, trust, and retention.
          </h2>
          <p data-features-intro className="mt-4 max-w-2xl text-base text-muted-foreground">
            Your existing structure is strong. This upgraded feature system adds depth, hierarchy,
            and interaction storytelling similar to modern SaaS leaders.
          </p>
        </div>

        <div className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-12" data-scroll-stagger>
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                data-stagger-item
                data-features-card
                className={`group relative overflow-hidden rounded-3xl border border-border/65 bg-card/85 p-6 shadow-[0_16px_40px_rgba(2,6,23,0.08)] transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_26px_80px_rgba(2,6,23,0.16)] ${feature.layout}`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-linear-to-br ${feature.tone} opacity-80 transition-opacity duration-500 group-hover:opacity-100`}
                />
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="relative mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>

                {feature.title === "Adaptive AI Coach" ? (
                  <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { value: "Real-time", label: "Adjustments" },
                      { value: "Recovery", label: "Aware" },
                      { value: "Weekly", label: "Optimization" },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-2xl border border-border/65 bg-background/70 p-3 text-center"
                      >
                        <p className="text-sm font-semibold text-foreground">{metric.value}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
