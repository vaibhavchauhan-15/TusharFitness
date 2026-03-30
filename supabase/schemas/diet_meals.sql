create table public.diet_meals (
  id uuid not null default gen_random_uuid (),
  diet_plan_id uuid not null,
  meal_name text not null,
  meal_time text null,
  items jsonb null default '[]'::jsonb,
  day_number integer not null default 1,
  meal_type text not null default 'meal'::text,
  title text null,
  food_items jsonb not null default '[]'::jsonb,
  notes text null,
  sort_order integer not null default 0,
  constraint diet_meals_pkey primary key (id),
  constraint diet_meals_diet_plan_id_fkey foreign KEY (diet_plan_id) references diet_plans (id) on delete CASCADE,
  constraint diet_meals_food_items_check check ((jsonb_typeof(food_items) = 'array'::text))
) TABLESPACE pg_default;

create index IF not exists idx_diet_meals_plan_day_sort on public.diet_meals using btree (diet_plan_id, day_number, sort_order) TABLESPACE pg_default;