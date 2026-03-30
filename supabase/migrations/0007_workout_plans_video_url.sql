-- Ensure workout_exercises has media_url and validate it as an optional video URL.

alter table public.workout_exercises
  add column if not exists media_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_exercises_media_url_check'
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_media_url_check
      check (media_url is null or media_url ~* '^https?://');
  end if;
end $$;
