begin;

alter table public.workout_exercises
  drop constraint if exists workout_exercises_body_part_slug_check;

alter table public.workout_exercises
  add constraint workout_exercises_body_part_slug_check
  check (
    body_part_slug in (
      'abs', 'arms', 'forearms', 'biceps', 'triceps', 'chest', 'back',
      'legs', 'shoulders', 'core', 'thighs', 'hips', 'glutes'
    )
  );

commit;
