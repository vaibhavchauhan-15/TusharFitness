create table public.workout_days (
  id uuid not null default gen_random_uuid (),
  workout_exercise_id uuid not null,
  week_number integer not null default 1,
  day_number integer not null,
  title text not null,
  focus_area text null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint workout_days_pkey primary key (id),
  constraint workout_days_workout_exercise_id_week_number_day_number_key unique (workout_exercise_id, week_number, day_number),
  constraint workout_days_workout_exercise_id_fkey foreign KEY (workout_exercise_id) references workout_exercises (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_workout_days_workout_sort on public.workout_days using btree (workout_exercise_id, week_number, day_number, sort_order) TABLESPACE pg_default;

create trigger workout_days_set_updated_at BEFORE
update on workout_days for EACH row
execute FUNCTION set_updated_at ();