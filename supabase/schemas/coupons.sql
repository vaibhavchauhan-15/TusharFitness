create table public.coupons (
  id uuid not null default gen_random_uuid (),
  code text not null,
  description text null,
  discount_type text not null,
  discount_value numeric(10, 2) not null,
  max_redemptions integer null,
  redeemed_count integer not null default 0,
  starts_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  is_active boolean not null default true,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint coupons_pkey primary key (id),
  constraint coupons_code_key unique (code),
  constraint coupons_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint coupons_code_check check ((code = upper(code))),
  constraint coupons_discount_type_check check (
    (
      discount_type = any (array['percent'::text, 'fixed'::text])
    )
  ),
  constraint coupons_discount_value_check check ((discount_value > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_coupons_active_expiry on public.coupons using btree (is_active, expires_at) TABLESPACE pg_default;

create trigger coupons_set_updated_at BEFORE
update on coupons for EACH row
execute FUNCTION set_updated_at ();