import Image from "next/image";
import Link from "next/link";

export function CoachSection() {
  return (
    <section
      id="about"
      className="border-b border-border/60 py-24"
      aria-label="About coach Tushar"
      data-scroll-reveal
      data-scroll-zoom
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-[0_24px_70px_rgba(2,6,23,0.14)]">
          <div className="grid lg:grid-cols-[1fr_1.15fr]">
            <div className="relative min-h-[360px] lg:min-h-[540px]" data-scroll-float>
              <Image
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1400&q=80"
                alt="Coach Tushar"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            </div>

            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">About Tushar</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Five years of coaching-driven transformation.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
                I am Tushar, a fitness coach focused on practical, long-term transformations. Over the
                last 5 years, I have trained clients across different goals including fat loss,
                muscle gain, and body recomposition. This platform combines that coaching playbook
                with AI so each user gets a smarter path, not a generic template.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { value: "5+", label: "Years experience" },
                  { value: "500+", label: "Clients coached" },
                  { value: "500+", label: "Diet variations" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              <ul className="mt-7 space-y-2 text-sm text-muted-foreground">
                <li>- Personalized workout architecture for every level</li>
                <li>- Indian diet programming aligned to user preferences</li>
                <li>- Real-time accountability through AI and progress data</li>
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Train with Tushar
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  View dashboard demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
