-- Creates or updates an email user, profile, and single-role admin access.
-- Run this whole file in Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$
declare
  v_email text := 'vaibhavchauhan12353@gmail.com';
  v_password text := 'vaibhavadmin@12353';
  v_full_name text := 'Vaibhav Admin';
  v_enable_access_active boolean := true;

  v_user_id uuid;
  v_instance_id uuid;
  v_username text;
begin
  select coalesce(
    (select instance_id from auth.users limit 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  into v_instance_id;

  select id
  into v_user_id
  from auth.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_user_id is null then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      v_instance_id,
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      lower(v_email),
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    returning id into v_user_id;
  else
    update auth.users
    set encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now(),
        raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb
    where id = v_user_id;
  end if;

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', lower(v_email)),
    'email',
    now(),
    now(),
    now()
  where not exists (
    select 1
    from auth.identities i
    where i.user_id = v_user_id
      and i.provider = 'email'
  );

  -- Username must satisfy profiles constraint: ^[a-z0-9_]{3,20}$
  v_username := left('admin_' || replace(v_user_id::text, '-', ''), 20);

  if length(v_username) < 3 then
    v_username := 'admin_user';
  end if;

  insert into public.profiles (
    id,
    username,
    full_name,
    onboarding_completed,
    account_status
  )
  values (
    v_user_id,
    v_username,
    v_full_name,
    true,
    'active'
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      onboarding_completed = true,
      account_status = 'active',
      updated_at = now();

  insert into public.admin_users (
    user_id,
    role,
    permissions,
    is_active,
    created_by
  )
  values (
    v_user_id,
    'admin',
    '["full_access"]'::jsonb,
    true,
    v_user_id
  )
  on conflict (user_id) do update
  set role = 'admin',
      permissions = '["full_access"]'::jsonb,
      is_active = true,
      updated_at = now();

  -- Optional: make sure protected layout accessActive is true for this user.
  -- Your app checks active/trialing subscription to enter /app routes.
  if v_enable_access_active then
    update public.subscriptions
    set status = 'active',
        plan_name = coalesce(plan_name, 'Admin Access'),
        provider = coalesce(provider, 'manual'),
        amount = coalesce(amount, 0),
        currency = coalesce(currency, 'INR'),
        current_period_start = now(),
        current_period_end = now() + interval '365 days',
        trial_end_at = null,
        updated_at = now()
    where user_id = v_user_id
      and status in ('active', 'trialing');

    if not found then
      insert into public.subscriptions (
        user_id,
        plan_name,
        status,
        provider,
        amount,
        currency,
        current_period_start,
        current_period_end,
        provider_payload
      )
      values (
        v_user_id,
        'Admin Access',
        'active',
        'manual',
        0,
        'INR',
        now(),
        now() + interval '365 days',
        '{}'::jsonb
      );
    end if;
  end if;

  raise notice 'Admin bootstrap complete for % (user_id=%)', lower(v_email), v_user_id;
end $$;

-- Verify:
-- select u.id, u.email, p.username, p.onboarding_completed, a.role, a.is_active,
--        s.status as subscription_status, s.current_period_end
-- from auth.users u
-- left join public.profiles p on p.id = u.id
-- left join public.admin_users a on a.user_id = u.id
-- left join public.subscriptions s on s.user_id = u.id and s.status in ('active','trialing')
-- where lower(u.email) = lower('vaibhavchauhan12353@gmail.com');
