create table public.ai_chat_messages (
  id uuid not null default gen_random_uuid (),
  session_id uuid not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  constraint ai_chat_messages_pkey primary key (id),
  constraint ai_chat_messages_session_id_fkey foreign KEY (session_id) references ai_chat_sessions (id) on delete CASCADE,
  constraint ai_chat_messages_role_check check (
    (
      role = any (
        array['user'::text, 'assistant'::text, 'system'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ai_chat_messages_session_created_at on public.ai_chat_messages using btree (session_id, created_at) TABLESPACE pg_default;