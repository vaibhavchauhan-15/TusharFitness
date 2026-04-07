"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiBars3BottomLeft,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineMegaphone,
  HiOutlinePhoto,
  HiOutlineQueueList,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
  HiXMark,
} from "react-icons/hi2";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const adminNavigation = [
  { href: "/admin/dashboard", label: "Dashboard", icon: HiOutlineHome },
  { href: "/admin/users", label: "Users", icon: HiOutlineUserGroup },
  { href: "/admin/diet-plans", label: "Diet Plans", icon: HiOutlineQueueList },
  { href: "/admin/workouts", label: "Workouts", icon: HiOutlineClipboardDocumentList },
  { href: "/admin/exercise-library", label: "Exercise Library", icon: HiOutlineClipboardDocumentList },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: HiOutlineCreditCard },
  { href: "/admin/payments", label: "Payments", icon: HiOutlineCreditCard },
  { href: "/admin/categories", label: "Categories", icon: HiOutlineSquares2X2 },
  { href: "/admin/media", label: "Media", icon: HiOutlinePhoto },
  { href: "/admin/announcements", label: "Announcements", icon: HiOutlineMegaphone },
  { href: "/admin/analytics", label: "Analytics", icon: HiOutlineChartBarSquare },
  { href: "/admin/settings", label: "Settings", icon: HiOutlineCog6Tooth },
] as const;

type AdminShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    username: string;
  };
  roleLabel: string;
};

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "AD"
  );
}

export function AdminShell({ children, user, roleLabel }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName = user.name.trim() || user.email.split("@")[0] || "Admin";
  const initials = getInitials(displayName);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-420 gap-4 px-3 py-3 md:px-4">
        <aside
          className={cn(
            "glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] flex-col rounded-[30px] transition-[width,padding] duration-200 lg:flex",
            collapsed ? "w-25.5 p-3" : "w-75 p-4",
          )}
        >
          <div className={cn("mb-5 flex items-center", collapsed ? "flex-col gap-3" : "justify-between gap-3")}>
            <Link
              href="/admin/dashboard"
              className={cn("min-w-0", collapsed ? "flex justify-center" : "flex items-center gap-3")}
              aria-label="Go to admin dashboard"
            >
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-(--card-border) shadow-[0_12px_32px_rgba(15,23,42,0.2)]">
                <Image src="/logo/logo.png" alt="TusharFitness logo" fill sizes="44px" className="object-cover" />
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-bold tracking-tight">TusharFitness</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Admin Command Center</p>
                </div>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed((current) => !current)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--surface-strong) text-muted-foreground transition hover:text-foreground"
              aria-label={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
            >
              {collapsed ? <HiChevronRight className="h-5 w-5" /> : <HiChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          <div className={cn("mb-4", collapsed ? "flex justify-center" : "")}>
            <Badge className={cn(collapsed ? "px-2" : "")}>{collapsed ? roleLabel.slice(0, 1) : roleLabel}</Badge>
          </div>

          <nav className="flex flex-1 flex-col gap-1.5">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-(--primary-soft) hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="relative mt-4">
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[22px] border border-(--card-border) bg-(--surface-strong) p-3 text-left transition hover:bg-(--primary-soft)",
                collapsed && "justify-center",
              )}
              aria-label="Open user menu"
              aria-expanded={profileOpen}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--primary-soft) text-sm font-semibold text-primary">
                {initials}
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                </div>
              ) : null}
            </button>

            {profileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className={cn(
                  "absolute z-30 rounded-3xl border border-(--card-border) bg-(--surface-strong) p-3 shadow-(--shadow-card)",
                  collapsed ? "bottom-0 left-[calc(100%+0.75rem)] w-65" : "bottom-[calc(100%+0.75rem)] left-0 w-full",
                )}
              >
                <div className="space-y-2">
                  <Link
                    href={`/admin/profile/${user.username}`}
                    className="block rounded-2xl px-3 py-2 text-sm font-medium transition hover:bg-(--primary-soft)"
                    onClick={() => setProfileOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="block rounded-2xl px-3 py-2 text-sm font-medium transition hover:bg-(--primary-soft)"
                    onClick={() => setProfileOpen(false)}
                  >
                    Settings
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block rounded-2xl px-3 py-2 text-sm font-medium transition hover:bg-(--primary-soft)"
                    onClick={() => setProfileOpen(false)}
                  >
                    Switch to Main Website
                  </Link>
                </div>

                <div className="mt-3 flex items-center justify-end border-t border-(--card-border) pt-3">
                  <ThemeToggle iconOnly className="border border-(--card-border) bg-(--surface-strong)" />
                </div>
              </motion.div>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="glass-panel flex h-11 w-11 items-center justify-center rounded-2xl text-foreground"
              aria-label="Open admin menu"
            >
              <HiBars3BottomLeft className="h-5 w-5" />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-5"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin menu overlay"
          />
          <aside className="glass-panel absolute inset-y-0 left-0 w-[85%] max-w-[320px] rounded-r-[28px] p-4">
            <div className="mb-6 flex items-center justify-between">
              <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-(--card-border)">
                  <Image src="/logo/logo.png" alt="TusharFitness logo" fill sizes="44px" className="object-cover" />
                </div>
                <div>
                  <p className="font-heading text-base font-bold tracking-tight">TusharFitness</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
                </div>
              </Link>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--surface-strong)"
                onClick={() => setMobileOpen(false)}
                aria-label="Close admin menu"
              >
                <HiXMark className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1.5">
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-(--primary-soft) hover:text-foreground",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 rounded-[22px] border border-(--card-border) bg-(--surface-strong) p-3">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="flex w-full items-center gap-3 text-left"
                aria-label="Open user menu"
                aria-expanded={profileOpen}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--primary-soft) text-sm font-semibold text-primary">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </button>

              {profileOpen ? (
                <div className="mt-3 rounded-2xl border border-(--card-border) bg-background/60 p-2">
                  <Link
                    href={`/admin/profile/${user.username}`}
                    className="block rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-(--primary-soft)"
                    onClick={() => {
                      setProfileOpen(false);
                      setMobileOpen(false);
                    }}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="block rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-(--primary-soft)"
                    onClick={() => {
                      setProfileOpen(false);
                      setMobileOpen(false);
                    }}
                  >
                    Settings
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-(--primary-soft)"
                    onClick={() => {
                      setProfileOpen(false);
                      setMobileOpen(false);
                    }}
                  >
                    Switch to Main Website
                  </Link>
                  <div className="mt-2 flex justify-end border-t border-(--card-border) pt-2">
                    <ThemeToggle iconOnly className="border border-(--card-border) bg-(--surface-strong)" />
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

