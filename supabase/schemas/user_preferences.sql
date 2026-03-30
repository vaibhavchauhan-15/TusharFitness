create table public.user_preferences (
  user_id uuid not null,
  theme_preference text not null default 'system'::text,
  workout_reminders boolean not null default true,
  meal_reminders boolean not null default true,
  referral_updates boolean not null default true,
  streak_rescue_nudges boolean not null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_preferences_pkey primary key (user_id),
  constraint user_preferences_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint user_preferences_theme_preference_check check (
    (
      theme_preference = any (
        array['light'::text, 'dark'::text, 'system'::text]
      )
    )
  )
) TABLESPACE pg_default;

create trigger user_preferences_set_updated_at BEFORE
update on user_preferences for EACH row
execute FUNCTION set_updated_at ();