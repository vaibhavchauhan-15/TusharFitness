import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  subtitle?: string;
  showText?: boolean;
  framed?: boolean;
  iconClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function Logo({
  className,
  subtitle = "Daily Command Center",
  showText = true,
  framed = true,
  iconClassName,
  titleClassName,
  subtitleClassName,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative h-11 w-11 overflow-hidden",
          framed ? "rounded-2xl border border-(--card-border) shadow-[0_12px_32px_rgba(15,23,42,0.16)]" : "rounded-none",
          iconClassName,
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
          <p className={cn("font-heading text-lg font-bold tracking-tight", titleClassName)}>TusharFitness</p>
          {subtitle ? (
            <p className={cn("text-xs uppercase tracking-[0.24em] text-(--muted-foreground)", subtitleClassName)}>
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
