import { subDays } from "date-fns";
import type {
  AdminActivityLogItem,
  AdminDashboardKpi,
  AdminTrendPoint,
  AdminUserListItem,
  AnnouncementListItem,
  CategoryListItem,
  DietPlanListItem,
  MediaFileListItem,
  PaymentListItem,
  SubscriptionListItem,
  WorkoutProgramListItem,
} from "@/types/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WORKOUT_BODY_PART_SPECS, WORKOUT_GOAL_SPECS } from "@/lib/workout-taxonomy";

type DashboardData = {
  kpis: AdminDashboardKpi[];
  trend: AdminTrendPoint[];
  recentUsers: AdminUserListItem[];
  recentActivity: AdminActivityLogItem[];
  latestUploads: MediaFileListItem[];
};

type ListResult<T> = {
  rows: T[];
  count: number;
};

type PaginationInput = {
  page?: number;
  pageSize?: number;
};

function toPagination(input?: PaginationInput) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, input?.pageSize ?? 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return { page, pageSize, from, to };
}

function toSearchPattern(value?: string) {
  const cleaned = value?.trim();

  if (!cleaned) {
    return null;
  }

  return `%${cleaned.replace(/%/g, "")}%`;
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

export async function getAdminDashboardData(): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      kpis: [],
      trend: [],
      recentUsers: [],
      recentActivity: [],
      latestUploads: [],
    };
  }

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7).toISOString();
  const thirtyDaysAgo = subDays(now, 30).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    usersCountResult,
    activeSubscriptionsResult,
    premiumSubscriptionsResult,
    signupsResult,
    dietsCountResult,
    workoutsCountResult,
    capturedPaymentsResult,
    canceledSubscriptionsResult,
    recentlyActiveUsersResult,
    recentUsersResult,
    recentActivityResult,
    latestUploadsResult,
    trendUsersResult,
    trendSubscriptionsResult,
    trendPaymentsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "trialing"]),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase.from("diet_plans").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("workout_plans").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("payments")
      .select("amount,status,paid_at")
      .eq("status", "captured")
      .gte("created_at", monthStart)
      .returns<Array<{ amount: number | null; status: string; paid_at: string | null }>>(),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "canceled")
      .gte("updated_at", thirtyDaysAgo),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_active_at", thirtyDaysAgo),
    supabase
      .from("profiles")
      .select("id,username,full_name,avatar_url,goal,diet_type,account_status,country,tags,created_at,last_active_at")
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<
        Array<{
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          goal: string | null;
          diet_type: string | null;
          account_status: "active" | "suspended" | "invited";
          country: string | null;
          tags: string[] | null;
          created_at: string | null;
          last_active_at: string | null;
        }>
      >(),
    supabase
      .from("admin_activity_logs")
      .select("id,action_type,entity_type,created_at,metadata")
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<
        Array<{
          id: string;
          action_type: string;
          entity_type: string;
          created_at: string;
          metadata: Record<string, unknown>;
        }>
      >(),
    supabase
      .from("media_files")
      .select("id,file_name,file_type,url,size_bytes,tags,created_at")
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<
        Array<{
          id: string;
          file_name: string;
          file_type: "image" | "pdf" | "video" | "other";
          url: string;
          size_bytes: number | null;
          tags: string[] | null;
          created_at: string;
        }>
      >(),
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sevenDaysAgo)
      .returns<Array<{ created_at: string | null }>>(),
    supabase
      .from("subscriptions")
      .select("created_at,status")
      .gte("created_at", sevenDaysAgo)
      .in("status", ["active", "trialing"])
      .returns<Array<{ created_at: string | null; status: string }>>(),
    supabase
      .from("payments")
      .select("created_at,amount,status")
      .gte("created_at", sevenDaysAgo)
      .eq("status", "captured")
      .returns<Array<{ created_at: string | null; amount: number | null; status: string }>>(),
  ]);

  const monthlyRevenue = (capturedPaymentsResult.data ?? []).reduce((sum, row) => {
    return sum + (row.amount ?? 0);
  }, 0);

  const churnBase = activeSubscriptionsResult.count ?? 0;
  const churnRate = churnBase > 0 ? ((canceledSubscriptionsResult.count ?? 0) / churnBase) * 100 : 0;

  const engagementRate =
    (usersCountResult.count ?? 0) > 0
      ? ((recentlyActiveUsersResult.count ?? 0) / (usersCountResult.count ?? 1)) * 100
      : 0;

  const kpis: AdminDashboardKpi[] = [
    { label: "Total Users", value: String(usersCountResult.count ?? 0) },
    { label: "Active Members", value: String(activeSubscriptionsResult.count ?? 0) },
    { label: "Premium Members", value: String(premiumSubscriptionsResult.count ?? 0) },
    { label: "New Signups (7d)", value: String(signupsResult.count ?? 0) },
    { label: "Diet Plans Published", value: String(dietsCountResult.count ?? 0) },
    { label: "Workout Programs Published", value: String(workoutsCountResult.count ?? 0) },
    { label: "Revenue This Month", value: toCurrency(monthlyRevenue) },
    {
      label: "Churn Rate",
      value: `${churnRate.toFixed(1)}%`,
      tone: churnRate > 7 ? "negative" : "default",
    },
    {
      label: "Engagement Rate",
      value: `${engagementRate.toFixed(1)}%`,
      tone: engagementRate > 45 ? "positive" : "default",
    },
  ];

  const buckets = new Map<string, AdminTrendPoint>();

  for (let index = 6; index >= 0; index -= 1) {
    const day = subDays(now, index);
    const dateKey = day.toISOString().slice(0, 10);

    buckets.set(dateKey, {
      date: dateKey,
      users: 0,
      subscriptions: 0,
      revenue: 0,
    });
  }

  (trendUsersResult.data ?? []).forEach((row) => {
    if (!row.created_at) {
      return;
    }

    const bucket = buckets.get(toDateKey(row.created_at));
    if (bucket) {
      bucket.users += 1;
    }
  });

  (trendSubscriptionsResult.data ?? []).forEach((row) => {
    if (!row.created_at) {
      return;
    }

    const bucket = buckets.get(toDateKey(row.created_at));
    if (bucket) {
      bucket.subscriptions += 1;
    }
  });

  (trendPaymentsResult.data ?? []).forEach((row) => {
    if (!row.created_at) {
      return;
    }

    const bucket = buckets.get(toDateKey(row.created_at));
    if (bucket) {
      bucket.revenue += row.amount ?? 0;
    }
  });

  const recentUsers: AdminUserListItem[] = (recentUsersResult.data ?? []).map((user) => ({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    goal: user.goal,
    dietType: user.diet_type,
    accountStatus: user.account_status,
    country: user.country,
    tags: user.tags ?? [],
    createdAt: user.created_at,
    lastActiveAt: user.last_active_at,
  }));

  const recentActivity: AdminActivityLogItem[] = (recentActivityResult.data ?? []).map((activity) => ({
    id: activity.id,
    actionType: activity.action_type,
    entityType: activity.entity_type,
    createdAt: activity.created_at,
    metadata: activity.metadata,
  }));

  const latestUploads: MediaFileListItem[] = (latestUploadsResult.data ?? []).map((file) => ({
    id: file.id,
    fileName: file.file_name,
    fileType: file.file_type,
    url: file.url,
    sizeBytes: file.size_bytes,
    tags: file.tags ?? [],
    createdAt: file.created_at,
  }));

  return {
    kpis,
    trend: [...buckets.values()],
    recentUsers,
    recentActivity,
    latestUploads,
  };
}

