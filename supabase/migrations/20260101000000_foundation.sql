-- AgriData Ghana — Phase 1 foundation: identity, roles, organisations, consent, audit.
-- Apply with: supabase db push (or paste into the Supabase SQL editor).

create extension if not exists pgcrypto;
create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum (
  'farmer', 'cooperative', 'aggregator', 'agro_dealer', 'buyer', 'processor',
  'exporter', 'extension_agent', 'administrator', 'institutional_analyst',
  'pending_review'
);
create type public.account_status as enum ('active', 'suspended');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.org_type as enum (
  'cooperative', 'aggregator', 'agro_dealer', 'buyer', 'processor', 'exporter', 'institution'
);
create type public.org_member_role as enum ('manager', 'staff', 'member');
create type public.consent_type as enum (
  'terms', 'privacy', 'marketing', 'data_sharing_financial', 'data_sharing_research'
);

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Roles and permissions (reference data)
-- ---------------------------------------------------------------------------
create table public.roles (
  key public.user_role primary key,
  label text not null,
  description text,
  self_service boolean not null default false
);

create table public.permissions (
  key text primary key,
  description text not null
);

create table public.role_permissions (
  role_key public.user_role not null references public.roles(key) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text check (phone is null or phone ~ '^\+?[0-9 ]{7,20}$'),
  location text check (location is null or char_length(location) <= 160),
  role public.user_role not null default 'pending_review',
  requested_role public.user_role,
  account_status public.account_status not null default 'active',
  verification_status public.verification_status not null default 'unverified',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role) where deleted_at is null;
create index profiles_status_idx on public.profiles (account_status);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Organisations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  type public.org_type not null,
  registration_number text,
  region text,
  district text,
  verification_status public.verification_status not null default 'unverified',
  created_by uuid not null references public.profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index organizations_type_idx on public.organizations (type) where deleted_at is null;
create index organizations_created_by_idx on public.organizations (created_by);
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.org_member_role not null default 'member',
  verification_status public.verification_status not null default 'unverified',
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members (user_id);

-- ---------------------------------------------------------------------------
-- Consent (append-only) and audit log
-- ---------------------------------------------------------------------------
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type public.consent_type not null,
  granted boolean not null,
  policy_version text not null default '2026-01',
  created_at timestamptz not null default now()
);
create index consent_records_user_idx on public.consent_records (user_id, consent_type, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Contact messages (public form)
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  subject text not null check (char_length(subject) between 3 and 160),
  message text not null check (char_length(message) between 10 and 4000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Security helper functions (SECURITY DEFINER avoids RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrator'
      and account_status = 'active' and deleted_at is null
  );
$$;

create or replace function public.is_org_manager(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = auth.uid() and member_role = 'manager'
  );
$$;

-- ---------------------------------------------------------------------------
-- New user -> profile + consent. Administrator can never be self-assigned.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  requested text := new.raw_user_meta_data ->> 'account_type';
  granted public.user_role;
  req public.user_role;
  consented boolean := coalesce(new.raw_user_meta_data ->> 'consent_terms', 'false') = 'true';
  marketing boolean := coalesce(new.raw_user_meta_data ->> 'consent_marketing', 'false') = 'true';
begin
  if requested in ('farmer', 'cooperative', 'aggregator', 'agro_dealer', 'buyer', 'processor', 'exporter') then
    granted := requested::public.user_role;
    req := granted;
  elsif requested in ('extension_agent', 'institutional_analyst') then
    granted := 'pending_review';          -- needs administrator approval
    req := requested::public.user_role;
  else
    granted := 'pending_review';          -- includes any attempt to request 'administrator'
    req := null;
  end if;

  insert into public.profiles (id, full_name, phone, location, role, requested_role, verification_status)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'New user'),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'location'), ''),
    granted,
    req,
    case when granted = 'pending_review' then 'pending' else 'unverified' end::public.verification_status
  );

  if consented then
    insert into public.consent_records (user_id, consent_type, granted) values
      (new.id, 'terms', true),
      (new.id, 'privacy', true);
  end if;
  insert into public.consent_records (user_id, consent_type, granted) values (new.id, 'marketing', marketing);

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Protect privileged profile columns + audit changes
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null for the service role / SQL editor, which are trusted.
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
       or new.requested_role is distinct from old.requested_role
       or new.account_status is distinct from old.account_status
       or new.verification_status is distinct from old.verification_status
       or new.deleted_at is distinct from old.deleted_at
       or new.id is distinct from old.id then
      raise exception 'Not permitted to change privileged profile fields' using errcode = '42501';
    end if;
  end if;

  if new.role is distinct from old.role
     or new.account_status is distinct from old.account_status
     or new.verification_status is distinct from old.verification_status then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'profile.privileged_change', 'profile', new.id::text,
      jsonb_build_object(
        'role', jsonb_build_array(old.role, new.role),
        'account_status', jsonb_build_array(old.account_status, new.account_status),
        'verification_status', jsonb_build_array(old.verification_status, new.verification_status)));
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Creator becomes manager of a new organisation.
create or replace function public.add_org_creator() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members (organization_id, user_id, member_role)
  values (new.id, new.created_by, 'manager');
  return new;
