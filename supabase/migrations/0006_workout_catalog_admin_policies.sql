-- Allow authenticated admin users to manage workout catalog taxonomy and exercises.
-- Public app users keep read-only access through existing read policies.

drop policy if exists "workout_goals_manage_admin" on public.workout_goals;
create policy "workout_goals_manage_admin"
on public.workout_goals for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "workout_body_parts_manage_admin" on public.workout_body_parts;
create policy "workout_body_parts_manage_admin"
on public.workout_body_parts for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "workout_exercise_library_manage_admin" on public.workout_exercise_library;
create policy "workout_exercise_library_manage_admin"
on public.workout_exercise_library for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));
