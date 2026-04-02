create table public.user_assignments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  diet_plan_id uuid null,
  workout_exercise_id uuid null,
  assigned_by uuid null,
  status text not null default 'active'::text,
  notes text null,
  assigned_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_assignments_pkey primary key (id),
  constraint user_assignments_assigned_by_fkey foreign KEY (assigned_by) references profiles (id) on delete set null,
  constraint user_assignments_diet_plan_id_fkey foreign KEY (diet_plan_id) references diet_plans (id) on delete set null,
  constraint user_assignments_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint user_assignments_workout_exercise_id_fkey foreign KEY (workout_exercise_id) references workout_exercises (id) on delete set null,
  constraint user_assignments_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'paused'::text,
          'completed'::text,
          'canceled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_assignments_user_status on public.user_assignments using btree (user_id, status) TABLESPACE pg_default;

create trigger user_assignments_set_updated_at BEFORE
update on user_assignments for EACH row
execute FUNCTION set_updated_at ();