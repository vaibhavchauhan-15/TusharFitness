"use client";

const dietCategories = [
  {
    title: "High-Protein Veg",
    tag: "Macro-Balanced",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    desc: "Dal, paneer, chickpeas, tofu",
  },
  {
    title: "Lean Tandoor",
    tag: "Keto-Friendly",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=600&q=80",
    desc: "Chicken tikka, seekh kebab",
  },
  {
    title: "Ancient Grains",
    tag: "Complex Carbs",
    image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&q=80",
    desc: "Ragi, jowar, bajra bowls",
  },
  {
    title: "Weight Loss Thali",
    tag: "Calorie Deficit",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
    desc: "Sabzi, roti, salad",
  },
  {
    title: "Muscle Gain Meals",
    tag: "High Calorie",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80",
    desc: "Rice, eggs, dals",
  },
];

export function DietSection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="diet" aria-label="Indian diet plans">
      <div className="flex justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="w-12 h-px bg-primary" />
            <span className="text-primary font-[Space_Grotesk] text-xs uppercase tracking-widest">Fuel Your Ambition</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-[Epilogue] font-black italic tracking-tight uppercase">
            Indian Diet<br />
            <span className="text-transparent bg-clip-text bg-linear-to-br from-primary to-primary-container">Specializations</span>
          </h2>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            className="w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Scroll left"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button
            className="w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Scroll right"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-6 no-scrollbar snap-x">
        {dietCategories.map((diet) => (
          <div key={diet.title} className="flex-none w-72 md:w-80 snap-center group cursor-pointer">
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={diet.image}
                alt={`${diet.title} - Indian diet plan for fitness`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <h3 className="text-2xl font-[Epilogue] font-bold text-on-surface uppercase italic mb-1">
                  {diet.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xs font-[Space_Grotesk] uppercase tracking-widest">
                    {diet.tag}
                  </span>
                  <span className="text-on-surface-variant text-xs">• {diet.desc}</span>
                </div>
              </div>
              <div className="absolute top-4 right-4 px-3 py-1 bg-background/70 backdrop-blur rounded-full">
                <span className="text-primary text-xs font-[Space_Grotesk] uppercase tracking-widest">
                  {diet.tag}
                </span>
              </div>
            </div>
          </div>
        ))}
        {/* CTA card */}
        <div className="flex-none w-72 md:w-80 snap-center">
          <div className="h-96 rounded-3xl border border-dashed border-outline-variant/40 flex flex-col items-center justify-center gap-4 text-center p-8 hover:border-primary/40 transition-colors group cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl">add</span>
            </div>
            <div>
              <p className="font-[Epilogue] font-black uppercase italic text-xl mb-2">500+ More Plans</p>
              <p className="text-on-surface-variant text-sm">Browse all Indian diet plans curated by nutrition experts</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
