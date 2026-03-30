create table public.announcements (
  id uuid not null default gen_random_uuid (),
  title text not null,
  slug text not null,
  excerpt text null,
  body text not null,
  target_audience text not null default 'all'::text,
  status text not null default 'draft'::text,
  starts_at timestamp with time zone null,
  ends_at timestamp with time zone null,
  published_at timestamp with time zone null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint announcements_pkey primary key (id),
  constraint announcements_slug_key unique (slug),
  constraint announcements_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint announcements_slug_check check (
    (
      (slug = lower(slug))
      and (slug ~ '^[a-z0-9-]{2,96}$'::text)
    )
  ),
  constraint announcements_status_check check (
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

create index IF not exists idx_announcements_status_published_at on public.announcements using btree (status, published_at desc) TABLESPACE pg_default;

create trigger announcements_set_updated_at BEFORE
update on announcements for EACH row
execute FUNCTION set_updated_at ();