-- AgriData Ghana — Phase 3: marketplace listings and buyer enquiries.
-- Listings are moderated: sellers submit (pending), administrators approve (active) or reject.
-- Only active listings are public. Seller contact details are never exposed; contact happens through enquiries.

create or replace function public.is_seller_role() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('farmer','cooperative','aggregator'));
$$;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  crop_key text not null references public.crops(key),
  title text not null check (char_length(title) between 4 and 140),
  description text check (description is null or char_length(description) <= 2000),
  quantity_kg numeric(12,2) not null check (quantity_kg > 0 and quantity_kg <= 100000000),
  price_per_kg_ghs numeric(12,2) not null check (price_per_kg_ghs > 0 and price_per_kg_ghs <= 1000000),
  quality_grade text check (quality_grade is null or quality_grade in ('A','B','C')),
  region text not null check (char_length(region) between 2 and 60),
  district text check (district is null or char_length(district) <= 80),
  available_from date,
  status text not null default 'pending' check (status in ('pending','active','rejected','sold','withdrawn')),
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 500),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_status_idx on public.listings (status, created_at desc);
create index listings_seller_idx on public.listings (seller_id);
create index listings_crop_idx on public.listings (crop_key);
create index listings_region_idx on public.listings (region);
create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 5 and 1500),
  quantity_kg numeric(12,2) check (quantity_kg is null or quantity_kg > 0),
  offered_price_per_kg_ghs numeric(12,2) check (offered_price_per_kg_ghs is null or offered_price_per_kg_ghs > 0),
  status text not null default 'open' check (status in ('open','replied','closed')),
  seller_reply text check (seller_reply is null or char_length(seller_reply) <= 1500),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index enquiries_listing_idx on public.enquiries (listing_id);
create index enquiries_buyer_idx on public.enquiries (buyer_id);

create or replace function public.owns_listing(l uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.listings where id = l and seller_id = auth.uid());
$$;
create or replace function public.listing_is_open(l uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.listings where id = l and status = 'active' and seller_id <> auth.uid());
$$;

alter table public.listings enable row level security;
alter table public.enquiries enable row level security;

-- Public marketplace needs crop names.
create policy crops_public_read on public.crops for select to anon using (true);

create policy listings_public on public.listings for select to anon, authenticated
  using (status = 'active' or seller_id = auth.uid() or public.is_admin());
create policy listings_insert on public.listings for insert to authenticated
  with check (seller_id = auth.uid() and status = 'pending' and public.is_approved_member() and public.is_seller_role());
create policy listings_update on public.listings for update to authenticated
  using ((seller_id = auth.uid() and public.is_approved_member()) or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());
create policy listings_delete on public.listings for delete to authenticated
  using (public.is_admin());

-- Sellers may only withdraw or mark their own listing as sold. Moderation fields are admin-only.
create or replace function public.guard_listing_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    if new.status is distinct from old.status and public.is_admin() then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    return new;
  end if;
  if new.status not in ('withdrawn','sold') or old.status not in ('pending','active') then
    raise exception 'Sellers can only withdraw or mark active listings as sold';
  end if;
  if (new.seller_id, new.crop_key, new.title, new.description, new.quantity_kg, new.price_per_kg_ghs,
      new.quality_grade, new.region, new.district, new.moderation_note)
     is distinct from
     (old.seller_id, old.crop_key, old.title, old.description, old.quantity_kg, old.price_per_kg_ghs,
      old.quality_grade, old.region, old.district, old.moderation_note) then
    raise exception 'Listing details cannot be edited after submission';
  end if;
  return new;
end $$;
create trigger listings_guard before update on public.listings
  for each row execute function public.guard_listing_update();

create policy enquiries_select on public.enquiries for select to authenticated
  using (buyer_id = auth.uid() or public.owns_listing(listing_id) or public.is_admin());
create policy enquiries_insert on public.enquiries for insert to authenticated
  with check (buyer_id = auth.uid() and status = 'open' and seller_reply is null
    and public.is_approved_member() and public.listing_is_open(listing_id));
create policy enquiries_update on public.enquiries for update to authenticated
  using (public.owns_listing(listing_id) and public.is_approved_member())
  with check (public.owns_listing(listing_id));

-- Sellers may only reply to or close an enquiry.
create or replace function public.guard_enquiry_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if (new.listing_id, new.buyer_id, new.message, new.quantity_kg, new.offered_price_per_kg_ghs, new.created_at)
     is distinct from
     (old.listing_id, old.buyer_id, old.message, old.quantity_kg, old.offered_price_per_kg_ghs, old.created_at) then
    raise exception 'Enquiry details cannot be edited';
  end if;
  if new.seller_reply is distinct from old.seller_reply and new.seller_reply is not null then
    new.replied_at := now();
  end if;
  return new;
end $$;
create trigger enquiries_guard before update on public.enquiries
  for each row execute function public.guard_enquiry_update();

create or replace function public.log_marketplace_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'listings' and tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'listing.submitted', 'listing', new.id::text,
      jsonb_build_object('title', new.title, 'crop', new.crop_key, 'quantity_kg', new.quantity_kg));
  elsif tg_table_name = 'listings' and tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'listing.' || new.status, 'listing', new.id::text,
      jsonb_build_object('title', new.title, 'from', old.status, 'to', new.status));
  elsif tg_table_name = 'enquiries' and tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'enquiry.sent', 'enquiry', new.id::text,
      jsonb_build_object('listing_id', new.listing_id));
  end if;
  return new;
end $$;
create trigger listings_log after insert or update on public.listings
  for each row execute function public.log_marketplace_event();
create trigger enquiries_log after insert on public.enquiries
  for each row execute function public.log_marketplace_event();
