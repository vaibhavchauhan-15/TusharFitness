import type { Metadata } from "next";
import {
  HiCheckBadge,
  HiMiniChevronDown,
  HiOutlineInformationCircle,
} from "react-icons/hi2";
import { BmiCalculatorCard } from "@/components/marketing/bmi-calculator-card";
import { Card } from "@/components/ui/card";

const explanationCards = [
  {
    title: "What your BMI means",
    description:
      "BMI is weight divided by height squared. It helps screen for broad weight-status ranges and gives users a fast baseline before they look at deeper health markers.",
    eyebrow: "Formula and meaning",
  },
  {
    title: "Why age, gender, and body type matter",
    description:
      "Adult BMI ranges stay the same across age and sex, but children and teens are assessed with age- and sex-specific percentiles. Waist and hip measurements add useful body-fat distribution context.",
    eyebrow: "Context matters",
  },
  {
    title: "Limits of BMI",
    description:
      "BMI does not measure muscle mass, body-fat percentage, pregnancy, or fluid retention. It is a screening tool and should not be used alone to diagnose health conditions.",
    eyebrow: "Use with care",
  },
] as const;

const faqItems = [
  {
    question: "What is BMI?",
    answer:
      "BMI stands for Body Mass Index. It estimates weight status by comparing your weight with your height.",
  },
  {
    question: "Is BMI accurate?",
    answer:
      "BMI is useful as a screening measure, but it does not directly measure body fat, muscle, or overall fitness. It works best alongside other health information.",
  },
  {
    question: "Does gender affect BMI?",
    answer:
      "The adult BMI formula and adult cutoffs are the same regardless of sex, but sex can matter for child and teen percentile interpretation and for waist-to-hip context.",
  },
  {
    question: "Is BMI different for children?",
    answer:
      "Yes. For ages 2 to 19, clinicians use BMI-for-age percentiles because children and teens are still growing.",
  },
  {
    question: "Can athletes have a high BMI?",
    answer:
      "Yes. People with high muscle mass can have a higher BMI without carrying excess body fat, which is one reason BMI should not be used alone.",
  },
  {
    question: "Should I worry about one result?",
    answer:
      "Usually no. One reading is a screening snapshot. Trends over time, symptoms, and broader health markers matter more than a single number.",
  },
] as const;

export const metadata: Metadata = {
  title: "BMI Calculator | TusharFitness",
  description:
    "Know your BMI instantly with a clean, responsive calculator that includes adult and child modes, metric and imperial units, and practical next-step guidance.",
};

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
      {children}
    </p>
  );
}

export default function ProtectedBmiCalculatorPage() {
  return (
    <div className="space-y-6">
      <section className="glass-panel relative overflow-hidden rounded-[36px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(251,191,36,0.1),transparent_24%)] opacity-80" />
        <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)]">
              <HiCheckBadge className="h-4 w-4 text-[var(--primary)]" />
              Protected health tools
            </div>
            <h1 className="mt-6 max-w-[12ch] text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
              Know Your BMI Instantly
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-foreground)] sm:text-lg">
              Check your body mass index, understand your category, and get clear next steps for better health.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Metric and imperial support",
                "Adult and child screening modes",
                "Private, local-only result saving",
              ].map((item) => (
                <div
                  key={item}
                  className="surface-panel rounded-full px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Card className="rounded-[32px] p-5 sm:p-6">
            <div className="surface-panel rounded-[28px] p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Inside this tool
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["BMI score", "Fast screening result"],
                  ["Category", "Underweight to obesity range"],
                  ["Healthy range", "Weight guidance for your height"],
                  ["Next step", "Practical follow-up suggestions"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[22px] bg-[var(--muted)] p-4"
                  >
                    <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[24px] border border-[var(--card-border)] bg-[var(--background)]/70 p-4">
                <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                  The calculator stays inside the authenticated app now, so it inherits the same protected shell and account context as the rest of your dashboard.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section id="calculator">
        <BmiCalculatorCard />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {explanationCards.map((card) => (
          <Card key={card.title} className="rounded-[28px] p-6">
            <SectionEyebrow>{card.eyebrow}</SectionEyebrow>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {card.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
              {card.description}
            </p>
          </Card>
        ))}
      </section>

      <Card className="rounded-[30px] px-5 py-5 sm:px-6">
        <p className="flex items-start gap-3 text-sm leading-7 text-[var(--muted-foreground)]">
          <HiOutlineInformationCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
          Adult category ranges on this page follow CDC adult BMI guidance. Child and teen guidance reflects the CDC note that ages 2 to 19 should be interpreted with age- and sex-specific percentiles.
        </p>
      </Card>

      <section>
        <div className="max-w-3xl">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Common questions before trusting a BMI tool
          </h2>
        </div>

        <div className="mt-8 space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="glass-panel group rounded-[26px] px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold text-[var(--foreground)] marker:hidden">
                {item.question}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] transition group-open:rotate-180">
                  <HiMiniChevronDown className="h-5 w-5" />
                </span>
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
