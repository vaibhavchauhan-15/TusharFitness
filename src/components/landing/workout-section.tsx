import Image from "next/image";
import Link from "next/link";

const workoutPrograms = [
  {
    title: "Fat Loss Accelerator",
    level: "Beginner",
    duration: "45 min",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Muscle Builder Split",
    level: "Intermediate",
    duration: "60 min",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "HIIT Endurance",
    level: "Advanced",
    duration: "30 min",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Home No-Equipment",
    level: "All levels",
    duration: "35 min",
    image:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80",
  },
];

export function WorkoutSection() {
  return (
    <section
      id="workouts"
      className="border-b border-border/60 py-24"
      aria-label="Workout programs"
      data-scroll-reveal
      data-scroll-zoom
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Workout Section</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Structured plans for every fitness goal.
            </h2>
          </div>
          <Link
            href="/workouts"
            className="inline-flex items-center text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Browse full workout library
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-scroll-stagger>
          {workoutPrograms.map((workout) => (
            <article
              key={workout.title}
              data-stagger-item
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-[0_16px_42px_rgba(2,6,23,0.1)]"
            >
              <div className="relative h-48 overflow-hidden sm:h-52" data-scroll-float>
                <Image
                  src={workout.image}
                  alt={workout.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white backdrop-blur">
                  {workout.level}
                </span>
              </div>
              <div className="flex flex-1 flex-col space-y-2 p-5">
                <h3 className="text-lg font-semibold text-foreground">{workout.title}</h3>
                <p className="text-sm text-muted-foreground">Session length: {workout.duration}</p>
                <Link
                  href="/workouts"
                  className="mt-auto inline-flex items-center pt-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  View program
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
