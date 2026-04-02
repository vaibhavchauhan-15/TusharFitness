begin;

alter table public.workout_exercises
  add column if not exists video_path text;

update public.workout_exercises
set video_path = nullif(trim(video_path), '')
where video_path is not null;

alter table public.workout_exercises
  drop constraint if exists workout_exercises_video_path_check;

alter table public.workout_exercises
  add constraint workout_exercises_video_path_check
  check (
    video_path is null
    or video_path ~ '^[a-zA-Z0-9][a-zA-Z0-9/_\.-]*$'
  );

commit;
