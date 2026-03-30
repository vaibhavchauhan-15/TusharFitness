-- Make workout_exercises the single source of truth for the workout catalog.
-- Goals and body parts are handled in app constants (hardcoded taxonomy),
-- so database taxonomy lookup tables are removed.

-- 1) Normalize and backfill exercise slugs.
with normalized as (
  select
    ex.id,
    left(
      regexp_replace(
        trim(both '-' from coalesce(ex.slug, lower(regexp_replace(ex.name, '[^a-z0-9]+', '-', 'g'))))
          || '-' || substr(ex.id::text, 1, 8),
        '-{2,}',
        '-',
        'g'
      ),
      96
    ) as resolved_slug
  from public.workout_exercises as ex
  where ex.slug is null
     or trim(ex.slug) = ''
)
update public.workout_exercises as ex
set slug = normalized.resolved_slug
from normalized
where ex.id = normalized.id;

-- 2) Backfill goal_slug/body_part_slug directly on workout_exercises.
with normalized as (
  select
    ex.id,
    nullif(lower(regexp_replace(coalesce(ex.goal_slug, wp.goal_type, wp.goal, ''), '[^a-z0-9]+', '-', 'g')), '') as raw_goal_slug,
    nullif(lower(regexp_replace(coalesce(ex.body_part_slug, wp.body_part, ''), '[^a-z0-9]+', '-', 'g')), '') as raw_body_part_slug
  from public.workout_exercises as ex
  left join public.workout_plans as wp
    on wp.id = ex.workout_plan_id
), mapped as (
  select
    id,
    case
      when raw_goal_slug in ('fat-loss', 'fat-losses') then 'fat-loss'
      when raw_goal_slug in ('muscle-gain', 'muscle-gains') then 'muscle-gain'
      when raw_goal_slug in ('general-fitness', 'maintenance') then 'muscle-gain'
      when raw_goal_slug in ('strength', 'endurance') then raw_goal_slug
      else 'muscle-gain'
    end as resolved_goal_slug,
    case
      when raw_body_part_slug in ('full-body', 'fullbody') then 'core'
      when raw_body_part_slug in ('upper-body', 'upperbody') then 'chest'
      when raw_body_part_slug in ('lower-body', 'lowerbody') then 'legs'
      when raw_body_part_slug = 'arm' then 'arms'
      when raw_body_part_slug in (
        'abs',
        'arms',
        'biceps',
        'triceps',
        'chest',
        'back',
        'legs',
        'shoulders',
        'core'
      ) then raw_body_part_slug
      when raw_body_part_slug in (
        'thighs',
        'glutes'
      ) then raw_body_part_slug
      when raw_body_part_slug = 'thigh' then 'thighs'
      when raw_body_part_slug = 'hip' then 'hips'
      when raw_body_part_slug = 'hips' then 'hips'
      else 'core'
    end as resolved_body_part_slug
  from normalized
)
update public.workout_exercises as ex
set
  goal_slug = mapped.resolved_goal_slug,
  body_part_slug = mapped.resolved_body_part_slug
from mapped
where ex.id = mapped.id
  and (
    ex.goal_slug is distinct from mapped.resolved_goal_slug
    or ex.body_part_slug is distinct from mapped.resolved_body_part_slug
  );

-- 3) Remove FK dependencies on taxonomy/library tables.
alter table public.workout_exercises
  drop constraint if exists workout_exercises_goal_slug_fkey,
  drop constraint if exists workout_exercises_body_part_slug_fkey,
  drop constraint if exists workout_exercises_exercise_library_id_fkey;

-- 4) Enforce standalone catalog constraints on workout_exercises.
alter table public.workout_exercises
  alter column slug set not null,
  alter column goal_slug set not null,
  alter column body_part_slug set not null;

alter table public.workout_exercises
  drop constraint if exists workout_exercises_slug_format_check,
  add constraint workout_exercises_slug_format_check
    check (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,96}$'),
  add constraint workout_exercises_goal_slug_check
    check (goal_slug in ('muscle-gain', 'fat-loss', 'strength', 'endurance')),
  add constraint workout_exercises_body_part_slug_check
    check (
      body_part_slug in (
        'abs',
        'arms',
        'biceps',
        'triceps',
        'chest',
        'back',
        'legs',
        'shoulders',
        'core',
        'thighs',
        'hips',
        'glutes'
      )
    );

-- exercise_library_id is no longer needed after removing workout_exercise_library.
alter table public.workout_exercises
  drop column if exists exercise_library_id;

-- Replace partial unique index with full unique index because slug is now required.
drop index if exists public.idx_workout_exercises_slug_unique;
create unique index if not exists idx_workout_exercises_slug_unique
on public.workout_exercises(slug);

-- Keep fast goal/body-part filtering for catalog pages.
drop index if exists public.idx_workout_exercises_catalog_filters;
create index if not exists idx_workout_exercises_catalog_filters
on public.workout_exercises(goal_slug, body_part_slug, sort_order, name);

-- 5) Remove no-longer-used taxonomy/library tables.
drop table if exists public.workout_exercise_library cascade;
drop table if exists public.workout_body_parts cascade;
drop table if exists public.workout_goals cascade;
