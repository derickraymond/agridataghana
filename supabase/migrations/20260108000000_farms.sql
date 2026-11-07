-- AgriData Ghana — Phase 2: farms, crop cycles and harvests.
-- Farmers manage only their own records; administrators can read everything.

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  region text not null check (char_length(region) between 2 and 60),
  district text check (district is null or char_length(district) <= 80),
  community text check (community is null or char_length(community) <= 120),
  size_hectares numeric(10,2) not null check (size_hectares > 0 and size_hectares <= 100000),
  latitude numeric(9,6) check (latitude is null or latitude between 4.5 and 11.5),
  longitude numeric(9,6) check (longitude is null or longitude between -3.5 and 1.5),
  ownership text not null default 'owned' check (ownership in ('owned','leased','family','communal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);
create index farms_owner_idx on public.farms (owner_id);
create index farms_region_idx on public.farms (region);
create trigger farms_updated_at before update on public.farms
  for each row execute function public.set_updated_at();

create table public.crops (
  key text primary key,
  name text not null,
  category text not null
);
insert into public.crops (key, name, category) values
  ('maize','Maize','cereal'),('rice','Rice','cereal'),('sorghum','Sorghum','cereal'),('millet','Millet','cereal'),
  ('cassava','Cassava','root_tuber'),('yam','Yam','root_tuber'),('cocoyam','Cocoyam','root_tuber'),('sweet_potato','Sweet potato','root_tuber'),
  ('plantain','Plantain','fruit'),('pineapple','Pineapple','fruit'),('mango','Mango','fruit'),('citrus','Citrus','fruit'),
  ('tomato','Tomato','vegetable'),('pepper','Pepper','vegetable'),('onion','Onion','vegetable'),('okra','Okra','vegetable'),('garden_egg','Garden egg','vegetable'),
  ('groundnut','Groundnut','legume'),('cowpea','Cowpea','legume'),('soybean','Soybean','legume'),
  ('cocoa','Cocoa','cash_crop'),('oil_palm','Oil palm','cash_crop'),('cashew','Cashew','cash_crop'),('shea','Shea','cash_crop'),('coffee','Coffee','cash_crop'),
  ('other','Other','other')
on conflict (key) do nothing;

create table public.crop_cycles (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  crop_key text not null references public.crops(key),
  season text not null check (char_length(season) between 2 and 40),
  area_hectares numeric(10,2) not null check (area_hectares > 0 and area_hectares <= 100000),
  planting_date date,
  expected_harvest_date date,
  status text not null default 'planned' check (status in ('planned','growing','harvested','abandoned')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expected_harvest_date is null or planting_date is null or expected_harvest_date >= planting_date)
);
create index crop_cycles_farm_idx on public.crop_cycles (farm_id);
create trigger crop_cycles_updated_at before update on public.crop_cycles
  for each row execute function public.set_updated_at();

create table public.harvests (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.crop_cycles(id) on delete cascade,
  harvest_date date not null check (harvest_date <= current_date + 1),
  quantity_kg numeric(12,2) not null check (quantity_kg > 0 and quantity_kg <= 100000000),
  quality_grade text check (quality_grade is null or quality_grade in ('A','B','C')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index harvests_cycle_idx on public.harvests (cycle_id);

-- Ownership helpers (SECURITY DEFINER avoids recursive RLS evaluation).
create or replace function public.owns_farm(f uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.farms where id = f and owner_id = auth.uid());
$$;
create or replace function public.owns_cycle(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.crop_cycles cc join public.farms f on f.id = cc.farm_id
    where cc.id = c and f.owner_id = auth.uid());
$$;
-- Only approved, active accounts may write farm data.
create or replace function public.is_approved_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and account_status = 'active' and deleted_at is null
      and verification_status = 'verified' and role <> 'pending_review');
$$;

alter table public.farms enable row level security;
alter table public.crops enable row level security;
alter table public.crop_cycles enable row level security;
alter table public.harvests enable row level security;

create policy crops_read on public.crops for select to authenticated using (true);
create policy crops_admin on public.crops for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy farms_select on public.farms for select to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy farms_insert on public.farms for insert to authenticated
  with check (owner_id = auth.uid() and public.is_approved_member());
create policy farms_update on public.farms for update to authenticated
  using (owner_id = auth.uid() and public.is_approved_member()) with check (owner_id = auth.uid());
create policy farms_delete on public.farms for delete to authenticated
  using (owner_id = auth.uid() and public.is_approved_member());

create policy cycles_select on public.crop_cycles for select to authenticated using (public.owns_farm(farm_id) or public.is_admin());
create policy cycles_insert on public.crop_cycles for insert to authenticated
  with check (public.owns_farm(farm_id) and public.is_approved_member());
create policy cycles_update on public.crop_cycles for update to authenticated
  using (public.owns_farm(farm_id) and public.is_approved_member()) with check (public.owns_farm(farm_id));
create policy cycles_delete on public.crop_cycles for delete to authenticated
  using (public.owns_farm(farm_id) and public.is_approved_member());

create policy harvests_select on public.harvests for select to authenticated using (public.owns_cycle(cycle_id) or public.is_admin());
create policy harvests_insert on public.harvests for insert to authenticated
  with check (public.owns_cycle(cycle_id) and public.is_approved_member());
create policy harvests_delete on public.harvests for delete to authenticated
  using (public.owns_cycle(cycle_id) and public.is_approved_member());

-- Activity log entries (no personal details copied).
create or replace function public.log_farm_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'farms' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'farm.created', 'farm', new.id::text,
      jsonb_build_object('name', new.name, 'region', new.region, 'size_hectares', new.size_hectares));
  elsif tg_table_name = 'harvests' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'harvest.recorded', 'harvest', new.id::text,
      jsonb_build_object('quantity_kg', new.quantity_kg, 'cycle_id', new.cycle_id));
  end if;
  return new;
end $$;
create trigger farms_log after insert on public.farms for each row execute function public.log_farm_event();
create trigger harvests_log after insert on public.harvests for each row execute function public.log_farm_event();
