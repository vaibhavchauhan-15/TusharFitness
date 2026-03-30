create table public.billing_events (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  subscription_id uuid null,
  payment_id uuid null,
  event_type text not null,
  provider text not null default 'razorpay'::text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint billing_events_pkey primary key (id),
  constraint billing_events_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete set null,
  constraint billing_events_subscription_id_fkey foreign KEY (subscription_id) references subscriptions (id) on delete set null,
  constraint billing_events_user_id_fkey foreign KEY (user_id) references profiles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_billing_events_created_at on public.billing_events using btree (created_at desc) TABLESPACE pg_default;