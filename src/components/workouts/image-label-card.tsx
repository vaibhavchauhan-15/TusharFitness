"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ImageLabelCardProps = {
  image: string;
  label: string;
  subtitle?: string;
  badge?: string;
  imageFit?: "cover" | "contain";
  imageSurfaceClassName?: string;
  showImageOverlay?: boolean;
  active?: boolean;
  onClick?: () => void;
};

export function ImageLabelCard({
  image,
  label,
  subtitle,
  badge,
  imageFit = "cover",
  imageSurfaceClassName,
  showImageOverlay = true,
  active = false,
  onClick,
}: ImageLabelCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)",
        active
          ? "border-primary bg-(--primary-soft) shadow-[0_18px_50px_rgba(249,115,22,0.24)]"
          : "border-(--card-border) bg-(--surface-strong) hover:border-(--primary)/45 hover:shadow-[0_16px_42px_rgba(217,93,10,0.18)]",
      )}
      aria-pressed={onClick ? active : undefined}
    >
      <div className={cn("relative aspect-16/10 shrink-0 overflow-hidden", imageSurfaceClassName)}>
        <Image
          src={image}
          alt={label}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 24vw"
          className={cn(
            "transition-transform duration-500 group-hover:scale-105",
            imageFit === "contain" ? "object-contain p-3" : "object-cover",
          )}
        />
        {showImageOverlay ? (
          <div className="absolute inset-0 bg-linear-to-t from-black/30 via-black/5 to-transparent" />
        ) : null}
      </div>

      <div className="flex min-h-27 flex-1 flex-col justify-between gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 font-heading text-lg font-semibold leading-tight text-foreground">{label}</p>
          {badge ? (
            <span className="rounded-full border border-(--card-border) bg-(--background)/85 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? <p className="line-clamp-1 text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-300",
          active && "opacity-100",
        )}
        style={{
          background:
            "linear-gradient(180deg, rgba(249,115,22,0) 40%, rgba(249,115,22,0.12) 100%)",
        }}
      />
    </motion.button>
  );
}
