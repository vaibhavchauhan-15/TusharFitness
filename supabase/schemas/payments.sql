create table public.payments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  subscription_id uuid null,
  plan_id uuid null,
  provider text not null default 'razorpay'::text,
  provider_payment_id text null,
  amount numeric(10, 2) not null,
  currency text not null default 'INR'::text,
  status text not null default 'pending'::text,
  invoice_url text null,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint payments_pkey primary key (id),
  constraint payments_plan_id_fkey foreign KEY (plan_id) references pricing_plans (id) on delete set null,
  constraint payments_subscription_id_fkey foreign KEY (subscription_id) references subscriptions (id) on delete set null,
  constraint payments_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint payments_amount_check check ((amount >= (0)::numeric)),
  constraint payments_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'captured'::text,
          'failed'::text,
          'refunded'::text,
          'canceled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payments_user_created_at on public.payments using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_payments_status_paid_at on public.payments using btree (status, paid_at desc) TABLESPACE pg_default;

create trigger payments_set_updated_at BEFORE
update on payments for EACH row
execute FUNCTION set_updated_at ();