"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiBars3BottomLeft,
  HiMiniSparkles,
  HiOutlineArrowTrendingUp,
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineHome,
  HiOutlineQueueList,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { motion } from "framer-motion";
import { signOutAction } from "@/app/actions";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const appNavigation = [
  { href: "/app/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/app/workouts", label: "Workouts", icon: "workout" },
  { href: "/app/fuel", label: "Diet Plans", icon: "fuel" },
  { href: "/app/analytics", label: "Analytics", icon: "analytics" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
] as const;

const iconMap = {
  dashboard: HiOutlineHome,
  workout: HiOutlineClipboardDocumentList,
  fuel: HiOutlineQueueList,
  analytics: HiOutlineChartBarSquare,
  profile: HiOutlineUserCircle,
  settings: HiOutlineCog6Tooth,
};

type AppShellProps = {
  children: React.ReactNode;
  isAdmin?: boolean;
  user: {
    avatar: string | null;
    name: string;
    email: string;
    username: string;
    level: number;
    title: string;
  };
};

export function AppShell({ children, user, isAdmin = false }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdminRoute = pathname.startsWith("/app/admin");
  const displayName = user.name.trim() || user.email.split("@")[0] || "Athlete";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "AT";

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-3 py-3 md:px-4">
        <aside
          className={cn(
            "glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[32px] p-4 transition-[width,padding] duration-300 ease-out lg:flex",
            collapsed ? "w-[92px] px-2.5 py-3" : "w-[300px] p-4",
          )}
        >
          <div
            className={cn(
              collapsed ? "mb-5 flex items-center justify-between gap-1.5" : "mb-8 flex items-center justify-between gap-2",
            )}
          >
            <Logo
              showText={!collapsed}
              framed={!collapsed}
              className={cn("min-w-0", collapsed && "justify-start")}
            />
            <button
              type="button"
              onClick={() => setCollapsed((current) => !current)}
              className={cn(
                "flex items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)] transition hover:bg-[var(--accent-soft)]",
                collapsed ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl",
              )}
              aria-label="Toggle sidebar"
            >
              <HiBars3BottomLeft className="h-5 w-5" />
            </button>
          </div>

          <nav className={cn("flex flex-1 flex-col", collapsed ? "gap-1.5" : "gap-2")}>
            {[...appNavigation, { href: `/app/profile/${user.username}`, label: "Profile", icon: "profile" }].map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors duration-200",
                    collapsed ? "h-11 justify-center rounded-xl px-0 py-0" : "h-12 rounded-2xl px-4 py-3",
                    active
                      ? "bg-[var(--foreground)] text-[var(--background)] shadow-[0_12px_32px_rgba(15,15,15,0.15)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--primary-soft)] hover:text-[var(--foreground)]",
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "ml-3 overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200",
                      collapsed ? "ml-0 max-w-0 opacity-0" : "max-w-[170px] opacity-100",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {!collapsed ? (
            <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--primary-soft)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">
                  <HiOutlineArrowTrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Level {user.level}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{user.title}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className={cn("relative", collapsed ? "mt-2" : "mt-4")}>
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              className={cn(
                "flex items-center gap-3 border border-[var(--card-border)] bg-[var(--surface-strong)] text-left transition hover:bg-[var(--primary-soft)]",
                collapsed ? "mx-auto h-16 w-16 justify-center rounded-3xl p-0" : "w-full rounded-[24px] p-3",
              )}
            >
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={displayName}
                  width={44}
                  height={44}
                  className={cn("object-cover", collapsed ? "h-10 w-10 rounded-full" : "h-11 w-11 rounded-2xl")}
                />
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-center bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]",
                    collapsed ? "h-10 w-10" : "h-11 w-11",
                    collapsed ? "rounded-full" : "rounded-2xl",
                  )}
                >
                  {initials}
                </div>
              )}
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">{user.email}</p>
                </div>
              ) : null}
            </button>

            {profileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "absolute z-20 rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-3 shadow-[var(--shadow-card)]",
                  collapsed ? "bottom-0 left-[calc(100%+0.75rem)] w-[280px]" : "bottom-20 left-0 w-full",
                )}
              >
                <div className="space-y-2">
                  <Link
                    href={`/app/profile/${user.username}`}
                    className="block rounded-2xl px-3 py-2 text-sm hover:bg-[var(--primary-soft)]"
                  >
                    User Profile
                  </Link>
                  <Link
                    href="/app/settings"
                    className="block rounded-2xl px-3 py-2 text-sm hover:bg-[var(--primary-soft)]"
                  >
                    Settings
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/app/admin/dashboard"
                      className="block rounded-2xl px-3 py-2 text-sm hover:bg-[var(--primary-soft)]"
                    >
                      Switch to Admin Page
                    </Link>
                  ) : null}
                  <div className="rounded-2xl px-1 py-1">
                    <ThemeToggle />
                  </div>
                  <Link
                    href="/app/bmi-calculator"
                    className="block rounded-2xl px-3 py-2 text-sm hover:bg-[var(--primary-soft)]"
                  >
                    BMI Calculation
                  </Link>
                  <form action={signOutAction}>
                    <Button variant="ghost" size="sm" className="w-full justify-start rounded-2xl px-3">
                      Sign out
                    </Button>
                  </form>
                </div>
              </motion.div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="glass-panel mb-4 flex items-center justify-between rounded-[28px] px-4 py-3 lg:hidden">
            <Logo />
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>

          <main className="min-w-0 flex-1">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>

          <Link
            href="/chat"
            className="fixed bottom-6 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_20px_45px_rgba(249,115,22,0.4)] transition hover:scale-[1.02] xl:right-8"
            aria-label="Open AI chat page"
            title="Open AI chat"
          >
            <HiMiniSparkles className="h-7 w-7" />
          </Link>
        </div>
      </div>

    </div>
  );
}
