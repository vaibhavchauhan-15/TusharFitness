-- Migrate workout domain from workout_plans to workout_exercises-only model.
-- This keeps completion/assignment tracking consistent with the new schema.

-- 1) Ensure canonical workout_exercises columns exist.
alter table public.workout_exercises
  add column if not exists title text,
  add column if not exists goal text,
  add column if not exists body_part_slug text,
  add column if not exists thumbnail_url text,
  add column if not exists target_muscle text,
  add column if not exists equipment text,
  add column if not exists difficulty text,
  add column if not exists rest_seconds integer,
  add column if not exists instruction_steps jsonb default '[]'::jsonb,
  add column if not exists form_cues jsonb default '[]'::jsonb,
  add column if not exists common_mistakes jsonb default '[]'::jsonb,
  add column if not exists video_url text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- 2) Fill title from legacy name column when needed.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workout_exercises'
      and column_name = 'name'
  ) then
    execute $sql$
      update public.workout_exercises
      set title = coalesce(nullif(trim(title), ''), nullif(trim(name), ''), 'Exercise ' || left(id::text, 8))
      where title is null
         or trim(title) = ''
    $sql$;
  else
    update public.workout_exercises
    set title = coalesce(nullif(trim(title), ''), 'Exercise ' || left(id::text, 8))
    where title is null
       or trim(title) = '';
  end if;
end $$;

-- 3) Backfill goal/body_part from workout_plans when legacy relation exists.
do $$
begin
  if to_regclass('public.workout_plans') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'workout_exercises'
         and column_name = 'workout_plan_id'
     ) then
    execute $sql$
      update public.workout_exercises ex
      set
        goal = case
          when lower(coalesce(wp.goal, '')) in ('muscle gain', 'muscle-gain', 'maintenance', 'general fitness', 'general-fitness') then 'muscle-gain'
          when lower(coalesce(wp.goal, '')) in ('fat loss', 'fat-loss') then 'fat-loss'
          when lower(coalesce(wp.goal, '')) = 'strength' then 'strength'
          when lower(coalesce(wp.goal, '')) = 'endurance' then 'endurance'
          else coalesce(ex.goal, 'muscle-gain')
        end,
        body_part_slug = case
          when lower(coalesce(wp.body_part, '')) in ('abs', 'arms', 'biceps', 'triceps', 'chest', 'back', 'legs', 'shoulders', 'core', 'thighs', 'hips', 'glutes')
            then lower(wp.body_part)
          when lower(coalesce(wp.body_part, '')) in ('full body', 'full-body') then 'core'
          when lower(coalesce(wp.body_part, '')) in ('upper body', 'upper-body') then 'chest'
          when lower(coalesce(wp.body_part, '')) in ('lower body', 'lower-body') then 'legs'
          else coalesce(ex.body_part_slug, 'core')
        end
      from public.workout_plans wp
      where ex.workout_plan_id = wp.id
        and (ex.goal is null or ex.body_part_slug is null)
    $sql$;
  end if;
end $$;

