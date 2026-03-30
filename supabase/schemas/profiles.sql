create table public.profiles (
  id uuid not null,
  username text not null,
  full_name text null,
  avatar_url text null,
  age integer null,
  gender text null,
  height_cm numeric null,
  weight_kg numeric null,
  goal text null,
  diet_type text null,
  activity_level text null,
  injury_notes text null,
  onboarding_completed boolean null default false,
  referral_code text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  account_status text not null default 'active'::text,
  country text null,
  tags text[] not null default '{}'::text[],
  last_active_at timestamp with time zone null,
  constraint profiles_pkey primary key (id),
  constraint profiles_referral_code_key unique (referral_code),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_username_check check (
    (
      (username = lower(username))
      and (username ~ '^[a-z0-9_]{3,20}$'::text)
    )
  ),
  constraint profiles_account_status_check check (
    (
      account_status = any (
        array[
          'active'::text,
          'suspended'::text,
          'invited'::text
        ]
      )
    )
  ),
  constraint profiles_weight_kg_check check (
    (
      (weight_kg is null)
      or (weight_kg > (0)::numeric)
    )
  ),
  constraint profiles_age_check check (
    (
      (age is null)
      or (
        (age >= 13)
        and (age <= 100)
      )
    )
  ),
  constraint profiles_height_cm_check check (
    (
      (height_cm is null)
      or (height_cm > (0)::numeric)
    )
  ),
  constraint profiles_referral_code_check check (
    (
      (referral_code is null)
      or (
        (referral_code = lower(referral_code))
        and (referral_code ~ '^[a-z0-9_]{4,32}$'::text)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_profiles_account_status on public.profiles using btree (account_status) TABLESPACE pg_default;

create index IF not exists idx_profiles_created_at on public.profiles using btree (created_at desc) TABLESPACE pg_default;

create trigger profiles_set_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION set_updated_at ();