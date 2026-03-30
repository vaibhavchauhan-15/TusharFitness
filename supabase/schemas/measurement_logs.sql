create table public.measurement_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  label text not null,
  value numeric not null,
  logged_at timestamp with time zone null default now(),
  constraint measurement_logs_pkey primary key (id),
  constraint measurement_logs_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint measurement_logs_value_check check ((value > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_measurement_logs_user_logged_at on public.measurement_logs using btree (user_id, logged_at desc) TABLESPACE pg_default;