"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OptionSelector, type OptionSelectorOption } from "@/components/ui/option-selector";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type WeightLogPoint = {
  month: string;
  bodyWeight: number;
  weightLifted: number;
};

type StrengthLogPoint = {
  lift: string;
  current: number;
  previous: number;
};

type MeasurementLogPoint = {
  label: string;
  value: number;
};

const MEASUREMENT_OPTIONS: OptionSelectorOption[] = [
  { value: "Chest", label: "Chest" },
  { value: "Shoulders", label: "Shoulders" },
  { value: "Waist", label: "Waist" },
  { value: "Arms", label: "Arms" },
  { value: "Biceps", label: "Biceps" },
];

export function AnalyticsOverview() {
  const [weightLogs, setWeightLogs] = useState<WeightLogPoint[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [measurements, setMeasurements] = useState<MeasurementLogPoint[]>([]);
  const [strengthLogs, setStrengthLogs] = useState<StrengthLogPoint[]>([]);
  const [liftName, setLiftName] = useState("Bench Press");
  const [liftInput, setLiftInput] = useState("");
  const [measurementLabel, setMeasurementLabel] = useState("Chest");
  const [measurementInput, setMeasurementInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setSyncing(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/analytics/logs", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Could not load analytics logs.");
        }

        const data = (await response.json()) as {
          weightLogs?: Array<{ month: string; bodyWeight: number }>;
          strengthData?: Array<{ lift: string; current: number; previous: number }>;
          measurementData?: Array<{ label: string; value: number }>;
        };

        if (cancelled) {
          return;
        }

        if (Array.isArray(data.weightLogs)) {
          const lastLift = 0;
          setWeightLogs(
            data.weightLogs.map((item, index) => ({
              month: item.month,
              bodyWeight: item.bodyWeight,
              weightLifted: lastLift + index * 15,
            })),
          );
        }

        if (Array.isArray(data.strengthData)) {
          setStrengthLogs(data.strengthData);
        }

        if (Array.isArray(data.measurementData)) {
          setMeasurements(data.measurementData);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Could not sync analytics.");
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    }

    void loadLogs();

    return () => {
      cancelled = true;
    };
  }, []);

  const liftOptions = useMemo(() => {
    const base = ["Bench Press", "Squat", "Deadlift", "Overhead Press"];
    const fromLogs = strengthLogs.map((item) => item.lift);
    return Array.from(new Set([...base, ...fromLogs])).map((lift) => ({
      value: lift,
      label: lift,
    }));
  }, [strengthLogs]);

  async function postLog(payload: Record<string, unknown>) {
    const response = await fetch("/api/analytics/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Could not save analytics log.");
    }
  }

  async function handleWeightLog() {
    const parsed = Number(weightInput);

    if (!parsed) {
      return;
    }

    setSyncing(true);
    setErrorMessage(null);

    try {
      await postLog({ type: "weight", valueKg: parsed });

      setWeightLogs((current) => [
        ...current.slice(-11),
        {
          month: "Now",
          bodyWeight: parsed,
          weightLifted: current.at(-1)?.weightLifted ?? 0,
        },
      ]);
      setWeightInput("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save weight log.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleStrengthLog() {
    const parsed = Number(liftInput);

    if (!liftName || !parsed) {
      return;
    }

    setSyncing(true);
    setErrorMessage(null);

    try {
      await postLog({ type: "strength", lift: liftName, valueKg: parsed });

      setStrengthLogs((current) => {
        const existing = current.find((item) => item.lift === liftName);

        if (!existing) {
          return [...current, { lift: liftName, current: parsed, previous: parsed }];
        }

        return current.map((item) =>
          item.lift === liftName
            ? { ...item, previous: item.current, current: parsed }
            : item,
        );
      });
      setLiftInput("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save strength log.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleMeasurementLog() {
    const parsed = Number(measurementInput);

    if (!measurementLabel || !parsed) {
      return;
    }

    setSyncing(true);
    setErrorMessage(null);

    try {
      await postLog({ type: "measurement", label: measurementLabel, value: parsed });

      setMeasurements((current) => {
        const existing = current.find((item) => item.label === measurementLabel);

        if (!existing) {
          return [...current, { label: measurementLabel, value: parsed }];
        }

        return current.map((item) =>
          item.label === measurementLabel ? { ...item, value: parsed } : item,
        );
      });
      setMeasurementInput("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save measurement log.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge>Progress analytics</Badge>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Track body weight, measurements, and strength progression.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          This startup page gives users a clean place to log progress, review monthly changes, and stay motivated with visible strength movement.
        </p>
        {errorMessage ? (
          <p className="mt-3 rounded-2xl border border-(--card-border) bg-(--surface-strong) px-4 py-3 text-sm text-muted-foreground">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[34px] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Weight history
              </p>
              <h2 className="mt-2 text-2xl font-bold">Body weight trend</h2>
            </div>
            <div className="flex gap-3">
              <Input
                value={weightInput}
                onChange={(event) => setWeightInput(event.target.value)}
                type="number"
                step="0.1"
                placeholder="Add kg"
                className="w-32"
              />
              <Button
                type="button"
                onClick={() => void handleWeightLog()}
                disabled={syncing}
              >
                {syncing ? "Saving..." : "Log"}
              </Button>
            </div>
          </div>
          <div className="mt-8 h-80">
            {weightLogs.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                initialDimension={{ width: 720, height: 320 }}
              >
                <LineChart data={weightLogs}>
                  <CartesianGrid stroke="rgba(249,115,22,0.12)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Line type="monotone" dataKey="bodyWeight" stroke="#f97316" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-(--card-border) bg-(--surface-strong) px-4 text-center text-sm text-muted-foreground">
                No weight logs yet. Add your first entry to start tracking progress.
              </div>
            )}
          </div>
        </Card>

        <Card className="rounded-[34px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Body measurements
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <OptionSelector
              value={measurementLabel}
              onValueChange={setMeasurementLabel}
              options={MEASUREMENT_OPTIONS}
            />
            <Input
              value={measurementInput}
              onChange={(event) => setMeasurementInput(event.target.value)}
              type="number"
              step="0.1"
              placeholder="Inches"
            />
            <Button type="button" onClick={() => void handleMeasurementLog()} disabled={syncing}>
              Log
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {measurements.length > 0 ? (
              measurements.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-(--card-border) bg-(--surface-strong) p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.label}</p>
                    <p className="font-heading text-2xl font-bold">{item.value}&quot;</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-(--card-border) bg-(--surface-strong) p-4 text-sm text-muted-foreground">
                No measurement logs yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="rounded-[34px] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Strength tracking
        </p>
        <h2 className="mt-2 text-2xl font-bold">Bench, squat, deadlift, and overhead press progression</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <OptionSelector
            value={liftName}
            onValueChange={setLiftName}
            options={liftOptions}
          />
          <Input
            value={liftInput}
            onChange={(event) => setLiftInput(event.target.value)}
            type="number"
            step="0.5"
            placeholder="kg"
          />
          <Button type="button" onClick={() => void handleStrengthLog()} disabled={syncing}>
            Log
          </Button>
        </div>
        <div className="mt-8 h-80">
          {strengthLogs.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 720, height: 320 }}
            >
              <BarChart data={strengthLogs}>
                <CartesianGrid stroke="rgba(249,115,22,0.12)" vertical={false} />
                <XAxis dataKey="lift" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="previous" fill="rgba(251,191,36,0.55)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="current" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-(--card-border) bg-(--surface-strong) px-4 text-center text-sm text-muted-foreground">
              No strength logs yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
