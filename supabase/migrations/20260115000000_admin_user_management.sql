-- AgriData Ghana — admin-managed accounts: create and delete users from the admin portal.
-- Both functions are SECURITY DEFINER, callable only by an active administrator, and write to the audit log.

create or replace function public.admin_create_user(
  p_email text, p_password text, p_full_name text, p_role public.user_role, p_phone text default null
) returns uuid
language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  uid uuid := gen_random_uuid();
  mail text := lower(trim(p_email));
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_role = 'pending_review' then
    raise exception 'Choose a real role' using errcode = '22023';
  end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(mail) > 254 then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;
  if char_length(coalesce(p_password, '')) < 10 or char_length(p_password) > 72 then
    raise exception 'Password must be 10 to 72 characters' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'Enter the full name' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where lower(email) = mail) then
    raise exception 'An account with this email already exists' using errcode = '23505';
  end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('account_type', p_role::text, 'full_name', trim(p_full_name),
      'phone', coalesce(trim(p_phone), ''), 'consent_terms', 'true'),
    now(), now(), '', '', '', '');

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid::text, uid,
    jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true), 'email', now(), now(), now());

  update public.profiles set role = p_role, verification_status = 'verified' where id = uid;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'user.created', 'profile', uid::text, jsonb_build_object('role', p_role));
  return uid;
end $$;

create or replace function public.admin_delete_user(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  target_role public.user_role;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'You cannot delete your own account' using errcode = '22023';
  end if;
  select role into target_role from public.profiles where id = p_user;
  if target_role is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
  if target_role = 'administrator'
     and (select count(*) from public.profiles where role = 'administrator' and account_status = 'active') <= 1 then
    raise exception 'You cannot delete the last administrator' using errcode = '22023';
  end if;

  begin
    delete from auth.users where id = p_user;
  exception when foreign_key_violation then
    raise exception 'This user has farms, orders or other records. Suspend the account instead.' using errcode = '23503';
  end;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'user.deleted', 'profile', p_user::text, jsonb_build_object('role', target_role));
end $$;

revoke all on function public.admin_create_user(text, text, text, public.user_role, text) from public, anon;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_create_user(text, text, text, public.user_role, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
