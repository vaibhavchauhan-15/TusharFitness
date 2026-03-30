create table if not exists public.workout_goals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,64}$'),
  name text not null,
  subtitle text,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_body_parts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,64}$'),
  name text not null,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_exercise_library (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,96}$'),
  goal_slug text not null references public.workout_goals(slug) on delete cascade,
  body_part_slug text not null references public.workout_body_parts(slug) on delete cascade,
  name text not null,
  image_url text not null,
  muscle_highlight_image_url text not null,
  target_muscle text not null,
  equipment text not null,
  sets text not null,
  reps text not null,
  instructions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(instructions) = 'array'),
  form_tips jsonb not null default '[]'::jsonb
    check (jsonb_typeof(form_tips) = 'array'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure existing environments also get image URL columns when tables already existed.
alter table public.workout_goals
  add column if not exists image_url text;

alter table public.workout_body_parts
  add column if not exists image_url text;

alter table public.workout_exercise_library
  add column if not exists image_url text,
  add column if not exists muscle_highlight_image_url text;

update public.workout_goals
set image_url = '/images/workouts/goals/default.svg'
where image_url is null or image_url = '';

update public.workout_body_parts
set image_url = '/images/workouts/body-parts/default.svg'
where image_url is null or image_url = '';

update public.workout_exercise_library
set image_url = '/images/workouts/exercises/default.svg'
where image_url is null or image_url = '';

update public.workout_exercise_library
set muscle_highlight_image_url = '/images/workouts/muscles/default-highlight.svg'
where muscle_highlight_image_url is null or muscle_highlight_image_url = '';

alter table public.workout_goals
  alter column image_url set not null;

alter table public.workout_body_parts
  alter column image_url set not null;

alter table public.workout_exercise_library
  alter column image_url set not null,
  alter column muscle_highlight_image_url set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_goals_image_url_format_check'
  ) then
    alter table public.workout_goals
      add constraint workout_goals_image_url_format_check
      check (image_url ~ '^(https?://|/).+');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_body_parts_image_url_format_check'
  ) then
    alter table public.workout_body_parts
      add constraint workout_body_parts_image_url_format_check
      check (image_url ~ '^(https?://|/).+');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_exercise_library_image_url_format_check'
  ) then
    alter table public.workout_exercise_library
      add constraint workout_exercise_library_image_url_format_check
      check (image_url ~ '^(https?://|/).+');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_exercise_library_muscle_image_url_format_check'
  ) then
    alter table public.workout_exercise_library
      add constraint workout_exercise_library_muscle_image_url_format_check
      check (muscle_highlight_image_url ~ '^(https?://|/).+');
  end if;
end $$;

create index if not exists idx_workout_goals_sort_order
on public.workout_goals(sort_order, name);

create index if not exists idx_workout_body_parts_sort_order
on public.workout_body_parts(sort_order, name);

create index if not exists idx_workout_exercise_library_goal_body_sort
on public.workout_exercise_library(goal_slug, body_part_slug, sort_order, name);

create index if not exists idx_workout_exercise_library_goal
on public.workout_exercise_library(goal_slug);

create index if not exists idx_workout_exercise_library_body_part
on public.workout_exercise_library(body_part_slug);

alter table public.workout_goals enable row level security;
alter table public.workout_body_parts enable row level security;
alter table public.workout_exercise_library enable row level security;

drop policy if exists "workout_goals_read_authenticated" on public.workout_goals;
create policy "workout_goals_read_authenticated"
on public.workout_goals for select
to authenticated
using (true);

drop policy if exists "workout_body_parts_read_authenticated" on public.workout_body_parts;
create policy "workout_body_parts_read_authenticated"
on public.workout_body_parts for select
to authenticated
using (true);

drop policy if exists "workout_exercise_library_read_authenticated" on public.workout_exercise_library;
create policy "workout_exercise_library_read_authenticated"
on public.workout_exercise_library for select
to authenticated
using (true);

drop trigger if exists workout_goals_set_updated_at on public.workout_goals;
create trigger workout_goals_set_updated_at
before update on public.workout_goals
for each row
execute function public.set_updated_at();

drop trigger if exists workout_body_parts_set_updated_at on public.workout_body_parts;
create trigger workout_body_parts_set_updated_at
before update on public.workout_body_parts
for each row
execute function public.set_updated_at();

drop trigger if exists workout_exercise_library_set_updated_at on public.workout_exercise_library;
create trigger workout_exercise_library_set_updated_at
before update on public.workout_exercise_library
for each row
execute function public.set_updated_at();
