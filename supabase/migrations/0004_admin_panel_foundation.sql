-- Admin panel foundation: roles, content management, billing, media, and audit logs.

alter table public.profiles
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'invited')),
  add column if not exists country text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists last_active_at timestamptz;

create index if not exists idx_profiles_account_status
on public.profiles(account_status);

create index if not exists idx_profiles_created_at
on public.profiles(created_at desc);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  role text not null
    check (role in ('admin')),
  permission_level text,
  permissions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(permissions) = 'array'),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_users_role_active
on public.admin_users(role, is_active);

create or replace function public.admin_role(target_user uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.admin_users
  where user_id = target_user
    and is_active = true
  limit 1;
$$;

create or replace function public.is_admin_user(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = target_user
      and is_active = true
  );
$$;

alter table public.diet_plans
  add column if not exists slug text unique
    check (slug is null or (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,96}$')),
  add column if not exists description text,
  add column if not exists goal_type text,
  add column if not exists calories_min integer,
  add column if not exists calories_max integer,
  add column if not exists duration_days integer,
  add column if not exists difficulty text,
  add column if not exists dietary_preference text,
  add column if not exists target_audience text,
  add column if not exists thumbnail_url text,
  add column if not exists cover_image_url text,
  add column if not exists pdf_url text,
  add column if not exists coach_tips text,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  add column if not exists tags text[] not null default '{}',
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists published_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_diet_plans_status_created_at
on public.diet_plans(status, created_at desc);

alter table public.diet_meals
  add column if not exists day_number integer not null default 1,
  add column if not exists meal_type text not null default 'meal',
  add column if not exists title text,
  add column if not exists food_items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(food_items) = 'array'),
  add column if not exists notes text,
  add column if not exists sort_order integer not null default 0;

create index if not exists idx_diet_meals_plan_day_sort
on public.diet_meals(diet_plan_id, day_number, sort_order);

alter table public.workout_plans
  add column if not exists slug text unique
    check (slug is null or (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,96}$')),
  add column if not exists goal_type text,
  add column if not exists level text,
  add column if not exists duration_weeks integer,
  add column if not exists thumbnail_url text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists published_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_workout_plans_status_created_at
on public.workout_plans(status, created_at desc);

create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workout_plans(id) on delete cascade,
  week_number integer not null default 1,
  day_number integer not null,
  title text not null,
  focus_area text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_id, week_number, day_number)
);

create index if not exists idx_workout_days_workout_sort
on public.workout_days(workout_id, week_number, day_number, sort_order);

alter table public.workout_exercises
  add column if not exists workout_day_id uuid references public.workout_days(id) on delete cascade,
  add column if not exists exercise_library_id uuid references public.workout_exercise_library(id) on delete set null,
  add column if not exists position integer not null default 0,
  add column if not exists duration_seconds integer,
  add column if not exists rest_seconds integer,
  add column if not exists media_url text,
  add column if not exists instructions text,
  add column if not exists cautions text,
  add column if not exists progression_notes text;

create index if not exists idx_workout_exercises_plan_position
on public.workout_exercises(workout_plan_id, position);

create table if not exists public.user_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  diet_plan_id uuid references public.diet_plans(id) on delete set null,
  workout_id uuid references public.workout_plans(id) on delete set null,
  assigned_by uuid references public.profiles(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'canceled')),
  notes text,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_assignments_user_status
on public.user_assignments(user_id, status);

