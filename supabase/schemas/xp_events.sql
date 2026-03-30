create table public.xp_events (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  event_type text not null,
  xp_delta integer not null,
  event_date date null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint xp_events_pkey primary key (id),
  constraint xp_events_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint xp_events_event_type_check check (
    (
      event_type = any (
        array[
          'login'::text,
          'workout_completed'::text,
          'diet_completed'::text,
          'profile_completed'::text,
          'referral_reward'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_xp_events_user_created_at on public.xp_events using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_xp_events_user_event_date on public.xp_events using btree (user_id, event_date desc) TABLESPACE pg_default;

create unique INDEX IF not exists xp_events_unique_daily on public.xp_events using btree (user_id, event_type, event_date) TABLESPACE pg_default
where
  (event_date is not null);