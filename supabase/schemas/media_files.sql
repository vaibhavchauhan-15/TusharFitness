create table public.media_files (
  id uuid not null default gen_random_uuid (),
  file_name text not null,
  file_type text not null,
  mime_type text null,
  storage_bucket text null,
  storage_path text null,
  url text not null,
  size_bytes bigint null,
  width integer null,
  height integer null,
  tags text[] not null default '{}'::text[],
  status text not null default 'active'::text,
  uploaded_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint media_files_pkey primary key (id),
  constraint media_files_uploaded_by_fkey foreign KEY (uploaded_by) references profiles (id) on delete set null,
  constraint media_files_file_type_check check (
    (
      file_type = any (
        array[
          'image'::text,
          'pdf'::text,
          'video'::text,
          'other'::text
        ]
      )
    )
  ),
  constraint media_files_size_bytes_check check (
    (
      (size_bytes is null)
      or (size_bytes >= 0)
    )
  ),
  constraint media_files_status_check check (
    (
      status = any (array['active'::text, 'archived'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_media_files_type_created on public.media_files using btree (file_type, created_at desc) TABLESPACE pg_default;

create trigger media_files_set_updated_at BEFORE
update on media_files for EACH row
execute FUNCTION set_updated_at ();