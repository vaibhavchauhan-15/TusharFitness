create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null
    check (username = lower(username) and username ~ '^[a-z0-9_]{3,20}$'),
  full_name text,
  avatar_url text,
  age integer
    check (age is null or age between 13 and 100),
  gender text,
  height_cm numeric
    check (height_cm is null or height_cm > 0),
  weight_kg numeric
    check (weight_kg is null or weight_kg > 0),
  goal text,
  diet_type text,
  activity_level text,
  injury_notes text,
  onboarding_completed boolean default false,
  referral_code text unique
    check (referral_code is null or (referral_code = lower(referral_code) and referral_code ~ '^[a-z0-9_]{4,32}$')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme_preference text not null default 'system'
    check (theme_preference in ('light', 'dark', 'system')),
  workout_reminders boolean not null default true,
  meal_reminders boolean not null default true,
  referral_updates boolean not null default true,
  streak_rescue_nudges boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text not null,
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  razorpay_customer_id text,
  razorpay_subscription_id text,
  trial_start_at timestamptz,
  trial_end_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  ended_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists subscriptions_user_id_active_unique
on public.subscriptions(user_id)
where status in ('active', 'trialing');

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_user_id uuid references public.profiles(id) on delete cascade,
  referral_code text not null
    check (referral_code = lower(referral_code) and referral_code ~ '^[a-z0-9_]{4,32}$'),
  reward_status text not null default 'pending'
    check (reward_status in ('pending', 'eligible', 'rewarded', 'rejected')),
  awarded_trial_days integer not null default 3
    check (awarded_trial_days >= 0),
  awarded_xp integer not null default 60
    check (awarded_xp >= 0),
  eligible_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists referrals_invited_user_unique
on public.referrals(invited_user_id)
where invited_user_id is not null;

create index if not exists idx_referrals_inviter_created_at
on public.referrals(inviter_user_id, created_at desc);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  goal text not null,
  body_part text not null,
  duration text,
  difficulty text,
  description text
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  name text not null,
  motion text,
  form_cue text,
  sets text,
  reps text
);

create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  calories integer,
  protein integer,
  carbs integer,
  fats integer
);

create table if not exists public.diet_meals (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans(id) on delete cascade,
  meal_name text not null,
  meal_time text,
  items jsonb default '[]'::jsonb
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  value_kg numeric not null check (value_kg > 0),
  logged_at timestamptz default now()
);

create index if not exists idx_weight_logs_user_logged_at
on public.weight_logs(user_id, logged_at desc);

create table if not exists public.measurement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  value numeric not null check (value > 0),
  logged_at timestamptz default now()
);

create index if not exists idx_measurement_logs_user_logged_at
on public.measurement_logs(user_id, logged_at desc);

create table if not exists public.strength_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lift text not null,
  value_kg numeric not null check (value_kg > 0),
  logged_at timestamptz default now()
);

create index if not exists idx_strength_logs_user_logged_at
on public.strength_logs(user_id, logged_at desc);

create table if not exists public.gamification_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  streak integer not null default 0 check (streak >= 0),
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  badge text not null default 'Spark',
  title text not null default 'Beginner',
  last_login_at timestamptz
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null
    check (event_type in ('login', 'workout_completed', 'diet_completed', 'profile_completed', 'referral_reward')),
  xp_delta integer not null,
  event_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_xp_events_user_created_at
on public.xp_events(user_id, created_at desc);

create index if not exists idx_xp_events_user_event_date
on public.xp_events(user_id, event_date desc);

create unique index if not exists xp_events_unique_daily
on public.xp_events(user_id, event_type, event_date)
where event_date is not null;

create table if not exists public.workout_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  completed_at timestamptz default now()
);

create or replace function public.utc_date(ts timestamptz)
returns date
language sql
immutable
as $$
  select (ts at time zone 'UTC')::date;
$$;

