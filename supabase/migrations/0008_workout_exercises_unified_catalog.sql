-- Unify workout catalog + exercise details into public.workout_exercises.
-- This migration keeps workout program compatibility while enabling catalog/detail pages
-- to read from one table.

alter table public.workout_exercises
  alter column workout_plan_id drop not null;

alter table public.workout_exercises
  add column if not exists slug text,
  add column if not exists goal_slug text references public.workout_goals(slug) on delete set null,
  add column if not exists body_part_slug text references public.workout_body_parts(slug) on delete set null,
  add column if not exists thumbnail_url text,
  add column if not exists target_muscle text,
  add column if not exists equipment text,
  add column if not exists difficulty text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists sort_order integer not null default 0,
  add column if not exists instruction_steps jsonb not null default '[]'::jsonb,
  add column if not exists form_cues jsonb not null default '[]'::jsonb,
  add column if not exists common_mistakes jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_exercises_slug_format_check'
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_slug_format_check
      check (slug is null or (slug = lower(slug) and slug ~ '^[a-z0-9-]{2,96}$'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_exercises_thumbnail_url_check'
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_thumbnail_url_check
      check (thumbnail_url is null or thumbnail_url ~ '^(https?://|/).+');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_exercises_instruction_steps_check'
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_instruction_steps_check
      check (jsonb_typeof(instruction_steps) = 'array');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_exercises_form_cues_check'
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_form_cues_check
      check (jsonb_typeof(form_cues) = 'array');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_exercises_common_mistakes_check'
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_common_mistakes_check
      check (jsonb_typeof(common_mistakes) = 'array');
  end if;
end $$;

create unique index if not exists idx_workout_exercises_slug_unique
on public.workout_exercises(slug)
where slug is not null;

create index if not exists idx_workout_exercises_catalog_filters
on public.workout_exercises(goal_slug, body_part_slug, sort_order, name)
where goal_slug is not null and body_part_slug is not null;

-- Backfill from the old catalog table when present.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'workout_exercise_library'
  ) then
    insert into public.workout_exercises (
      slug,
      goal_slug,
      body_part_slug,
      name,
      thumbnail_url,
      media_url,
      target_muscle,
      equipment,
      sets,
      reps,
      instruction_steps,
      form_cues,
      sort_order,
      position,
      form_cue
    )
    select
      lib.slug,
      lib.goal_slug,
      lib.body_part_slug,
      lib.name,
      lib.image_url,
      lib.video_url,
      lib.target_muscle,
      lib.equipment,
      lib.sets,
      lib.reps,
      case
        when jsonb_typeof(lib.instructions) = 'array' then lib.instructions
        else '[]'::jsonb
      end,
      case
        when jsonb_typeof(lib.form_tips) = 'array' then lib.form_tips
        else '[]'::jsonb
      end,
      coalesce(lib.sort_order, 0),
      coalesce(lib.sort_order, 0),
      nullif(trim(coalesce(lib.form_tips ->> 0, '')), '')
    from public.workout_exercise_library as lib
    on conflict (slug) where slug is not null do update
      set
        goal_slug = excluded.goal_slug,
        body_part_slug = excluded.body_part_slug,
        name = excluded.name,
        thumbnail_url = excluded.thumbnail_url,
        media_url = coalesce(excluded.media_url, public.workout_exercises.media_url),
        target_muscle = excluded.target_muscle,
        equipment = excluded.equipment,
        sets = excluded.sets,
        reps = excluded.reps,
        instruction_steps = excluded.instruction_steps,
        form_cues = excluded.form_cues,
        sort_order = excluded.sort_order,
        position = excluded.position,
        form_cue = coalesce(excluded.form_cue, public.workout_exercises.form_cue);
  end if;
end $$;

-- Backfill new structured fields from legacy text fields when needed.
update public.workout_exercises
set instruction_steps = coalesce(
  (
    select jsonb_agg(step)
    from (
      select trim(value) as step
      from regexp_split_to_table(coalesce(instructions, ''), E'\\r?\\n+') as value
      where trim(value) <> ''
    ) as parsed
  ),
  '[]'::jsonb
)
where jsonb_array_length(instruction_steps) = 0
  and coalesce(trim(instructions), '') <> '';

update public.workout_exercises
set form_cues = coalesce(
  (
    select jsonb_agg(cue)
    from (
      select trim(value) as cue
      from regexp_split_to_table(coalesce(form_cue, ''), E'\\r?\\n+') as value
      where trim(value) <> ''
    ) as parsed
  ),
  '[]'::jsonb
)
where jsonb_array_length(form_cues) = 0
  and coalesce(trim(form_cue), '') <> '';

update public.workout_exercises
set common_mistakes = coalesce(
  (
    select jsonb_agg(mistake)
    from (
      select trim(value) as mistake
      from regexp_split_to_table(coalesce(cautions, ''), E'\\r?\\n+') as value
      where trim(value) <> ''
    ) as parsed
  ),
  '[]'::jsonb
)
where jsonb_array_length(common_mistakes) = 0
  and coalesce(trim(cautions), '') <> '';

update public.workout_exercises
set thumbnail_url = '/images/workouts/exercises/default.svg'
where thumbnail_url is null
  or trim(thumbnail_url) = '';

drop trigger if exists workout_exercises_set_updated_at on public.workout_exercises;
create trigger workout_exercises_set_updated_at
before update on public.workout_exercises
for each row
execute function public.set_updated_at();
