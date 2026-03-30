create table public.subscriptions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  plan_name text not null,
  status text not null default 'trialing'::text,
  razorpay_customer_id text null,
  razorpay_subscription_id text null,
  trial_start_at timestamp with time zone null,
  trial_end_at timestamp with time zone null,
  current_period_start timestamp with time zone null,
  current_period_end timestamp with time zone null,
  ended_at timestamp with time zone null,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  provider text not null default 'razorpay'::text,
  amount numeric(10, 2) null,
  currency text not null default 'INR'::text,
  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint subscriptions_status_check check (
    (
      status = any (
        array[
          'trialing'::text,
          'active'::text,
          'past_due'::text,
          'canceled'::text,
          'expired'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists subscriptions_user_id_active_unique on public.subscriptions using btree (user_id) TABLESPACE pg_default
where
  (
    status = any (array['active'::text, 'trialing'::text])
  );

create index IF not exists idx_subscriptions_status_created on public.subscriptions using btree (status, created_at desc) TABLESPACE pg_default;

create trigger subscriptions_set_updated_at BEFORE
update on subscriptions for EACH row
execute FUNCTION set_updated_at ();