create table public.ai_chat_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text null,
  created_at timestamp with time zone null default now(),
  constraint ai_chat_sessions_pkey primary key (id),
  constraint ai_chat_sessions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ai_chat_sessions_user_created_at on public.ai_chat_sessions using btree (user_id, created_at desc) TABLESPACE pg_default;