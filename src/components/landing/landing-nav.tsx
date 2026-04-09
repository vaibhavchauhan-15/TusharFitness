"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiBars3BottomRight, HiXMark } from "react-icons/hi2";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Workouts", href: "#workouts" },
  { label: "Diet", href: "#diet" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export function LandingNav() {
  const { resolvedTheme } = useTheme();
  const [activeHref, setActiveHref] = useState<string>("#features");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTopOfPage, setIsTopOfPage] = useState(true);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const isDarkTheme = resolvedTheme === "dark";
  const isTransparentPhase = isTopOfPage;
  const hideNavbar = !isNavbarVisible && !mobileMenuOpen;

  const headerBackgroundClass = isTransparentPhase
    ? "bg-transparent"
    : isDarkTheme
      ? "bg-[#0A0A0A]/90"
      : "bg-white/92";

  const navTextActiveClass = isTransparentPhase || isDarkTheme ? "text-white" : "text-slate-900";
  const navTextIdleClass =
    isTransparentPhase || isDarkTheme
      ? "text-white/70 hover:text-white"
      : "text-slate-600 hover:text-slate-900";
  const navUnderlineClass = isTransparentPhase || isDarkTheme ? "bg-white" : "bg-slate-900";

  const iconButtonClass =
    isTransparentPhase || isDarkTheme
      ? "text-white hover:bg-white/10 hover:text-white"
      : "text-slate-700 hover:bg-slate-900/10 hover:text-slate-900";
  const loginClass =
    isTransparentPhase || isDarkTheme
      ? "text-white/80 hover:text-white"
      : "text-slate-700 hover:text-slate-900";

  const mobilePanelClass = isDarkTheme ? "bg-[#0A0A0A]" : "bg-white";
  const mobileLinkActiveClass = isDarkTheme ? "bg-white/12 text-white" : "bg-slate-900/10 text-slate-900";
  const mobileLinkIdleClass =
    isDarkTheme
      ? "text-white/70 hover:bg-white/10 hover:text-white"
      : "text-slate-600 hover:bg-slate-900/10 hover:text-slate-900";
  const mobileLoginClass =
    isDarkTheme
      ? "text-white/80 hover:bg-white/10 hover:text-white"
      : "text-slate-700 hover:bg-slate-900/10 hover:text-slate-900";

  useEffect(() => {
    const sectionElements = navItems
      .map((item) => ({ href: item.href, element: document.querySelector<HTMLElement>(item.href) }))
      .filter((entry): entry is { href: string; element: HTMLElement } => !!entry.element);

    if (!sectionElements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (!visibleEntries.length) {
          return;
        }

        const mostVisible = visibleEntries.reduce((prev, current) =>
          current.intersectionRatio > prev.intersectionRatio ? current : prev,
        );

        const matched = sectionElements.find((entry) => entry.element === mostVisible.target);
        if (matched) {
          setActiveHref(matched.href);
        }
      },
      {
        rootMargin: "-35% 0px -52% 0px",
        threshold: [0.25, 0.45, 0.7],
      },
    );

    sectionElements.forEach((entry) => observer.observe(entry.element));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("keydown", onEscape);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateScrollState = () => {
      const currentScrollY = window.scrollY;
      const topThreshold = 8;
      const directionThreshold = 4;
      const isAtTop = currentScrollY < topThreshold;

      setIsTopOfPage(isAtTop);

      if (mobileMenuOpen) {
        setIsNavbarVisible(true);
        lastScrollY = currentScrollY;
        return;
      }

      if (isAtTop) {
        setIsNavbarVisible(true);
        lastScrollY = currentScrollY;
        return;
      }

      const scrollDelta = currentScrollY - lastScrollY;
      if (Math.abs(scrollDelta) >= directionThreshold) {
        setIsNavbarVisible(scrollDelta < 0);
        lastScrollY = currentScrollY;
      }
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollState);
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-3 z-50 flex flex-col items-center px-2 transition-all duration-300 sm:px-4 ${
        hideNavbar ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
    >
      <div className={`flex h-14 w-full max-w-6xl items-center justify-between rounded-full px-3 sm:px-4 lg:px-5 ${headerBackgroundClass}`}>
        <Link href="/" aria-label="TusharFitness home">
          <Logo subtitle="" framed={false} iconClassName="h-9 w-9" titleClassName="text-xl" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => {
                setActiveHref(item.href);
                setMobileMenuOpen(false);
              }}
              className={`group relative text-sm font-medium transition-all ${
                activeHref === item.href ? navTextActiveClass : navTextIdleClass
              }`}
            >
              {item.label}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 ${navUnderlineClass} transition-all duration-300 ${
                  activeHref === item.href ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`h-8 w-8 rounded-xl border-none bg-transparent lg:hidden ${iconButtonClass}`}
          >
            {mobileMenuOpen ? <HiXMark className="h-5 w-5" /> : <HiBars3BottomRight className="h-5 w-5" />}
          </Button>
          <ThemeToggle iconOnly className={`h-8 w-8 rounded-xl border-none bg-transparent ${iconButtonClass}`} />
          <Button asChild variant="ghost" size="sm" className={`hidden h-8 rounded-xl px-3 sm:inline-flex ${loginClass}`}>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="h-8 rounded-xl bg-orange-500 px-3.5 font-semibold text-white hover:bg-orange-600">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className={`${mobilePanelClass} mt-2 w-full max-w-6xl rounded-2xl px-3 py-3 lg:hidden`}>
          <nav className="mx-auto grid w-full max-w-7xl gap-2" aria-label="Mobile primary">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => {
                  setActiveHref(item.href);
                  setMobileMenuOpen(false);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  activeHref === item.href
                    ? mobileLinkActiveClass
                    : mobileLinkIdleClass
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-1 grid grid-cols-2 gap-2 sm:hidden">
              <Button asChild variant="ghost" className={`rounded-xl ${mobileLoginClass}`}>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
              </Button>
              <Button asChild className="rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600">
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
