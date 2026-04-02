"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  iconOnly?: boolean;
  className?: string;
};

export function ThemeToggle({ iconOnly = false, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    if (iconOnly) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-10 w-10 rounded-xl p-0", className)}
          aria-label="Toggle theme"
        >
          <HiOutlineMoon className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button variant="ghost" size="sm" className={cn("w-full justify-start", className)}>
        Theme
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-10 w-10 rounded-xl p-0", className)}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isDark ? <HiOutlineSun className="h-4 w-4" /> : <HiOutlineMoon className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("w-full justify-start gap-2 rounded-2xl", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <HiOutlineSun className="h-4 w-4" /> : <HiOutlineMoon className="h-4 w-4" />}
      {isDark ? "Light theme" : "Dark theme"}
    </Button>
  );
}
