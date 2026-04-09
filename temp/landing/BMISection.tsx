"use client";

import { useState } from "react";

export function BMISection() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState("");

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h || h <= 0) return;
    const result = w / (h * h);
    setBmi(parseFloat(result.toFixed(1)));

    if (result < 18.5) setCategory("Underweight");
    else if (result < 25) setCategory("Optimal Range");
    else if (result < 30) setCategory("Overweight");
    else setCategory("Obese");
  };

  const bmiProgress = bmi ? Math.min(Math.max(((bmi - 10) / 30) * 100, 0), 100) : 42;
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference - (bmiProgress / 100) * circumference;

  const categoryColor =
    category === "Optimal Range"
      ? "text-tertiary"
      : category === "Underweight"
      ? "text-secondary"
      : "text-error";

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="bmi" aria-label="BMI Calculator">
      <div className="bg-surface-container rounded-4xl p-8 md:p-12 border border-outline-variant/10 flex flex-col md:flex-row gap-12 items-center">
        {/* Left: Form */}
        <div className="w-full md:w-1/2">
          <div className="flex items-center gap-4 mb-4">
            <span className="w-12 h-px bg-primary" />
            <span className="text-primary font-[Space_Grotesk] text-xs uppercase tracking-widest">Know Your Baseline</span>
          </div>
          <h2 className="text-4xl font-[Epilogue] font-black italic tracking-tight uppercase mb-4">
            BMI Calculator
          </h2>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            Calculate your Body Mass Index to get an instant AI-recommended fitness strategy tailored for you.
          </p>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-[Space_Grotesk] text-[10px] uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="bmi-weight">
                  Weight (KG)
                </label>
                <input
                  id="bmi-weight"
                  type="number"
                  placeholder="70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface font-[Space_Grotesk] focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block font-[Space_Grotesk] text-[10px] uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="bmi-height">
                  Height (CM)
                </label>
                <input
                  id="bmi-height"
                  type="number"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface font-[Space_Grotesk] focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={calculateBMI}
              id="calculate-bmi-btn"
              className="w-full py-4 bg-surface-container-highest text-primary font-[Epilogue] font-extrabold uppercase italic rounded-xl hover:bg-primary hover:text-on-accent transition-all shadow-lg active:scale-95"
            >
              Calculate My Metrics
            </button>

            {bmi && (
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <p className="text-on-surface-variant text-sm font-[Inter]">
                  Based on your BMI of <span className="text-on-surface font-bold">{bmi}</span>, we recommend a{" "}
                  <span className="text-primary">
                    {category === "Underweight"
                      ? "muscle gain & bulking"
                      : category === "Optimal Range"
                      ? "maintenance & performance"
                      : "fat loss & cardio"}
                  </span>{" "}
                  program with a matching Indian diet plan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Ring visualization */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative w-64 h-64">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256" aria-hidden="true">
              <circle
                cx="128"
                cy="128"
                r="110"
                fill="transparent"
                stroke="var(--color-surface-container-highest)"
                strokeWidth="12"
              />
              <circle
                cx="128"
                cy="128"
                r="110"
                fill="transparent"
                stroke="var(--color-primary)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-[Epilogue] font-black text-on-surface italic">
                {bmi ?? "22.4"}
              </span>
              <span className={`font-[Space_Grotesk] text-xs uppercase tracking-[0.2em] mt-2 ${bmi ? categoryColor : "text-on-surface-variant"}`}>
                {category || "Optimal Range"}
              </span>
            </div>
            {bmi && (
              <div className="absolute -top-4 -right-4 bg-tertiary text-on-tertiary-fixed px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">
                {category}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
