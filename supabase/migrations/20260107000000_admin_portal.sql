-- AgriData Ghana — administrator portal: platform-wide activity auditing and admin-only user directory.

-- Activity feed entries for key events. Message bodies and contact details are never copied into the log.
create or replace function public.log_registration() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (new.id, 'user.registered', 'profile', new.id::text,
    jsonb_build_object('role', new.role, 'requested_role', new.requested_role));
  return new;
end $$;

drop trigger if exists profiles_log_registration on public.profiles;
create trigger profiles_log_registration after insert on public.profiles
  for each row execute function public.log_registration();

create or replace function public.log_contact_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (null, 'contact.received', 'contact_message', new.id::text,
    jsonb_build_object('subject', new.subject));
  return new;
end $$;

drop trigger if exists contact_messages_log on public.contact_messages;
create trigger contact_messages_log after insert on public.contact_messages
  for each row execute function public.log_contact_message();

create or replace function public.log_organization() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'organization.created', 'organization', new.id::text,
    jsonb_build_object('name', new.name, 'type', new.type));
  return new;
end $$;

drop trigger if exists organizations_log on public.organizations;
create trigger organizations_log after insert on public.organizations
  for each row execute function public.log_organization();

-- Admin-only directory: joins profiles with auth data (email, sign-in times) that the API otherwise hides.
create or replace function public.admin_list_users() returns table (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, u.email_confirmed_at, u.last_sign_in_at from auth.users u;
end $$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists profiles_verification_idx on public.profiles (verification_status);