-- 4) Apply safe defaults for required fields before NOT NULL constraints.
update public.workout_exercises
set
  goal = coalesce(goal, 'muscle-gain'),
  body_part_slug = coalesce(body_part_slug, 'core'),
  target_muscle = coalesce(nullif(trim(target_muscle), ''), 'General'),
  equipment = coalesce(nullif(trim(equipment), ''), 'Bodyweight'),
  difficulty = coalesce(nullif(trim(difficulty), ''), 'moderate'),
  sets = coalesce(nullif(trim(sets), ''), '3'),
  reps = coalesce(nullif(trim(reps), ''), '10'),
  instruction_steps = coalesce(instruction_steps, '[]'::jsonb),
  form_cues = coalesce(form_cues, '[]'::jsonb),
  common_mistakes = coalesce(common_mistakes, '[]'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.workout_exercises
  alter column title set not null,
  alter column goal set not null,
  alter column body_part_slug set not null,
  alter column target_muscle set not null,
  alter column equipment set not null,
  alter column difficulty set not null,
  alter column sets set not null,
  alter column reps set not null,
  alter column instruction_steps set not null,
  alter column form_cues set not null,
  alter column common_mistakes set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'workout_exercises_goal_check') then
    alter table public.workout_exercises
      add constraint workout_exercises_goal_check
      check (goal in ('muscle-gain', 'fat-loss', 'strength', 'endurance'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workout_exercises_body_part_slug_check') then
    alter table public.workout_exercises
      add constraint workout_exercises_body_part_slug_check
      check (
        body_part_slug in (
          'abs', 'arms', 'biceps', 'triceps', 'chest', 'back',
          'legs', 'shoulders', 'core', 'thighs', 'hips', 'glutes'
        )
      );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workout_exercises_instruction_steps_check') then
    alter table public.workout_exercises
      add constraint workout_exercises_instruction_steps_check
      check (jsonb_typeof(instruction_steps) = 'array');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workout_exercises_form_cues_check') then
    alter table public.workout_exercises
      add constraint workout_exercises_form_cues_check
      check (jsonb_typeof(form_cues) = 'array');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workout_exercises_common_mistakes_check') then
    alter table public.workout_exercises
      add constraint workout_exercises_common_mistakes_check
      check (jsonb_typeof(common_mistakes) = 'array');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workout_exercises_rest_seconds_non_negative_check') then
    alter table public.workout_exercises
      add constraint workout_exercises_rest_seconds_non_negative_check
      check (rest_seconds is null or rest_seconds >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workout_exercises_title_presence_check') then
    alter table public.workout_exercises
      add constraint workout_exercises_title_presence_check
      check (length(trim(both from title)) > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workout_exercises_thumbnail_url_check') then
    alter table public.workout_exercises
      add constraint workout_exercises_thumbnail_url_check
      check (thumbnail_url is null or thumbnail_url ~ '^(https?://|/).+');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workout_exercises_video_url_check') then
    alter table public.workout_exercises
      add constraint workout_exercises_video_url_check
      check (video_url is null or video_url ~* '^https?://');
  end if;
end $$;

-- 5) Convert workout_completions from workout_plan_id to workout_exercise_id.
alter table public.workout_completions
  add column if not exists workout_exercise_id uuid;

do $$
declare
  unresolved_count bigint;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workout_completions'
      and column_name = 'workout_plan_id'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'workout_exercises'
        and column_name = 'workout_plan_id'
    ) then
      execute $sql$
        with mapped as (
          select distinct on (workout_plan_id)
            workout_plan_id,
            id as workout_exercise_id
          from public.workout_exercises
          where workout_plan_id is not null
          order by workout_plan_id, created_at nulls last, id
        )
        update public.workout_completions wc
        set workout_exercise_id = mapped.workout_exercise_id
        from mapped
        where wc.workout_exercise_id is null
          and wc.workout_plan_id = mapped.workout_plan_id
      $sql$;
    end if;

    update public.workout_completions wc
    set workout_exercise_id = we.id
    from public.workout_exercises we
    where wc.workout_exercise_id is null
      and wc.workout_plan_id = we.id;
  end if;

  select count(*) into unresolved_count
  from public.workout_completions
  where workout_exercise_id is null;

  if unresolved_count > 0 then
    raise exception 'Unable to map % workout_completions rows to workout_exercises. Backfill workout_exercise_id and rerun migration.', unresolved_count;
  end if;
end $$;

alter table public.workout_completions
  drop constraint if exists workout_completions_workout_plan_id_fkey,
  drop constraint if exists workout_completions_workout_exercise_id_fkey;

drop index if exists public.workout_once_per_day;

alter table public.workout_completions
  drop column if exists workout_plan_id;

alter table public.workout_completions
  alter column workout_exercise_id set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'workout_completions_workout_exercise_id_fkey') then
    alter table public.workout_completions
      add constraint workout_completions_workout_exercise_id_fkey
      foreign key (workout_exercise_id) references public.workout_exercises(id) on delete cascade;
  end if;
end $$;

create unique index if not exists workout_once_per_day
on public.workout_completions(user_id, workout_exercise_id, public.utc_date(completed_at));

-- 6) Convert user_assignments from workout_id to workout_exercise_id.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_assignments'
      and column_name = 'workout_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_assignments'
      and column_name = 'workout_exercise_id'
  ) then
    alter table public.user_assignments
      rename column workout_id to workout_exercise_id;
  end if;
end $$;

alter table public.user_assignments
  add column if not exists workout_exercise_id uuid;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workout_exercises'
      and column_name = 'workout_plan_id'
  ) then
    execute $sql$
      with mapped as (
        select distinct on (workout_plan_id)
          workout_plan_id,
          id as workout_exercise_id
        from public.workout_exercises
        where workout_plan_id is not null
        order by workout_plan_id, created_at nulls last, id
      )
      update public.user_assignments ua
      set workout_exercise_id = mapped.workout_exercise_id
      from mapped
      where ua.workout_exercise_id = mapped.workout_plan_id
    $sql$;
  end if;

  update public.user_assignments ua
  set workout_exercise_id = null
  where workout_exercise_id is not null
    and not exists (
      select 1
      from public.workout_exercises we
      where we.id = ua.workout_exercise_id
    );
