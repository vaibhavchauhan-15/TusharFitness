export type AdminRole = "admin";

export type AdminAccess = {
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
};

export type AdminDashboardKpi = {
  label: string;
  value: string;
  delta?: string;
  tone?: "default" | "positive" | "negative";
};

export type AdminTrendPoint = {
  date: string;
  users: number;
  subscriptions: number;
  revenue: number;
};

export type AdminUserListItem = {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  goal: string | null;
  dietType: string | null;
  accountStatus: "active" | "suspended" | "invited";
  country: string | null;
  tags: string[];
  createdAt: string | null;
  lastActiveAt: string | null;
};

export type DietPlanListItem = {
  id: string;
  title: string;
  slug: string | null;
  goalType: string | null;
  dietaryPreference: string | null;
  difficulty: string | null;
  status: "draft" | "published" | "archived";
  tags: string[];
  createdAt: string | null;
  publishedAt: string | null;
};

export type WorkoutProgramListItem = {
  id: string;
  title: string;
  goal: string | null;
  bodyPart: string | null;
  targetMuscle: string | null;
  difficulty: string | null;
  sets: string | null;
  reps: string | null;
  exerciseMediaPath: string | null;
  createdAt: string | null;
};

export type SubscriptionListItem = {
  id: string;
  userId: string;
  planName: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  provider: string;
  amount: number | null;
  currency: string | null;
  currentPeriodEnd: string | null;
  createdAt: string | null;
};

export type PaymentListItem = {
  id: string;
  userId: string;
  provider: string;
  amount: number;
  currency: string;
  status: "pending" | "captured" | "failed" | "refunded" | "canceled";
  paidAt: string | null;
  createdAt: string;
};

export type MediaFileListItem = {
  id: string;
  fileName: string;
  fileType: "image" | "pdf" | "video" | "other";
  url: string;
  sizeBytes: number | null;
  tags: string[];
  createdAt: string;
};

export type CategoryListItem = {
  id: string;
  type: "diet" | "workout" | "content" | "media" | "general";
  name: string;
  slug: string;
  status: "active" | "archived";
  createdAt: string;
};

export type AnnouncementListItem = {
  id: string;
  title: string;
  slug: string;
  targetAudience: string;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  createdAt: string;
};

export type AdminActivityLogItem = {
  id: string;
  actionType: string;
  entityType: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};