export async function listAdminUsers(input?: {
  search?: string;
  status?: "active" | "suspended" | "invited";
  page?: number;
  pageSize?: number;
}): Promise<ListResult<AdminUserListItem>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);
  const searchPattern = toSearchPattern(input?.search);

  type AdminUserRow = {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    goal: string | null;
    diet_type: string | null;
    account_status: "active" | "suspended" | "invited";
    country: string | null;
    tags: string[] | null;
    created_at: string | null;
    last_active_at: string | null;
  };

  const baseQuery = supabase
    .from("profiles")
    .select(
      "id,username,full_name,avatar_url,goal,diet_type,account_status,country,tags,created_at,last_active_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  const withStatus = input?.status ? baseQuery.eq("account_status", input.status) : baseQuery;
  const withSearch = searchPattern
    ? withStatus.or(`username.ilike.${searchPattern},full_name.ilike.${searchPattern}`)
    : withStatus;

  const { data, count } = await withSearch.range(from, to).returns<AdminUserRow[]>();

  return {
    rows: (data ?? []).map((user: AdminUserRow) => ({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      goal: user.goal,
      dietType: user.diet_type,
      accountStatus: user.account_status,
      country: user.country,
      tags: user.tags ?? [],
      createdAt: user.created_at,
      lastActiveAt: user.last_active_at,
    })),
    count: count ?? 0,
  };
}

