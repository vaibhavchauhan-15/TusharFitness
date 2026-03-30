create table public.categories (
  id uuid not null default gen_random_uuid (),
  type text not null,
  name text not null,
  slug text not null,
  description text null,
  status text not null default 'active'::text,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_slug_key unique (slug),
  constraint categories_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint categories_slug_check check (
    (
      (slug = lower(slug))
      and (slug ~ '^[a-z0-9-]{2,96}$'::text)
    )
  ),
  constraint categories_status_check check (
    (
      status = any (array['active'::text, 'archived'::text])
    )
  ),
  constraint categories_type_check check (
    (
      type = any (
        array[
          'diet'::text,
          'workout'::text,
          'content'::text,
          'media'::text,
          'general'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_categories_type_status on public.categories using btree (type, status) TABLESPACE pg_default;

create trigger categories_set_updated_at BEFORE
update on categories for EACH row
execute FUNCTION set_updated_at ();