create table public.strength_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  lift text not null,
  value_kg numeric not null,
  logged_at timestamp with time zone null default now(),
  constraint strength_logs_pkey primary key (id),
  constraint strength_logs_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint strength_logs_value_kg_check check ((value_kg > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_strength_logs_user_logged_at on public.strength_logs using btree (user_id, logged_at desc) TABLESPACE pg_default;