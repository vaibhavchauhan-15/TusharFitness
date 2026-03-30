create table public.workout_exercises (
  id uuid not null default gen_random_uuid (),
  workout_plan_id uuid null,
  name text not null,
  motion text null,
  form_cue text null,
  sets text null,
  reps text null,
  workout_day_id uuid null,
  position integer not null default 0,
  duration_seconds integer null,
  rest_seconds integer null,
  media_url text null,
  instructions text null,
  cautions text null,
  progression_notes text null,
  slug text not null,
  goal_slug text not null,
  body_part_slug text not null,
  thumbnail_url text null,
  target_muscle text null,
  equipment text null,
  difficulty text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  sort_order integer not null default 0,
  instruction_steps jsonb not null default '[]'::jsonb,
  form_cues jsonb not null default '[]'::jsonb,
  common_mistakes jsonb not null default '[]'::jsonb,
  constraint workout_exercises_pkey primary key (id),
  constraint workout_exercises_workout_day_id_fkey foreign KEY (workout_day_id) references workout_days (id) on delete CASCADE,
  constraint workout_exercises_workout_plan_id_fkey foreign KEY (workout_plan_id) references workout_plans (id) on delete CASCADE,
  constraint workout_exercises_goal_slug_check check (
    (
      goal_slug = any (
        array[
          'muscle-gain'::text,
          'fat-loss'::text,
          'strength'::text,
          'endurance'::text
        ]
      )
    )
  ),
  constraint workout_exercises_instruction_steps_check check ((jsonb_typeof(instruction_steps) = 'array'::text)),
  constraint workout_exercises_body_part_slug_check check (
    (
      body_part_slug = any (
        array[
          'abs'::text,
          'arms'::text,
          'biceps'::text,
          'triceps'::text,
          'chest'::text,
          'back'::text,
          'legs'::text,
          'shoulders'::text,
          'core'::text,
          'thighs'::text,
          'hips'::text,
          'glutes'::text
        ]
      )
    )
  ),
  constraint workout_exercises_slug_format_check check (
    (
      (slug = lower(slug))
      and (slug ~ '^[a-z0-9-]{2,96}$'::text)
    )
  ),
  constraint workout_exercises_thumbnail_url_check check (
    (
      (thumbnail_url is null)
      or (thumbnail_url ~ '^(https?://|/).+'::text)
    )
  ),
  constraint workout_exercises_media_url_check check (
    (
      (media_url is null)
      or (media_url ~* '^https?://'::text)
    )
  ),
  constraint workout_exercises_common_mistakes_check check ((jsonb_typeof(common_mistakes) = 'array'::text)),
  constraint workout_exercises_form_cues_check check ((jsonb_typeof(form_cues) = 'array'::text))
) TABLESPACE pg_default;

create unique INDEX IF not exists idx_workout_exercises_slug_unique on public.workout_exercises using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_workout_exercises_catalog_filters on public.workout_exercises using btree (goal_slug, body_part_slug, sort_order, name) TABLESPACE pg_default;

create index IF not exists idx_workout_exercises_plan_position on public.workout_exercises using btree (workout_plan_id, "position") TABLESPACE pg_default;

create trigger workout_exercises_set_updated_at BEFORE
update on workout_exercises for EACH row
execute FUNCTION set_updated_at ();