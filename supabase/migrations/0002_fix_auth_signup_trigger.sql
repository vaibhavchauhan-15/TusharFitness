create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := 'user_' || left(replace(new.id::text, '-', ''), 8);

  insert into public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    onboarding_completed
  )
  values (
    new.id,
    generated_username,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;