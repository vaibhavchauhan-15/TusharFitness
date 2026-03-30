create table public.diet_plans (
  id uuid not null default gen_random_uuid (),
  title text not null,
  category text not null,
  calories integer null,
  protein integer null,
  carbs integer null,
  fats integer null,
  slug text null,
  description text null,
  goal_type text null,
  calories_min integer null,
  calories_max integer null,
  duration_days integer null,
  difficulty text null,
  dietary_preference text null,
  target_audience text null,
  thumbnail_url text null,
  cover_image_url text null,
  pdf_url text null,
  coach_tips text null,
  status text not null default 'draft'::text,
  tags text[] not null default '{}'::text[],
  created_by uuid null,
  published_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint diet_plans_pkey primary key (id),
  constraint diet_plans_slug_key unique (slug),
  constraint diet_plans_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint diet_plans_slug_check check (
    (
      (slug is null)
      or (
        (slug = lower(slug))
        and (slug ~ '^[a-z0-9-]{2,96}$'::text)
      )
    )
  ),
  constraint diet_plans_status_check check (
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

create index IF not exists idx_diet_plans_status_created_at on public.diet_plans using btree (status, created_at desc) TABLESPACE pg_default;

create trigger diet_plans_set_updated_at BEFORE
update on diet_plans for EACH row
execute FUNCTION set_updated_at ();