create index if not exists idx_workout_completions_user_completed_at
on public.workout_completions(user_id, completed_at desc);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workout_completions'
      and column_name = 'workout_plan_id'
  ) then
    execute $sql$
      create unique index if not exists workout_once_per_day
      on public.workout_completions(user_id, workout_plan_id, (public.utc_date(completed_at)))
    $sql$;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workout_completions'
      and column_name = 'workout_exercise_id'
  ) then
    execute $sql$
      create unique index if not exists workout_once_per_day
      on public.workout_completions(user_id, workout_exercise_id, (public.utc_date(completed_at)))
    $sql$;
  end if;
end $$;

create table if not exists public.diet_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  diet_plan_id uuid not null references public.diet_plans(id) on delete cascade,
  completed_at timestamptz default now()
);

create index if not exists idx_diet_completions_user_completed_at
on public.diet_completions(user_id, completed_at desc);

create unique index if not exists diet_once_per_day
on public.diet_completions(user_id, diet_plan_id, (public.utc_date(completed_at)));

create table if not exists public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

create index if not exists idx_ai_chat_sessions_user_created_at
on public.ai_chat_sessions(user_id, created_at desc);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_ai_chat_messages_session_created_at
on public.ai_chat_messages(session_id, created_at asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists referrals_set_updated_at on public.referrals;
create trigger referrals_set_updated_at
before update on public.referrals
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.subscriptions enable row level security;
alter table public.referrals enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.diet_plans enable row level security;
alter table public.diet_meals enable row level security;
alter table public.weight_logs enable row level security;
alter table public.measurement_logs enable row level security;
alter table public.strength_logs enable row level security;
alter table public.gamification_state enable row level security;
alter table public.xp_events enable row level security;
alter table public.workout_completions enable row level security;
alter table public.diet_completions enable row level security;
alter table public.ai_chat_sessions enable row level security;
alter table public.ai_chat_messages enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "user_preferences_manage_own" on public.user_preferences;
create policy "user_preferences_manage_own"
on public.user_preferences for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "referrals_select_related" on public.referrals;
create policy "referrals_select_related"
on public.referrals for select
to authenticated
using (auth.uid() = inviter_user_id or auth.uid() = invited_user_id);

drop policy if exists "workout_plans_read_authenticated" on public.workout_plans;
create policy "workout_plans_read_authenticated"
on public.workout_plans for select
to authenticated
using (true);

drop policy if exists "workout_exercises_read_authenticated" on public.workout_exercises;
create policy "workout_exercises_read_authenticated"
on public.workout_exercises for select
to authenticated
using (true);

drop policy if exists "diet_plans_read_authenticated" on public.diet_plans;
create policy "diet_plans_read_authenticated"
on public.diet_plans for select
to authenticated
using (true);

drop policy if exists "diet_meals_read_authenticated" on public.diet_meals;
create policy "diet_meals_read_authenticated"
on public.diet_meals for select
to authenticated
using (true);

drop policy if exists "weight_logs_manage_own" on public.weight_logs;
create policy "weight_logs_manage_own"
on public.weight_logs for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "measurement_logs_manage_own" on public.measurement_logs;
create policy "measurement_logs_manage_own"
on public.measurement_logs for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "strength_logs_manage_own" on public.strength_logs;
create policy "strength_logs_manage_own"
on public.strength_logs for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "gamification_state_select_own" on public.gamification_state;
create policy "gamification_state_select_own"
on public.gamification_state for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "xp_events_select_own" on public.xp_events;
create policy "xp_events_select_own"
on public.xp_events for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "workout_completions_manage_own" on public.workout_completions;
create policy "workout_completions_manage_own"
on public.workout_completions for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diet_completions_manage_own" on public.diet_completions;
create policy "diet_completions_manage_own"
on public.diet_completions for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_chat_sessions_manage_own" on public.ai_chat_sessions;
create policy "ai_chat_sessions_manage_own"
on public.ai_chat_sessions for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_chat_messages_manage_related_session" on public.ai_chat_messages;
create policy "ai_chat_messages_manage_related_session"
on public.ai_chat_messages for all
to authenticated
using (
  exists (
    select 1
    from public.ai_chat_sessions sessions
    where sessions.id = session_id
      and sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.ai_chat_sessions sessions
    where sessions.id = session_id
      and sessions.user_id = auth.uid()
  )
);
