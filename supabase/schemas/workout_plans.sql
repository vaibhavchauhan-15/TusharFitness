create table public.workout_plans (
  id uuid not null default gen_random_uuid (),
  title text not null,
  goal text not null,
  body_part text not null,
  duration text null,
  difficulty text null,
  description text null,
  slug text null,
  goal_type text null,
  level text null,
  duration_weeks integer null,
  thumbnail_url text null,
  tags text[] not null default '{}'::text[],
  status text not null default 'draft'::text,
  created_by uuid null,
  published_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint workout_plans_pkey primary key (id),
  constraint workout_plans_slug_key unique (slug),
  constraint workout_plans_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint workout_plans_slug_check check (
    (
      (slug is null)
      or (
        (slug = lower(slug))
        and (slug ~ '^[a-z0-9-]{2,96}$'::text)
      )
    )
  ),
  constraint workout_plans_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'published'::text,
          'archived'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_workout_plans_status_created_at on public.workout_plans using btree (status, created_at desc) TABLESPACE pg_default;

create trigger workout_plans_set_updated_at BEFORE
update on workout_plans for EACH row
execute FUNCTION set_updated_at ();