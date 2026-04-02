begin;

alter table public.workout_exercises
  drop constraint if exists workout_exercises_video_url_check;

alter table public.workout_exercises
  drop column if exists video_url;

commit;
