create index if not exists idx_ai_chat_messages_session_created_at_desc
on public.ai_chat_messages(session_id, created_at desc);
