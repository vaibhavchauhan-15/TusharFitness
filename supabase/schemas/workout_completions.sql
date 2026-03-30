create table public.workout_completions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  workout_plan_id uuid not null,
  completed_at timestamp with time zone null default now(),
  constraint workout_completions_pkey primary key (id),
  constraint workout_completions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint workout_completions_workout_plan_id_fkey foreign KEY (workout_plan_id) references workout_plans (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_workout_completions_user_completed_at on public.workout_completions using btree (user_id, completed_at desc) TABLESPACE pg_default;

create unique INDEX IF not exists workout_once_per_day on public.workout_completions using btree (user_id, workout_plan_id, utc_date (completed_at)) TABLESPACE pg_default;