export async function listDietPlans(input?: {
  search?: string;
  status?: "draft" | "published" | "archived";
  page?: number;
  pageSize?: number;
}): Promise<ListResult<DietPlanListItem>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);
  const searchPattern = toSearchPattern(input?.search);

  type DietPlanRow = {
    id: string;
    title: string;
    slug: string | null;
    goal_type: string | null;
    dietary_preference: string | null;
    difficulty: string | null;
    status: "draft" | "published" | "archived";
    tags: string[] | null;
    created_at: string | null;
    published_at: string | null;
  };

  const baseQuery = supabase
    .from("diet_plans")
    .select("id,title,slug,goal_type,dietary_preference,difficulty,status,tags,created_at,published_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  const withStatus = input?.status ? baseQuery.eq("status", input.status) : baseQuery;
  const withSearch = searchPattern
    ? withStatus.or(`title.ilike.${searchPattern},slug.ilike.${searchPattern}`)
    : withStatus;

  const { data, count } = await withSearch.range(from, to).returns<DietPlanRow[]>();

  return {
    rows: (data ?? []).map((plan: DietPlanRow) => ({
      id: plan.id,
      title: plan.title,
      slug: plan.slug,
      goalType: plan.goal_type,
      dietaryPreference: plan.dietary_preference,
      difficulty: plan.difficulty,
      status: plan.status,
      tags: plan.tags ?? [],
      createdAt: plan.created_at,
      publishedAt: plan.published_at,
    })),
    count: count ?? 0,
  };
}

