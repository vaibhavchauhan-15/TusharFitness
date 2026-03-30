"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type {
  DashboardActivityItem,
  DashboardProgressPoint,
  DashboardSnapshot,
  SessionUser,
} from "@/lib/session";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardOverviewProps = {
  user: SessionUser;
  snapshot: DashboardSnapshot;
  activityOverview: DashboardActivityItem[];
  progressData: DashboardProgressPoint[];
};

function asMetric(value: number | null, unit = "") {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${value}${unit}`;
}

export function DashboardOverview({ user, snapshot, activityOverview, progressData }: DashboardOverviewProps) {
  const firstName = user.name.trim().split(" ")[0] || "Athlete";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden rounded-[34px] p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge>Daily Command Center</Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">Welcome back, {firstName}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
                Your fitness stack is primed with today&apos;s workout, fuel targets, and performance momentum.
              </p>
            </div>
            <div className="rounded-[26px] bg-[var(--primary-soft)] px-5 py-4">
              <p className="text-sm text-[var(--muted-foreground)]">Current title</p>
              <p className="font-heading text-2xl font-bold text-[var(--primary)]">{user.title}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-5">
              <p className="text-sm text-[var(--muted-foreground)]">Current streak</p>
              <p className="mt-3 font-heading text-4xl font-bold">{user.streak} days</p>
            </div>
            <div className="rounded-[28px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-5">
              <p className="text-sm text-[var(--muted-foreground)]">XP balance</p>
              <p className="mt-3 font-heading text-4xl font-bold">{user.xp}</p>
            </div>
            <div className="rounded-[28px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-5">
              <p className="text-sm text-[var(--muted-foreground)]">Badge unlocked</p>
              <p className="mt-3 font-heading text-3xl font-bold">{user.badge}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Level progress</span>
              <span className="font-semibold">{user.progress}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--primary-soft)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${user.progress}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="rounded-[34px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Activity Overview
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {activityOverview.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-strong)] px-4 py-5"
              >
                <p className="text-sm text-[var(--muted-foreground)]">{item.label}</p>
                <p className="mt-2 font-heading text-3xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[34px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Progress graph
              </p>
              <h2 className="mt-2 text-2xl font-bold">Monthly weight and lifting trend</h2>
            </div>
            <Badge>Monthly</Badge>
          </div>
          <div className="mt-8 h-80">
            {progressData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                initialDimension={{ width: 720, height: 320 }}
              >
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="weightFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.48} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="liftFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(249,115,22,0.12)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis yAxisId="weight" stroke="var(--muted-foreground)" />
                  <YAxis yAxisId="lift" orientation="right" stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Area
                    yAxisId="weight"
                    type="monotone"
                    dataKey="bodyWeight"
                    stroke="#f97316"
                    strokeWidth={3}
                    fill="url(#weightFill)"
                  />
                  <Area
                    yAxisId="lift"
                    type="monotone"
                    dataKey="weightLifted"
                    stroke="#fbbf24"
                    strokeWidth={3}
                    fill="url(#liftFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-strong)] px-4 text-sm text-[var(--muted-foreground)]">
                No progress logs yet. Start logging weight and strength in Analytics.
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[34px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Fuel Breakdown
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                ["Calories", asMetric(snapshot.calories)],
                ["Protein", asMetric(snapshot.protein, "g")],
                ["Carbs", asMetric(snapshot.carbs, "g")],
                ["Fats", asMetric(snapshot.fats, "g")],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-4"
                >
                  <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
                  <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[34px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Today&apos;s Workout
            </p>
            {snapshot.todayWorkout ? (
              <>
                <h3 className="mt-3 text-2xl font-bold">{snapshot.todayWorkout.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                  {snapshot.todayWorkout.description}
                </p>
                <div className="mt-5 space-y-3">
                  {snapshot.todayWorkout.exercises.map((exercise) => (
                    <div
                      key={exercise.name}
                      className="rounded-[22px] border border-[var(--card-border)] bg-[var(--surface-strong)] px-4 py-3"
                    >
                      <p className="font-semibold">{exercise.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {exercise.sets} sets • {exercise.reps}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                No workout plan found in database yet.
              </p>
            )}
          </Card>

          <Card className="rounded-[34px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Today&apos;s Diet
            </p>
            {snapshot.todayDiet ? (
              <>
                <h3 className="mt-3 text-2xl font-bold">{snapshot.todayDiet.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{snapshot.todayDiet.category}</p>
                <div className="mt-5 space-y-3">
                  {snapshot.todayDiet.meals.map((meal) => (
                    <div
                      key={`${meal.time}-${meal.meal}`}
                      className="rounded-[22px] border border-[var(--card-border)] bg-[var(--surface-strong)] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{meal.meal}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">{meal.time}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        {meal.items.join(" • ")}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                No diet plan found in database yet.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
