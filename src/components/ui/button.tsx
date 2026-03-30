"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

const variantClasses = {
  primary:
    "bg-[var(--primary)] text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] hover:bg-[var(--primary-strong)]",
  secondary:
    "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--primary-soft)]",
  outline:
    "border border-[var(--card-border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--primary-soft)]",
};

const sizeClasses = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