export async function listWorkoutPrograms(input?: {
  search?: string;
  status?: "draft" | "published" | "archived";
  page?: number;
  pageSize?: number;
}): Promise<ListResult<WorkoutProgramListItem>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);
  const searchPattern = toSearchPattern(input?.search);

  type WorkoutProgramRow = {
    id: string;
    title: string;
    slug: string | null;
    goal: string | null;
    body_part: string | null;
    goal_type: string | null;
    difficulty: string | null;
    level: string | null;
    duration: string | null;
    duration_weeks: number | null;
    status: "draft" | "published" | "archived";
    tags: string[] | null;
    created_at: string | null;
    published_at: string | null;
  };

  const baseQuery = supabase
    .from("workout_plans")
    .select("id,title,slug,goal,body_part,goal_type,difficulty,level,duration,duration_weeks,status,tags,created_at,published_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  const withStatus = input?.status ? baseQuery.eq("status", input.status) : baseQuery;
  const withSearch = searchPattern
    ? withStatus.or(`title.ilike.${searchPattern},slug.ilike.${searchPattern}`)
    : withStatus;

  const { data, count } = await withSearch.range(from, to).returns<WorkoutProgramRow[]>();

  const programIds = (data ?? []).map((program) => program.id);
  const mediaByProgramId = new Map<string, string | null>();

  if (programIds.length > 0) {
    const { data: exerciseRows } = await supabase
      .from("workout_exercises")
      .select("workout_plan_id,media_url,position")
      .in("workout_plan_id", programIds)
      .order("position", { ascending: true })
      .returns<Array<{ workout_plan_id: string; media_url: string | null; position: number }>>();

    for (const row of exerciseRows ?? []) {
      if (!mediaByProgramId.has(row.workout_plan_id)) {
        mediaByProgramId.set(row.workout_plan_id, row.media_url ?? null);
      }
    }
  }

  return {
    rows: (data ?? []).map((program: WorkoutProgramRow) => ({
      id: program.id,
      title: program.title,
      slug: program.slug,
      goal: program.goal,
      bodyPart: program.body_part,
      goalType: program.goal_type,
      difficulty: program.difficulty,
      level: program.level,
      duration: program.duration,
      durationWeeks: program.duration_weeks,
      exerciseMediaUrl: mediaByProgramId.get(program.id) ?? null,
      status: program.status,
      tags: program.tags ?? [],
      createdAt: program.created_at,
      publishedAt: program.published_at,
    })),
    count: count ?? 0,
  };
}

export async function listSubscriptions(input?: {
  status?: "trialing" | "active" | "past_due" | "canceled" | "expired";
  page?: number;
  pageSize?: number;
}): Promise<ListResult<SubscriptionListItem>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);

  type SubscriptionRow = {
    id: string;
    user_id: string;
    plan_name: string;
    status: "trialing" | "active" | "past_due" | "canceled" | "expired";
    provider: string;
    amount: number | null;
    currency: string | null;
    current_period_end: string | null;
    created_at: string | null;
  };

  const baseQuery = supabase
    .from("subscriptions")
    .select("id,user_id,plan_name,status,provider,amount,currency,current_period_end,created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  const withStatus = input?.status ? baseQuery.eq("status", input.status) : baseQuery;

  const { data, count } = await withStatus.range(from, to).returns<SubscriptionRow[]>();

  return {
    rows: (data ?? []).map((subscription: SubscriptionRow) => ({
      id: subscription.id,
      userId: subscription.user_id,
      planName: subscription.plan_name,
      status: subscription.status,
      provider: subscription.provider,
      amount: subscription.amount,
      currency: subscription.currency,
      currentPeriodEnd: subscription.current_period_end,
      createdAt: subscription.created_at,
    })),
    count: count ?? 0,
  };
}

export async function listCategories(input?: PaginationInput): Promise<ListResult<CategoryListItem>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);

  const { data, count } = await supabase
    .from("categories")
    .select("id,type,name,slug,status,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<
      Array<{
        id: string;
        type: "diet" | "workout" | "content" | "media" | "general";
        name: string;
        slug: string;
        status: "active" | "archived";
        created_at: string;
      }>
    >();

  return {
    rows:
      data?.map((category) => ({
        id: category.id,
        type: category.type,
        name: category.name,
        slug: category.slug,
        status: category.status,
        createdAt: category.created_at,
      })) ?? [],
    count: count ?? 0,
  };
}

export async function listMediaFiles(input?: PaginationInput): Promise<ListResult<MediaFileListItem>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);

  const { data, count } = await supabase
    .from("media_files")
    .select("id,file_name,file_type,url,size_bytes,tags,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<
      Array<{
        id: string;
        file_name: string;
        file_type: "image" | "pdf" | "video" | "other";
        url: string;
        size_bytes: number | null;
        tags: string[] | null;
        created_at: string;
      }>
    >();

  return {
    rows:
      data?.map((media) => ({
        id: media.id,
        fileName: media.file_name,
        fileType: media.file_type,
        url: media.url,
        sizeBytes: media.size_bytes,
        tags: media.tags ?? [],
        createdAt: media.created_at,
      })) ?? [],
    count: count ?? 0,
  };
}

