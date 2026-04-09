import Image from "next/image";

const diets = [
  {
    title: "High-Protein Vegetarian",
    tag: "Macro balanced",
    description: "Paneer, lentils, tofu, and grain combinations tuned for strength goals.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Lean Non-Veg Plans",
    tag: "Fat loss",
    description: "Simple Indian meals with calorie control and high satiety for consistency.",
    image:
      "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Muscle Gain Meals",
    tag: "High calorie",
    description: "Performance meals with clean carb and protein structures for growth cycles.",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Weight-Loss Thali",
    tag: "Sustainable",
    description: "Traditional thali-inspired plans built for steady fat loss and adherence.",
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
  },
];

export function DietSection() {
  return (
    <section
      id="diet"
      className="border-b border-border/60 py-24"
      aria-label="Diet programs"
      data-scroll-reveal
      data-scroll-zoom
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Diet Section</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Personalized Indian nutrition users can actually follow.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            From fat loss to muscle gain, every diet path maps to familiar food choices and practical meal timing.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-scroll-stagger>
          {diets.map((diet) => (
            <article
              key={diet.title}
              data-stagger-item
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-[0_16px_42px_rgba(2,6,23,0.1)]"
            >
              <div className="relative h-44 sm:h-48" data-scroll-float>
                <Image
                  src={diet.image}
                  alt={diet.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white backdrop-blur">
                  {diet.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-foreground">{diet.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{diet.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
