create table public.referrals (
  id uuid not null default gen_random_uuid (),
  inviter_user_id uuid not null,
  invited_user_id uuid null,
  referral_code text not null,
  reward_status text not null default 'pending'::text,
  awarded_trial_days integer not null default 3,
  awarded_xp integer not null default 60,
  eligible_at timestamp with time zone null,
  rewarded_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint referrals_pkey primary key (id),
  constraint referrals_invited_user_id_fkey foreign KEY (invited_user_id) references profiles (id) on delete CASCADE,
  constraint referrals_inviter_user_id_fkey foreign KEY (inviter_user_id) references profiles (id) on delete CASCADE,
  constraint referrals_awarded_trial_days_check check ((awarded_trial_days >= 0)),
  constraint referrals_awarded_xp_check check ((awarded_xp >= 0)),
  constraint referrals_referral_code_check check (
    (
      (referral_code = lower(referral_code))
      and (referral_code ~ '^[a-z0-9_]{4,32}$'::text)
    )
  ),
  constraint referrals_reward_status_check check (
    (
      reward_status = any (
        array[
          'pending'::text,
          'eligible'::text,
          'rewarded'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists referrals_invited_user_unique on public.referrals using btree (invited_user_id) TABLESPACE pg_default
where
  (invited_user_id is not null);

create index IF not exists idx_referrals_inviter_created_at on public.referrals using btree (inviter_user_id, created_at desc) TABLESPACE pg_default;

create trigger referrals_set_updated_at BEFORE
update on referrals for EACH row
execute FUNCTION set_updated_at ();