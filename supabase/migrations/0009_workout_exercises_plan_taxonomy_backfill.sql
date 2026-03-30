-- Backfill catalog taxonomy slugs on workout_exercises rows created from workout plans.
-- This ensures rows inserted by admin workout-program uploads are visible in user catalog views.

with resolved as (
  select
    ex.id,
    ex.goal_slug,
    ex.body_part_slug,
    coalesce(
      ex.goal_slug,
      (
        select g.slug
        from public.workout_goals as g
        where g.slug = (
          case
            when goal_key in ('fat-loss', 'fat-losses') then 'fat-loss'
            when goal_key in ('muscle-gain', 'muscle-gains') then 'muscle-gain'
            when goal_key in ('general-fitness', 'maintenance') then 'muscle-gain'
            else goal_key
          end
        )
        limit 1
      ),
      (
        select g.slug
        from public.workout_goals as g
        order by g.sort_order asc, g.name asc
        limit 1
      )
    ) as resolved_goal_slug,
    coalesce(
      ex.body_part_slug,
      (
        select bp.slug
        from public.workout_body_parts as bp
        where bp.slug = (
          case
            when body_part_key = 'full-body' then 'core'
            when body_part_key = 'upper-body' then 'chest'
            when body_part_key = 'lower-body' then 'legs'
            else body_part_key
          end
        )
        limit 1
      ),
      (
        select bp.slug
        from public.workout_body_parts as bp
        order by bp.sort_order asc, bp.name asc
        limit 1
      )
    ) as resolved_body_part_slug
  from public.workout_exercises as ex
  left join public.workout_plans as wp
    on wp.id = ex.workout_plan_id
  cross join lateral (
    select
      nullif(
        lower(regexp_replace(coalesce(wp.goal_type, wp.goal, ''), '[^a-z0-9]+', '-', 'g')),
        ''
      ) as goal_key,
      nullif(
        lower(regexp_replace(coalesce(wp.body_part, ''), '[^a-z0-9]+', '-', 'g')),
        ''
      ) as body_part_key
  ) as normalized
  where ex.goal_slug is null
     or ex.body_part_slug is null
)
update public.workout_exercises as ex
set
  goal_slug = resolved.resolved_goal_slug,
  body_part_slug = resolved.resolved_body_part_slug
from resolved
where ex.id = resolved.id
  and (
    ex.goal_slug is distinct from resolved.resolved_goal_slug
    or ex.body_part_slug is distinct from resolved.resolved_body_part_slug
  );
