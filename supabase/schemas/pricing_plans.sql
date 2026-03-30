create table public.pricing_plans (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  description text null,
  price numeric(10, 2) not null,
  currency text not null default 'INR'::text,
  interval text not null default 'month'::text,
  trial_days integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint pricing_plans_pkey primary key (id),
  constraint pricing_plans_slug_key unique (slug),
  constraint pricing_plans_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint pricing_plans_trial_days_check check ((trial_days >= 0)),
  constraint pricing_plans_price_check check ((price >= (0)::numeric)),
  constraint pricing_plans_interval_check check (
    (
      "interval" = any (
        array[
          'month'::text,
          'year'::text,
          'quarter'::text,
          'lifetime'::text
        ]
      )
    )
  ),
  constraint pricing_plans_slug_check check (
    (
      (slug = lower(slug))
      and (slug ~ '^[a-z0-9-]{2,64}$'::text)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_pricing_plans_active on public.pricing_plans using btree (is_active, created_at desc) TABLESPACE pg_default;

create trigger pricing_plans_set_updated_at BEFORE
update on pricing_plans for EACH row
execute FUNCTION set_updated_at ();