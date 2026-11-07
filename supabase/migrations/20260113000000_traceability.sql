-- AgriData Ghana — Phase 7: farm-to-market traceability.
-- Batches are created from recorded harvests. Events are append-only.
-- The public can verify a batch by its code through verify_batch() only; no table is publicly readable.

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  harvest_id uuid not null unique references public.harvests(id) on delete restrict,
  crop_key text not null references public.crops(key),
  quantity_kg numeric(12,2) not null check (quantity_kg > 0),
  quality_grade text check (quality_grade is null or quality_grade in ('A','B','C')),
  harvest_date date not null,
  origin_region text not null,
  origin_district text,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now()
);
create index batches_owner_idx on public.batches (owner_id, created_at desc);

create table public.batch_events (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  event_type text not null check (event_type in ('harvested','stored','quality_check','packed','transported','delivered','sold')),
  description text check (description is null or char_length(description) <= 300),
  location text check (location is null or char_length(location) <= 120),
  occurred_on date not null check (occurred_on <= current_date + 1),
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index batch_events_batch_idx on public.batch_events (batch_id, occurred_on, created_at);

alter table public.batches enable row level security;
alter table public.batch_events enable row level security;

create policy batches_select on public.batches for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());
create policy batch_events_select on public.batch_events for select to authenticated
  using (exists (select 1 from public.batches b where b.id = batch_id and (b.owner_id = auth.uid() or public.is_admin())));
-- No insert/update/delete policies: all writes go through the functions below.

create or replace function public.create_batch(p_harvest uuid, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  h record; f record; v_id uuid; v_code text; hx text;
begin
  if auth.uid() is null or not public.is_approved_member() then
    raise exception 'Your account is not approved to create batches.';
  end if;
  select hv.*, cc.crop_key, cc.farm_id into h
    from public.harvests hv join public.crop_cycles cc on cc.id = hv.cycle_id where hv.id = p_harvest;
  if not found or not public.owns_cycle(h.cycle_id) then
    raise exception 'Harvest not found.';
  end if;
  select region, district into f from public.farms where id = h.farm_id;
  hx := upper(replace(gen_random_uuid()::text, '-', ''));
  v_code := 'AGD-' || substr(hx,1,4) || '-' || substr(hx,5,4) || '-' || substr(hx,9,4);
  insert into public.batches (code, owner_id, harvest_id, crop_key, quantity_kg, quality_grade, harvest_date, origin_region, origin_district, notes)
  values (v_code, auth.uid(), p_harvest, h.crop_key, h.quantity_kg, h.quality_grade, h.harvest_date, f.region, f.district, nullif(trim(p_notes), ''))
  returning id into v_id;
  insert into public.batch_events (batch_id, event_type, description, location, occurred_on, recorded_by)
  values (v_id, 'harvested', 'Harvest recorded', f.region, h.harvest_date, auth.uid());
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'batch.created', 'batch', v_id::text, jsonb_build_object('code', v_code, 'crop', h.crop_key, 'quantity_kg', h.quantity_kg));
  return v_id;
end $$;

create or replace function public.add_batch_event(p_batch uuid, p_type text, p_description text, p_location text, p_on date)
returns void language plpgsql security definer set search_path = public as $$
declare b record;
begin
  select id, owner_id, code into b from public.batches where id = p_batch;
  if not found or (b.owner_id <> auth.uid() and not public.is_admin()) then
    raise exception 'Batch not found.';
  end if;
  if not public.is_admin() and not public.is_approved_member() then
    raise exception 'Your account is not approved.';
  end if;
  if p_type = 'harvested' then raise exception 'The harvest event is recorded automatically.'; end if;
  insert into public.batch_events (batch_id, event_type, description, location, occurred_on, recorded_by)
  values (p_batch, p_type, nullif(trim(p_description), ''), nullif(trim(p_location), ''), p_on, auth.uid());
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'batch.event', 'batch', p_batch::text, jsonb_build_object('code', b.code, 'event', p_type));
end $$;

-- Public verification: returns only non-personal provenance details.
create or replace function public.verify_batch(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare b record; r jsonb;
begin
  select ba.*, c.name as crop_name, (p.verification_status = 'verified') as producer_verified
    into b from public.batches ba
    join public.crops c on c.key = ba.crop_key
    join public.profiles p on p.id = ba.owner_id
    where ba.code = upper(trim(p_code));
  if not found then return null; end if;
  select jsonb_build_object(
    'code', b.code, 'crop', b.crop_name, 'quantity_kg', b.quantity_kg, 'quality_grade', b.quality_grade,
    'harvest_date', b.harvest_date, 'region', b.origin_region, 'district', b.origin_district,
    'producer_verified', b.producer_verified,
    'events', coalesce((select jsonb_agg(jsonb_build_object('type', e.event_type, 'description', e.description,
        'location', e.location, 'date', e.occurred_on) order by e.occurred_on, e.created_at)
      from public.batch_events e where e.batch_id = b.id), '[]'::jsonb)) into r;
  return r;
end $$;

revoke all on function public.create_batch(uuid, text) from public, anon;
revoke all on function public.add_batch_event(uuid, text, text, text, date) from public, anon;
grant execute on function public.create_batch(uuid, text) to authenticated;
grant execute on function public.add_batch_event(uuid, text, text, text, date) to authenticated;
grant execute on function public.verify_batch(text) to anon, authenticated;
