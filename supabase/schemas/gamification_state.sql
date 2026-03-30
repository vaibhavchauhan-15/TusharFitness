create table public.gamification_state (
  user_id uuid not null,
  streak integer not null default 0,
  xp integer not null default 0,
  level integer not null default 1,
  badge text not null default 'Spark'::text,
  title text not null default 'Beginner'::text,
  last_login_at timestamp with time zone null,
  constraint gamification_state_pkey primary key (user_id),
  constraint gamification_state_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint gamification_state_level_check check ((level >= 1)),
  constraint gamification_state_streak_check check ((streak >= 0)),
  constraint gamification_state_xp_check check ((xp >= 0))
) TABLESPACE pg_default;