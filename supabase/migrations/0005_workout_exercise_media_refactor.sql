-- Body-part images are now served from static app assets.
-- Supabase stores exercise content/media only.

alter table public.workout_body_parts
  drop constraint if exists workout_body_parts_image_url_format_check;

alter table public.workout_body_parts
  drop column if exists image_url;

alter table public.workout_exercise_library
  add column if not exists video_url text;

update public.workout_exercise_library
set video_url = null
where video_url = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_exercise_library_video_url_format_check'
  ) then
    alter table public.workout_exercise_library
      add constraint workout_exercise_library_video_url_format_check
      check (video_url is null or video_url ~ '^(https?://|/).+');
  end if;
end $$;

alter table public.workout_exercise_library
  drop constraint if exists workout_exercise_library_muscle_image_url_format_check;

alter table public.workout_exercise_library
  drop column if exists muscle_highlight_image_url;
