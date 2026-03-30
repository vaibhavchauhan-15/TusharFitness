"use client";

import { ResponsiveContainer, CartesianGrid, LineChart, XAxis, YAxis, Tooltip, Line } from "recharts";
import type { AdminTrendPoint } from "@/types/admin";
import { Card } from "@/components/ui/card";

type AnalyticsChartProps = {
  points: AdminTrendPoint[];
};

export function AnalyticsChart({ points }: AnalyticsChartProps) {
  return (
    <Card className="rounded-[30px] p-5 md:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Growth Trend</p>
      <h3 className="mt-2 text-xl font-bold">Users, subscriptions, and revenue movement</h3>
      <div className="mt-5 h-80">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 760, height: 320 }}>
          <LineChart data={points}>
            <CartesianGrid stroke="rgba(249,115,22,0.12)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#f97316" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="subscriptions" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
