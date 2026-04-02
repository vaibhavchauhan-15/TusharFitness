import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
};

export const dynamic = "force-dynamic";

type WeightLogRow = {
  value_kg: number;
  logged_at: string;
};

type StrengthLogRow = {
  lift: string;
  value_kg: number;
  logged_at: string;
};

type MeasurementLogRow = {
  label: string;
  value: number;
  logged_at: string;
};

type LogPayload =
  | { type: "weight"; valueKg: number }
  | { type: "strength"; lift: string; valueKg: number }
  | { type: "measurement"; label: string; value: number };

function monthLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Now";
  }

  return parsed.toLocaleString("en-IN", { month: "short" });
}

async function getAuthedSupabaseContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { supabase, user };
}

export async function GET() {
  const context = await getAuthedSupabaseContext();

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { supabase, user } = context;

  const [{ data: weightRows }, { data: strengthRows }, { data: measurementRows }] =
    await Promise.all([
      supabase
        .from("weight_logs")
        .select("value_kg, logged_at")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: true })
        .returns<WeightLogRow[]>(),
      supabase
        .from("strength_logs")
        .select("lift, value_kg, logged_at")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .returns<StrengthLogRow[]>(),
      supabase
        .from("measurement_logs")
        .select("label, value, logged_at")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .returns<MeasurementLogRow[]>(),
    ]);

  const weightLogs = (weightRows ?? []).slice(-12).map((row) => ({
    month: monthLabel(row.logged_at),
    bodyWeight: Number(row.value_kg),
  }));

  const strengthByLift = new Map<string, StrengthLogRow[]>();
  (strengthRows ?? []).forEach((row) => {
    const key = row.lift.trim();
    const existing = strengthByLift.get(key) ?? [];
    if (existing.length < 2) {
      existing.push(row);
      strengthByLift.set(key, existing);
    }
  });

  const strengthData = Array.from(strengthByLift.entries()).map(([lift, rows]) => ({
    lift,
    current: Number(rows[0]?.value_kg ?? 0),
    previous: Number(rows[1]?.value_kg ?? rows[0]?.value_kg ?? 0),
  }));

  const measurementByLabel = new Map<string, MeasurementLogRow>();
  (measurementRows ?? []).forEach((row) => {
    const key = row.label.trim();
    if (!measurementByLabel.has(key)) {
      measurementByLabel.set(key, row);
    }
  });

  const measurementData = Array.from(measurementByLabel.entries()).map(([label, row]) => ({
    label,
    value: Number(row.value),
  }));

  return NextResponse.json(
    {
      weightLogs,
      strengthData,
      measurementData,
    },
    {
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function POST(request: Request) {
  const context = await getAuthedSupabaseContext();

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { supabase, user } = context;
  const payload = (await request.json()) as Partial<LogPayload>;

  if (payload.type === "weight") {
    const valueKg = Number(payload.valueKg);

    if (!Number.isFinite(valueKg) || valueKg <= 0) {
      return NextResponse.json({ error: "Invalid weight value." }, { status: 400, headers: NO_STORE_HEADERS });
    }

    await Promise.all([
      supabase.from("weight_logs").insert({ user_id: user.id, value_kg: valueKg }),
      supabase.from("profiles").update({ weight_kg: valueKg }).eq("id", user.id),
    ]);

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  }

  if (payload.type === "strength") {
    const lift = String(payload.lift ?? "").trim();
    const valueKg = Number(payload.valueKg);

    if (!lift || !Number.isFinite(valueKg) || valueKg <= 0) {
      return NextResponse.json({ error: "Invalid strength payload." }, { status: 400, headers: NO_STORE_HEADERS });
    }

    await supabase.from("strength_logs").insert({
      user_id: user.id,
      lift,
      value_kg: valueKg,
    });

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  }

  if (payload.type === "measurement") {
    const label = String(payload.label ?? "").trim();
    const value = Number(payload.value);

    if (!label || !Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Invalid measurement payload." }, { status: 400, headers: NO_STORE_HEADERS });
    }

    await supabase.from("measurement_logs").insert({
      user_id: user.id,
      label,
      value,
    });

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ error: "Unsupported log type." }, { status: 400, headers: NO_STORE_HEADERS });
}
