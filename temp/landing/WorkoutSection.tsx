"use client";

const workoutCategories = [
  {
    title: "Fat Loss Blast",
    tag: "Burn",
    duration: "45 min",
    level: "Beginner",
    icon: "local_fire_department",
    color: "from-primary/20 to-primary-container/5",
    accent: "text-primary",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
  },
  {
    title: "Muscle Builder",
    tag: "Strength",
    duration: "60 min",
    level: "Intermediate",
    icon: "fitness_center",
    color: "from-secondary/20 to-secondary/5",
    accent: "text-secondary",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80",
  },
  {
    title: "HIIT Cardio",
    tag: "Endurance",
    duration: "30 min",
    level: "Advanced",
    icon: "directions_run",
    color: "from-tertiary/20 to-tertiary/5",
    accent: "text-tertiary",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&q=80",
  },
  {
    title: "Yoga & Recovery",
    tag: "Flexibility",
    duration: "40 min",
    level: "All Levels",
    icon: "self_improvement",
    color: "from-primary/10 to-transparent",
    accent: "text-primary",
    image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&q=80",
  },
  {
    title: "Push-Pull-Legs",
    tag: "Split",
    duration: "55 min",
    level: "Intermediate",
    icon: "exercise",
    color: "from-secondary/10 to-transparent",
    accent: "text-secondary",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80",
  },
  {
    title: "Home Workout",
    tag: "No Equipment",
    duration: "35 min",
    level: "Beginner",
    icon: "home",
    color: "from-tertiary/10 to-transparent",
    accent: "text-tertiary",
    image: "https://images.unsplash.com/photo-1599058917765-a780eda323d3?w=500&q=80",
  },
];

export function WorkoutSection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="workouts" aria-label="Workout plans">
      <div className="flex items-center gap-4 mb-4">
        <span className="w-12 h-px bg-primary" />
        <span className="text-primary font-[Space_Grotesk] text-xs uppercase tracking-widest">Train Smart</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <h2 className="text-4xl md:text-5xl font-[Epilogue] font-black italic tracking-tight uppercase">
          Workout Programs<br />
          <span className="text-transparent bg-clip-text bg-linear-to-br from-primary to-primary-container">
            For Every Goal
          </span>
        </h2>
        <p className="text-on-surface-variant max-w-md leading-relaxed">
          300+ structured workouts across fat loss, muscle building, HIIT, and recovery. All curated by certified trainers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workoutCategories.map((workout) => (
          <div
            key={workout.title}
            className={`group relative overflow-hidden rounded-3xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all duration-300 cursor-pointer`}
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={workout.image}
                alt={`${workout.title} workout plan`}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container" />
              <div className="absolute top-4 left-4 px-3 py-1 bg-background/70 backdrop-blur rounded-full">
                <span className={`text-xs font-[Space_Grotesk] uppercase tracking-widest ${workout.accent}`}>
                  {workout.tag}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className={`bg-gradient-to-b ${workout.color} bg-surface-container p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-[Epilogue] font-extrabold uppercase italic text-xl mb-1">
                    {workout.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant font-[Space_Grotesk]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {workout.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bar_chart</span>
                      {workout.level}
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-background flex items-center justify-center ${workout.accent}`}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    {workout.icon}
                  </span>
                </div>
              </div>
              <button className={`w-full py-2.5 border border-outline-variant/20 rounded-xl font-[Epilogue] font-bold uppercase text-sm ${workout.accent} hover:bg-surface-container-highest transition-colors`}>
                View Program →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
