import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  subtitle?: string;
  showText?: boolean;
  framed?: boolean;
};

export function Logo({ className, subtitle = "Daily Command Center", showText = true, framed = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative h-11 w-11 overflow-hidden",
          framed ? "rounded-2xl border border-[var(--card-border)] shadow-[0_12px_32px_rgba(15,23,42,0.16)]" : "rounded-none",
        )}
      >
        <Image
          src="/logo/logo.png"
          alt="TusharFitness logo"
          fill
          sizes="44px"
          className="object-cover"
        />
      </div>
      {showText ? (
        <div>
          <p className="font-heading text-lg font-bold tracking-tight">TusharFitness</p>
          {subtitle ? (
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
