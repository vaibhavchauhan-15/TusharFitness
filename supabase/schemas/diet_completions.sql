create table public.diet_completions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  diet_plan_id uuid not null,
  completed_at timestamp with time zone null default now(),
  constraint diet_completions_pkey primary key (id),
  constraint diet_completions_diet_plan_id_fkey foreign KEY (diet_plan_id) references diet_plans (id) on delete CASCADE,
  constraint diet_completions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_diet_completions_user_completed_at on public.diet_completions using btree (user_id, completed_at desc) TABLESPACE pg_default;

create unique INDEX IF not exists diet_once_per_day on public.diet_completions using btree (user_id, diet_plan_id, utc_date (completed_at)) TABLESPACE pg_default;