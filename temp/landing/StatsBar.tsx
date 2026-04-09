"use client";

const stats = [
  { value: "10,000+", label: "Active Users", suffix: "" },
  { value: "500+", label: "Diet Plans", suffix: "" },
  { value: "98%", label: "Success Rate", suffix: "" },
  { value: "24/7", label: "AI Support", suffix: "" },
];

export function StatsBar() {
  return (
    <section className="py-0 px-6 max-w-7xl mx-auto" aria-label="Key statistics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-outline-variant/10 rounded-3xl overflow-hidden border border-outline-variant/10">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`bg-surface-container-low p-8 md:p-10 text-center flex flex-col justify-center ${
              i === 0 ? "rounded-tl-3xl rounded-bl-3xl" : ""
            } ${i === stats.length - 1 ? "rounded-tr-3xl rounded-br-3xl" : ""}`}
          >
            <div className="text-4xl md:text-5xl font-[Epilogue] font-black text-primary italic mb-2">
              {stat.value}
            </div>
            <div className="font-[Space_Grotesk] text-xs uppercase tracking-widest text-on-surface-variant">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