end $$;

alter table public.user_assignments
  drop constraint if exists user_assignments_workout_id_fkey,
  drop constraint if exists user_assignments_workout_exercise_id_fkey;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_assignments_workout_exercise_id_fkey') then
    alter table public.user_assignments
      add constraint user_assignments_workout_exercise_id_fkey
      foreign key (workout_exercise_id) references public.workout_exercises(id) on delete set null;
  end if;
end $$;

-- 7) Convert workout_days relation to workout_exercises when the table exists.
create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  week_number integer not null default 1,
  day_number integer not null,
  title text not null,
  focus_area text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_exercise_id, week_number, day_number)
);

do $$
begin
  if to_regclass('public.workout_days') is not null then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'workout_days'
        and column_name = 'workout_id'
    ) and not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'workout_days'
        and column_name = 'workout_exercise_id'
    ) then
      alter table public.workout_days rename column workout_id to workout_exercise_id;
    end if;

    alter table public.workout_days
      add column if not exists workout_exercise_id uuid;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'workout_days'
        and column_name = 'workout_plan_id'
    ) then
      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'workout_exercises'
          and column_name = 'workout_plan_id'
      ) then
        execute $sql$
          with mapped as (
            select distinct on (workout_plan_id)
              workout_plan_id,
              id as workout_exercise_id
            from public.workout_exercises
            where workout_plan_id is not null
            order by workout_plan_id, created_at nulls last, id
          )
          update public.workout_days wd
          set workout_exercise_id = mapped.workout_exercise_id
          from mapped
          where wd.workout_exercise_id is null
            and wd.workout_plan_id = mapped.workout_plan_id
        $sql$;
      end if;

      execute $sql$
        update public.workout_days wd
        set workout_exercise_id = we.id
        from public.workout_exercises we
        where wd.workout_exercise_id is null
          and wd.workout_plan_id = we.id
      $sql$;
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'workout_days'
        and column_name = 'workout_id'
    ) then
      execute $sql$
        update public.workout_days wd
        set workout_exercise_id = we.id
        from public.workout_exercises we
        where wd.workout_exercise_id is null
          and wd.workout_id = we.id
      $sql$;
    end if;

    alter table public.workout_days
      drop constraint if exists workout_days_workout_id_fkey,
      drop constraint if exists workout_days_workout_exercise_id_fkey,
      drop constraint if exists workout_days_workout_id_week_number_day_number_key,
      drop constraint if exists workout_days_workout_exercise_id_week_number_day_number_key;

    delete from public.workout_days wd
    where wd.workout_exercise_id is null
       or not exists (
         select 1
         from public.workout_exercises we
         where we.id = wd.workout_exercise_id
       );

    alter table public.workout_days
      alter column workout_exercise_id set not null;

    if not exists (select 1 from pg_constraint where conname = 'workout_days_workout_exercise_id_fkey') then
      alter table public.workout_days
        add constraint workout_days_workout_exercise_id_fkey
        foreign key (workout_exercise_id) references public.workout_exercises(id) on delete cascade;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'workout_days_workout_exercise_id_week_number_day_number_key') then
      alter table public.workout_days
        add constraint workout_days_workout_exercise_id_week_number_day_number_key
        unique (workout_exercise_id, week_number, day_number);
    end if;

    drop index if exists public.idx_workout_days_workout_sort;

    create index if not exists idx_workout_days_workout_sort
    on public.workout_days (workout_exercise_id, week_number, day_number, sort_order);

    drop trigger if exists workout_days_set_updated_at on public.workout_days;
    create trigger workout_days_set_updated_at
    before update on public.workout_days
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- 8) Drop legacy workout_exercises columns once mappings are complete.
alter table public.workout_exercises
  drop column if exists workout_plan_id,
  drop column if exists name,
  drop column if exists motion,
  drop column if exists form_cue;

drop index if exists public.idx_workout_exercises_catalog_filters;
create index if not exists idx_workout_exercises_catalog_filters
on public.workout_exercises(goal, body_part_slug, title);

drop trigger if exists workout_exercises_set_updated_at on public.workout_exercises;
create trigger workout_exercises_set_updated_at
before update on public.workout_exercises
for each row
execute function public.set_updated_at();

-- 9) Remove workout_plans table and its policy leftovers.
-- Dropping with CASCADE removes dependent constraints/policies.
drop table if exists public.workout_plans cascade;
