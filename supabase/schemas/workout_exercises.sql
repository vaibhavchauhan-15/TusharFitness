create table public.workout_exercises (
  id uuid not null default gen_random_uuid (),
  sets text not null,
  reps text not null,
  rest_seconds integer null,
  goal text not null,
  body_part_slug text not null,
  thumbnail_url text null,
  target_muscle text not null,
  equipment text not null,
  difficulty text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  instruction_steps jsonb not null default '[]'::jsonb,
  form_cues jsonb not null default '[]'::jsonb,
  common_mistakes jsonb not null default '[]'::jsonb,
  title text not null,
  video_path text null,
  constraint workout_exercises_pkey primary key (id),
  constraint workout_exercises_common_mistakes_check check ((jsonb_typeof(common_mistakes) = 'array'::text)),
  constraint workout_exercises_form_cues_check check ((jsonb_typeof(form_cues) = 'array'::text)),
  constraint workout_exercises_goal_check check (
    (
      goal = any (
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
  constraint workout_exercises_rest_seconds_non_negative_check check (
    (
      (rest_seconds is null)
      or (rest_seconds >= 0)
    )
  ),
  constraint workout_exercises_thumbnail_url_check check (
    (
      (thumbnail_url is null)
      or (thumbnail_url ~ '^(https?://|/).+'::text)
    )
  ),
  constraint workout_exercises_title_presence_check check (
    (
      length(
        TRIM(
          both
          from
            title
        )
      ) > 0
    )
  ),
  constraint workout_exercises_body_part_slug_check check (
    (
      body_part_slug = any (
        array[
          'abs'::text,
          'arms'::text,
          'forearms'::text,
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
  constraint workout_exercises_video_path_check check (
    (
      (video_path is null)
      or (video_path ~ '^[a-zA-Z0-9][a-zA-Z0-9/_\.-]*$'::text)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_workout_exercises_catalog_filters on public.workout_exercises using btree (goal, body_part_slug, title) TABLESPACE pg_default;

create trigger workout_exercises_set_updated_at BEFORE
update on workout_exercises for EACH row
execute FUNCTION set_updated_at ();