export async function listAnnouncements(input?: PaginationInput): Promise<ListResult<AnnouncementListItem>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);

  const { data, count } = await supabase
    .from("announcements")
    .select("id,title,slug,target_audience,status,published_at,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<
      Array<{
        id: string;
        title: string;
        slug: string;
        target_audience: string;
        status: "draft" | "published" | "archived";
        published_at: string | null;
        created_at: string;
      }>
    >();

  return {
    rows:
      data?.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        slug: announcement.slug,
        targetAudience: announcement.target_audience,
        status: announcement.status,
        publishedAt: announcement.published_at,
        createdAt: announcement.created_at,
      })) ?? [],
    count: count ?? 0,
  };
}

export async function listAdminActivity(input?: PaginationInput): Promise<ListResult<AdminActivityLogItem>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);

  const { data, count } = await supabase
    .from("admin_activity_logs")
    .select("id,action_type,entity_type,created_at,metadata", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<
      Array<{
        id: string;
        action_type: string;
        entity_type: string;
        created_at: string;
        metadata: Record<string, unknown>;
      }>
    >();

  return {
    rows:
      data?.map((row) => ({
        id: row.id,
        actionType: row.action_type,
        entityType: row.entity_type,
        createdAt: row.created_at,
        metadata: row.metadata,
      })) ?? [],
    count: count ?? 0,
  };
}

export async function listPayments(input?: {
  status?: "pending" | "captured" | "failed" | "refunded" | "canceled";
  page?: number;
  pageSize?: number;
}): Promise<ListResult<PaymentListItem>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);

  type PaymentRow = {
    id: string;
    user_id: string;
    provider: string;
    amount: number;
    currency: string;
    status: "pending" | "captured" | "failed" | "refunded" | "canceled";
    paid_at: string | null;
    created_at: string;
  };

  const baseQuery = supabase
    .from("payments")
    .select("id,user_id,provider,amount,currency,status,paid_at,created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  const withStatus = input?.status ? baseQuery.eq("status", input.status) : baseQuery;

  const { data, count } = await withStatus.range(from, to).returns<PaymentRow[]>();

  return {
    rows:
      data?.map((row: PaymentRow) => ({
        id: row.id,
        userId: row.user_id,
        provider: row.provider,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        paidAt: row.paid_at,
        createdAt: row.created_at,
      })) ?? [],
    count: count ?? 0,
  };
}

export async function listExerciseLibrary(input?: PaginationInput) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { rows: [], count: 0 };
  }

  const { from, to } = toPagination(input);

  const result = await supabase
    .from("workout_exercises")
    .select(
      "id,name,slug,goal_slug,body_part_slug,equipment,target_muscle,difficulty,thumbnail_url,media_url,sets,reps,created_at",
      { count: "exact" },
    )
    .not("slug", "is", null)
    .not("goal_slug", "is", null)
    .not("body_part_slug", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<
      Array<{
        id: string;
        name: string;
        slug: string;
        goal_slug: string;
        body_part_slug: string;
        equipment: string;
        target_muscle: string;
        difficulty: string | null;
        thumbnail_url: string | null;
        media_url: string | null;
        sets: string;
        reps: string;
        created_at: string;
      }>
    >();

  if (result.error) {
    return { rows: [], count: 0 };
  }

  return {
    rows: result.data ?? [],
    count: result.count ?? 0,
  };
}

export function listWorkoutTaxonomyOptions() {
  return {
    goals: WORKOUT_GOAL_SPECS.map((goal) => ({ slug: goal.slug, name: goal.name })),
    bodyParts: WORKOUT_BODY_PART_SPECS.map((bodyPart) => ({ slug: bodyPart.slug, name: bodyPart.name })),
  };
}