create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
    check (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,64}$'),
  description text,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'INR',
  interval text not null default 'month'
    check (interval in ('month', 'year', 'quarter', 'lifetime')),
  trial_days integer not null default 0 check (trial_days >= 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pricing_plans_active
on public.pricing_plans(is_active, created_at desc);

alter table public.subscriptions
  add column if not exists provider text not null default 'razorpay',
  add column if not exists amount numeric(10, 2),
  add column if not exists currency text not null default 'INR';

create index if not exists idx_subscriptions_status_created
on public.subscriptions(status, created_at desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id uuid references public.pricing_plans(id) on delete set null,
  provider text not null default 'razorpay',
  provider_payment_id text,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'pending'
    check (status in ('pending', 'captured', 'failed', 'refunded', 'canceled')),
  invoice_url text,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_user_created_at
on public.payments(user_id, created_at desc);

create index if not exists idx_payments_status_paid_at
on public.payments(status, paid_at desc);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  max_redemptions integer,
  redeemed_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coupons_active_expiry
on public.coupons(is_active, expires_at);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  event_type text not null,
  provider text not null default 'razorpay',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_events_created_at
on public.billing_events(created_at desc);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in ('diet', 'workout', 'content', 'media', 'general')),
  name text not null,
  slug text not null unique
    check (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,96}$'),
  description text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_type_status
on public.categories(type, status);

create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_type text not null check (file_type in ('image', 'pdf', 'video', 'other')),
  mime_type text,
  storage_bucket text,
  storage_path text,
  url text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  width integer,
  height integer,
  tags text[] not null default '{}',
  status text not null default 'active'
    check (status in ('active', 'archived')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_media_files_type_created
on public.media_files(file_type, created_at desc);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique
    check (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,96}$'),
  excerpt text,
  body text not null,
  target_audience text not null default 'all',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_announcements_status_published_at
on public.announcements(status, published_at desc);

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_activity_logs_admin_created
on public.admin_activity_logs(admin_user_id, created_at desc);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

drop trigger if exists diet_plans_set_updated_at on public.diet_plans;
create trigger diet_plans_set_updated_at
before update on public.diet_plans
for each row
execute function public.set_updated_at();

drop trigger if exists workout_plans_set_updated_at on public.workout_plans;
create trigger workout_plans_set_updated_at
before update on public.workout_plans
for each row
execute function public.set_updated_at();

drop trigger if exists workout_days_set_updated_at on public.workout_days;
create trigger workout_days_set_updated_at
before update on public.workout_days
for each row
execute function public.set_updated_at();

drop trigger if exists user_assignments_set_updated_at on public.user_assignments;
create trigger user_assignments_set_updated_at
before update on public.user_assignments
for each row
execute function public.set_updated_at();

drop trigger if exists pricing_plans_set_updated_at on public.pricing_plans;
create trigger pricing_plans_set_updated_at
before update on public.pricing_plans
for each row
execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
before update on public.coupons
for each row
execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists media_files_set_updated_at on public.media_files;
create trigger media_files_set_updated_at
before update on public.media_files
for each row
execute function public.set_updated_at();

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row
execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.workout_days enable row level security;
alter table public.user_assignments enable row level security;
alter table public.pricing_plans enable row level security;
alter table public.payments enable row level security;
alter table public.coupons enable row level security;
alter table public.billing_events enable row level security;
alter table public.categories enable row level security;
alter table public.media_files enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_activity_logs enable row level security;

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles for select
to authenticated
using (public.is_admin_user(auth.uid()));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "subscriptions_select_admin" on public.subscriptions;
create policy "subscriptions_select_admin"
on public.subscriptions for select
to authenticated
using (public.is_admin_user(auth.uid()));

drop policy if exists "subscriptions_manage_admin" on public.subscriptions;
create policy "subscriptions_manage_admin"
on public.subscriptions for update
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "diet_plans_manage_admin" on public.diet_plans;
create policy "diet_plans_manage_admin"
on public.diet_plans for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "diet_meals_manage_admin" on public.diet_meals;
create policy "diet_meals_manage_admin"
on public.diet_meals for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "workout_plans_manage_admin" on public.workout_plans;
create policy "workout_plans_manage_admin"
on public.workout_plans for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "workout_exercises_manage_admin" on public.workout_exercises;
create policy "workout_exercises_manage_admin"
on public.workout_exercises for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "workout_days_manage_admin" on public.workout_days;
create policy "workout_days_manage_admin"
on public.workout_days for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "admin_users_select_admin" on public.admin_users;
create policy "admin_users_select_admin"
on public.admin_users for select
to authenticated
using (public.is_admin_user(auth.uid()));

drop policy if exists "admin_users_manage_admin" on public.admin_users;
create policy "admin_users_manage_admin"
on public.admin_users for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "user_assignments_manage_admin" on public.user_assignments;
create policy "user_assignments_manage_admin"
on public.user_assignments for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "pricing_plans_manage_admin" on public.pricing_plans;
create policy "pricing_plans_manage_admin"
on public.pricing_plans for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "payments_read_admin" on public.payments;
create policy "payments_read_admin"
on public.payments for select
to authenticated
using (public.is_admin_user(auth.uid()));

drop policy if exists "payments_manage_admin" on public.payments;
create policy "payments_manage_admin"
on public.payments for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "coupons_manage_admin" on public.coupons;
create policy "coupons_manage_admin"
on public.coupons for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "billing_events_read_admin" on public.billing_events;
create policy "billing_events_read_admin"
on public.billing_events for select
to authenticated
using (public.is_admin_user(auth.uid()));

drop policy if exists "categories_manage_admin" on public.categories;
create policy "categories_manage_admin"
on public.categories for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "media_files_manage_admin" on public.media_files;
create policy "media_files_manage_admin"
on public.media_files for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "announcements_manage_admin" on public.announcements;
create policy "announcements_manage_admin"
on public.announcements for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "announcements_read_published" on public.announcements;
create policy "announcements_read_published"
on public.announcements for select
to authenticated
using (status = 'published' or public.is_admin_user(auth.uid()));

drop policy if exists "admin_activity_logs_read_admin" on public.admin_activity_logs;
create policy "admin_activity_logs_read_admin"
on public.admin_activity_logs for select
to authenticated
using (public.is_admin_user(auth.uid()));

drop policy if exists "admin_activity_logs_insert_admin" on public.admin_activity_logs;
create policy "admin_activity_logs_insert_admin"
on public.admin_activity_logs for insert
to authenticated
with check (public.is_admin_user(auth.uid()));