end $$;

create trigger organizations_add_creator after insert on public.organizations
  for each row execute function public.add_org_creator();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.consent_records enable row level security;
alter table public.audit_logs enable row level security;
alter table public.contact_messages enable row level security;

create policy roles_read on public.roles for select to authenticated using (true);
create policy permissions_read on public.permissions for select to authenticated using (true);
create policy role_permissions_read on public.role_permissions for select to authenticated using (true);
create policy roles_admin on public.roles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy permissions_admin on public.permissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy role_permissions_admin on public.role_permissions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid() and deleted_at is null) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy orgs_select on public.organizations for select to authenticated
  using (
    deleted_at is null and (
      created_by = auth.uid()
      or exists (select 1 from public.organization_members m
                 where m.organization_id = id and m.user_id = auth.uid())
    ) or public.is_admin()
  );
create policy orgs_insert on public.organizations for insert to authenticated
  with check (created_by = auth.uid());
create policy orgs_update on public.organizations for update to authenticated
  using (public.is_org_manager(id) or public.is_admin())
  with check (public.is_org_manager(id) or public.is_admin());

create policy org_members_select on public.organization_members for select to authenticated
  using (user_id = auth.uid() or public.is_org_manager(organization_id) or public.is_admin());
create policy org_members_manage on public.organization_members for all to authenticated
  using (public.is_org_manager(organization_id) or public.is_admin())
  with check (public.is_org_manager(organization_id) or public.is_admin());

create policy consent_select on public.consent_records for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy consent_insert on public.consent_records for insert to authenticated
  with check (user_id = auth.uid());   -- append-only: no update/delete policies

create policy audit_select on public.audit_logs for select to authenticated using (public.is_admin());

create policy contact_insert on public.contact_messages for insert to anon, authenticated with check (handled = false);
create policy contact_admin_select on public.contact_messages for select to authenticated using (public.is_admin());
create policy contact_admin_update on public.contact_messages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
insert into public.roles (key, label, self_service) values
  ('farmer', 'Farmer', true),
  ('cooperative', 'Cooperative', true),
  ('aggregator', 'Aggregator', true),
  ('agro_dealer', 'Agro-dealer', true),
  ('buyer', 'Buyer', true),
  ('processor', 'Processor', true),
  ('exporter', 'Exporter', true),
  ('extension_agent', 'Extension Agent', false),
  ('administrator', 'Administrator', false),
  ('institutional_analyst', 'Institutional Analyst', false),
  ('pending_review', 'Pending approval', false);

insert into public.permissions (key, description) values
  ('farms.manage_own', 'Create and edit own farms and crops'),
  ('listings.manage_own', 'Create and edit own marketplace listings'),
  ('orders.place', 'Place enquiries, quotations and orders'),
  ('orders.manage_own', 'Manage orders received as a seller'),
  ('org.manage', 'Manage organisation profile and members'),
  ('prices.read', 'Read commodity prices'),
  ('prices.write', 'Publish commodity prices'),
  ('advisory.publish', 'Publish agricultural advisory content'),
  ('analytics.read_aggregate', 'Read aggregated, anonymised analytics'),
  ('users.manage', 'Verify, suspend and change user roles'),
  ('listings.moderate', 'Approve and moderate listings'),
  ('audit.read', 'Read audit logs');

insert into public.role_permissions (role_key, permission_key) values
  ('farmer', 'farms.manage_own'), ('farmer', 'listings.manage_own'), ('farmer', 'orders.manage_own'), ('farmer', 'prices.read'),
  ('cooperative', 'org.manage'), ('cooperative', 'listings.manage_own'), ('cooperative', 'orders.manage_own'), ('cooperative', 'prices.read'),
  ('aggregator', 'org.manage'), ('aggregator', 'listings.manage_own'), ('aggregator', 'orders.manage_own'), ('aggregator', 'orders.place'), ('aggregator', 'prices.read'),
  ('agro_dealer', 'org.manage'), ('agro_dealer', 'listings.manage_own'), ('agro_dealer', 'orders.manage_own'), ('agro_dealer', 'prices.read'),
  ('buyer', 'orders.place'), ('buyer', 'prices.read'),
  ('processor', 'orders.place'), ('processor', 'prices.read'), ('processor', 'org.manage'),
  ('exporter', 'orders.place'), ('exporter', 'prices.read'), ('exporter', 'org.manage'),
  ('extension_agent', 'advisory.publish'), ('extension_agent', 'prices.read'),
  ('institutional_analyst', 'analytics.read_aggregate'), ('institutional_analyst', 'prices.read'),
  ('administrator', 'users.manage'), ('administrator', 'listings.moderate'), ('administrator', 'prices.write'),
  ('administrator', 'prices.read'), ('administrator', 'advisory.publish'), ('administrator', 'audit.read'),
  ('administrator', 'analytics.read_aggregate');
