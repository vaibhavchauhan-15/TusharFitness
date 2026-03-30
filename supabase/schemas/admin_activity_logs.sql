create table public.admin_activity_logs (
  id uuid not null default gen_random_uuid (),
  admin_user_id uuid null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint admin_activity_logs_pkey primary key (id),
  constraint admin_activity_logs_admin_user_id_fkey foreign KEY (admin_user_id) references profiles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_admin_activity_logs_admin_created on public.admin_activity_logs using btree (admin_user_id, created_at desc) TABLESPACE pg_default;