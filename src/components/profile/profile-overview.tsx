import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SessionUser } from "@/lib/session";
import { calculateBmi, formatDate } from "@/lib/utils";

export function ProfileOverview({
  user,
}: {
  user: SessionUser;
}) {
  const bmi = user.weightKg && user.heightCm ? calculateBmi(user.weightKg, user.heightCm) : null;
  const displayName = user.name.trim() || user.email.split("@")[0] || "Athlete";
  const memberSince = user.memberSince ? formatDate(user.memberSince) : "--";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "AT";

  return (
    <div className="space-y-6">
      <div>
        <Badge>Profile page</Badge>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Unique username, clear stats, and a clean identity hub.</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[34px] p-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={displayName}
                width={108}
                height={108}
                className="h-28 w-28 rounded-[30px] object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-[30px] bg-[var(--primary-soft)] text-2xl font-semibold text-[var(--primary)]">
                {initials}
              </div>
            )}
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                @{user.username}
              </p>
              <h2 className="mt-2 text-3xl font-bold">{displayName}</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{user.email}</p>
              <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                Member since {memberSince}
              </p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ["Streak", `${user.streak} days`],
              ["XP", `${user.xp}`],
              ["Referrals", `${user.referrals}`],
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
            User details
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Age", user.age ? `${user.age}` : "--"],
              ["Gender", user.gender ?? "--"],
              ["Height", user.heightCm ? `${user.heightCm} cm` : "--"],
              ["Weight", user.weightKg ? `${user.weightKg} kg` : "--"],
              ["Goal", user.goal ?? "--"],
              ["Diet Type", user.dietType ?? "--"],
              ["Activity", user.activityLevel ?? "--"],
              ["Referral Code", user.referralCode ?? "--"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-4"
              >
                <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
                <p className="mt-2 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card id="bmi" className="rounded-[34px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            BMI calculation
          </p>
          <p className="mt-3 font-heading text-5xl font-bold">{bmi ?? "--"}</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            Based on current weight and height, this gives users a quick health marker inside the profile flow.
          </p>
          <Link
            href="/app/bmi-calculator"
            className="mt-5 inline-flex items-center rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--accent-soft)]"
          >
            Open full BMI calculator
          </Link>
        </Card>

        <Card className="rounded-[34px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Notes and coaching context
          </p>
          <div className="mt-6 rounded-[28px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-5">
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">{user.injuryNotes ?? "No notes added yet."}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
