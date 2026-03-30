export const levelTiers = [
  { level: 1, title: "Beginner", minXp: 0, badge: "Spark" },
  { level: 2, title: "Momentum Builder", minXp: 120, badge: "Lift-Off" },
  { level: 3, title: "Discipline Warrior", minXp: 280, badge: "Iron Will" },
  { level: 4, title: "Performance Engine", minXp: 460, badge: "Alpha Core" },
  { level: 5, title: "Arnold Mode", minXp: 700, badge: "Legend Forge" },
] as const;

export function getLevelFromXp(xp: number) {
  const current = [...levelTiers].reverse().find((tier) => xp >= tier.minXp) ?? levelTiers[0];
  const next = levelTiers.find((tier) => tier.level === current.level + 1) ?? null;

  return {
    ...current,
    nextLevelXp: next?.minXp ?? current.minXp,
    progress:
      next && next.minXp > current.minXp
        ? Math.min(
            100,
            Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100),
          )
        : 100,
  };
}
