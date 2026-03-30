create table public.admin_users (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  role text not null,
  permission_level text null,
  permissions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint admin_users_pkey primary key (id),
  constraint admin_users_user_id_key unique (user_id),
  constraint admin_users_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint admin_users_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint admin_users_permissions_check check ((jsonb_typeof(permissions) = 'array'::text)),
  constraint admin_users_role_check check ((role = 'admin'::text))
) TABLESPACE pg_default;

create index IF not exists idx_admin_users_role_active on public.admin_users using btree (role, is_active) TABLESPACE pg_default;

create trigger admin_users_set_updated_at BEFORE
update on admin_users for EACH row
execute FUNCTION set_updated_at ();