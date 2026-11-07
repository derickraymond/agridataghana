-- AgriData Ghana — Phase 4: organisation profiles, members, verification and agro-input catalogue.

-- One active organisation per creator.
create unique index organizations_one_per_creator on public.organizations (created_by) where deleted_at is null;

-- Closes a gap in the foundation policies: managers could update their own organisation's
-- verification status. Only administrators (or the SQL editor) may change privileged fields.
create or replace function public.guard_organization() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.user_role;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not public.is_admin() then
      select role into r from public.profiles where id = auth.uid();
      if not public.is_approved_member() then
        raise exception 'Your account must be approved before creating an organisation';
      end if;
      if r::text <> new.type::text then
        raise exception 'Organisation type must match your account type';
      end if;
      new.verification_status := 'pending';
      new.created_by := auth.uid();
    end if;
    return new;
  end if;
  if auth.uid() is null or public.is_admin() then return new; end if;
  if (new.type, new.created_by, new.verification_status, new.deleted_at)
     is distinct from (old.type, old.created_by, old.verification_status, old.deleted_at) then
    raise exception 'Only an administrator can change verification, type or ownership';
  end if;
  return new;
end $$;
create trigger organizations_guard before insert or update on public.organizations
  for each row execute function public.guard_organization();

-- Members cannot self-verify or be created pre-verified by a manager.
create or replace function public.guard_org_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.verification_status := 'unverified';
  elsif new.verification_status is distinct from old.verification_status
     or new.user_id is distinct from old.user_id
     or new.organization_id is distinct from old.organization_id then
    raise exception 'Only an administrator can change member verification';
  end if;
  return new;
end $$;
create trigger org_members_guard before insert or update on public.organization_members
  for each row execute function public.guard_org_member();

-- Creator-manager bootstrap is done by a SECURITY DEFINER trigger, so it is unaffected.

create or replace function public.is_org_staff(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = auth.uid() and member_role in ('manager','staff'));
$$;

-- Managers add an existing, approved, active user by email. The response is deliberately
-- generic so the function cannot be used to discover which emails are registered.
create or replace function public.add_org_member(org uuid, member_email text, as_role public.org_member_role default 'member')
returns text language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not (public.is_org_manager(org) and public.is_approved_member()) then
    raise exception 'Not allowed';
  end if;
  if as_role = 'manager' then raise exception 'Managers cannot be added this way'; end if;
  select u.id into uid from auth.users u
    join public.profiles p on p.id = u.id
   where lower(u.email) = lower(trim(member_email))
     and p.account_status = 'active' and p.deleted_at is null
     and p.verification_status = 'verified' and p.role <> 'pending_review';
  if uid is null then return 'not_eligible'; end if;
  insert into public.organization_members (organization_id, user_id, member_role)
  values (org, uid, as_role) on conflict do nothing;
  return 'added';
end $$;
revoke all on function public.add_org_member(uuid, text, public.org_member_role) from public, anon;
grant execute on function public.add_org_member(uuid, text, public.org_member_role) to authenticated;

-- Agro-input catalogue (seeds, fertiliser, chemicals, tools, equipment).
create table public.agro_inputs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 140),
  category text not null check (category in ('seed','fertiliser','agrochemical','tool','equipment','other')),
  description text check (description is null or char_length(description) <= 1500),
  unit text not null check (char_length(unit) between 1 and 30),
  price_ghs numeric(12,2) not null check (price_ghs > 0 and price_ghs <= 100000000),
  stock_quantity numeric(12,2) not null default 0 check (stock_quantity >= 0),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index agro_inputs_org_idx on public.agro_inputs (organization_id);
create trigger agro_inputs_updated_at before update on public.agro_inputs
  for each row execute function public.set_updated_at();

alter table public.agro_inputs enable row level security;
create policy inputs_select on public.agro_inputs for select to authenticated
  using (public.is_org_staff(organization_id) or public.is_admin());
create policy inputs_insert on public.agro_inputs for insert to authenticated
  with check (public.is_org_staff(organization_id) and public.is_approved_member()
    and exists (select 1 from public.organizations o where o.id = organization_id and o.type = 'agro_dealer'));
create policy inputs_update on public.agro_inputs for update to authenticated
  using (public.is_org_staff(organization_id) and public.is_approved_member())
  with check (public.is_org_staff(organization_id));
create policy inputs_delete on public.agro_inputs for delete to authenticated
  using (public.is_org_staff(organization_id) and public.is_approved_member());

-- Public catalogue: only active products from verified dealers; no registration numbers or contacts.
create view public.public_agro_inputs as
  select i.id, i.name, i.category, i.description, i.unit, i.price_ghs, i.stock_quantity,
         o.name as dealer_name, o.region as dealer_region, o.district as dealer_district
  from public.agro_inputs i
  join public.organizations o on o.id = i.organization_id
  where i.status = 'active' and o.verification_status = 'verified'
    and o.deleted_at is null and o.type = 'agro_dealer';
grant select on public.public_agro_inputs to anon, authenticated;

-- Activity log for organisation verification changes.
create or replace function public.log_organization_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.verification_status is distinct from old.verification_status then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'organization.' || new.verification_status::text, 'organization', new.id::text,
      jsonb_build_object('name', new.name, 'type', new.type));
  end if;
  return new;
end $$;
create trigger organizations_status_log after update on public.organizations
  for each row execute function public.log_organization_status();
