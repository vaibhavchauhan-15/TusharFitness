"use client";

const badges = [
  { icon: "🔥", title: "7-Day Streak", desc: "Complete 7 consecutive days", xp: 500 },
  { icon: "💪", title: "30 Workouts", desc: "Log 30 workout sessions", xp: 1000 },
  { icon: "⚖️", title: "First 5kg Lost", desc: "Lose your first 5 kilograms", xp: 750 },
  { icon: "🥗", title: "Diet Master", desc: "Follow diet 14 days straight", xp: 600 },
  { icon: "🏆", title: "Beast Mode", desc: "Reach Level 10", xp: 2000 },
  { icon: "💧", title: "Hydration Hero", desc: "Log water 21 days in a row", xp: 400 },
];

const levels = [
  { name: "Beginner", minXp: 0, maxXp: 500, colorClass: "text-on-surface-variant", badgeClass: "bg-surface-container-high text-on-surface-variant" },
  { name: "Warrior", minXp: 500, maxXp: 1500, colorClass: "text-primary", badgeClass: "bg-primary text-on-accent" },
  { name: "Hero", minXp: 1500, maxXp: 3000, colorClass: "text-secondary", badgeClass: "bg-secondary text-on-accent" },
  { name: "Champion", minXp: 3000, maxXp: 6000, colorClass: "text-tertiary", badgeClass: "bg-tertiary text-on-accent" },
  { name: "Beast Mode", minXp: 6000, maxXp: 10000, colorClass: "text-primary", badgeClass: "bg-primary text-on-accent" },
];

export function GamificationSection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="gamification" aria-label="Gamification and rewards">
      <div className="flex items-center gap-4 mb-4">
        <span className="w-12 h-px bg-primary" />
        <span className="text-primary font-[Space_Grotesk] text-xs uppercase tracking-widest">Stay Motivated</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-[Epilogue] font-black italic tracking-tight uppercase mb-16">
        Fitness as a<br />
        <span className="text-transparent bg-clip-text bg-linear-to-br from-primary to-primary-container">Game 🎮</span>
      </h2>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Streak & XP Card */}
        <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-[Space_Grotesk] text-xs text-on-surface-variant uppercase tracking-widest mb-1">Current Progress</p>
              <h3 className="text-4xl font-[Epilogue] font-black italic">
                15 DAY <span className="text-primary">STREAK</span>
              </h3>
            </div>
            <div className="relative">
              <span
                className="material-symbols-outlined text-6xl text-primary fire-pulse"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                local_fire_department
              </span>
              <div className="absolute -top-2 -right-2 bg-surface-bright text-on-accent font-black font-[Epilogue] text-[10px] px-2 py-1 rounded-full italic">
                +2
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-[Space_Grotesk] text-xs uppercase tracking-widest text-on-surface-variant">Level 3 Hero</span>
              <span className="font-[Epilogue] font-black italic text-secondary">2,450 / 3,000 XP</span>
            </div>
            <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-secondary rounded-full relative overflow-hidden"
                style={{ width: "81.6%" }}
              >
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>
            <p className="text-on-surface-variant text-xs font-[Space_Grotesk]">550 XP to reach Champion 🏆</p>
          </div>
        </div>

        {/* Level Ladder */}
        <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/10">
          <h3 className="font-[Epilogue] font-black italic uppercase text-xl mb-6">Level Ladder</h3>
          <div className="space-y-3">
            {levels.map((level, i) => (
              <div
                key={level.name}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  i === 2 ? "bg-surface-container-highest border border-outline-variant/30" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-[Epilogue] ${
                    i <= 2 ? level.badgeClass : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className={`font-[Epilogue] font-bold uppercase italic ${i <= 2 ? level.colorClass : "text-on-surface-variant"}`}>
                      {level.name}
                    </span>
                    <span className="font-[Space_Grotesk] text-xs text-on-surface-variant">
                      {level.minXp.toLocaleString()}+ XP
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 className="font-[Epilogue] font-black italic uppercase text-2xl mb-8">
          Earn Badges <span className="text-primary">& Rewards</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge, i) => (
            <div
              key={badge.title}
              className={`p-5 rounded-2xl border text-center transition-all hover:scale-105 cursor-pointer ${
                i < 2
                  ? "bg-surface-container-high border-primary/20"
                  : "bg-surface-container-low border-outline-variant/10 opacity-60"
              }`}
            >
              <div className="text-4xl mb-3">{badge.icon}</div>
              <p className="font-[Epilogue] font-bold uppercase italic text-sm mb-1">{badge.title}</p>
              <p className="text-on-surface-variant text-xs font-[Space_Grotesk] mb-2">{badge.desc}</p>
              <span className="text-xs font-[Space_Grotesk] text-primary uppercase tracking-widest">+{badge.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
