-- Phase 6: commodity prices and advisory articles.
-- Prices are entered by administrators with a source and observation date; nothing is generated.
-- Advisories are written by administrators or approved extension agents; agent submissions
-- stay pending until an administrator publishes them. Weather is fetched live from Open-Meteo
-- by the application and is not stored.

create or replace function public.is_extension_agent() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'extension_agent' and account_status = 'active'
      and deleted_at is null and verification_status = 'verified');
$$;

create table public.commodity_prices (
  id uuid primary key default gen_random_uuid(),
  crop_key text not null references public.crops(key),
  market text not null check (char_length(market) between 2 and 100),
  region text not null check (char_length(region) between 2 and 60),
  price_per_kg_ghs numeric(12,2) not null check (price_per_kg_ghs > 0 and price_per_kg_ghs <= 1000000),
  observed_on date not null check (observed_on <= current_date),
  source text not null check (char_length(source) between 2 and 200),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index commodity_prices_lookup_idx on public.commodity_prices (crop_key, region, observed_on desc);

create table public.advisories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 160),
  body text not null check (char_length(body) between 20 and 8000),
  category text not null check (category in ('planting','pest_disease','weather_alert','market','general')),
  crop_key text references public.crops(key),
  region text check (region is null or char_length(region) between 2 and 60),
  status text not null default 'pending' check (status in ('pending','published','archived')),
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index advisories_public_idx on public.advisories (status, published_at desc);

alter table public.commodity_prices enable row level security;
alter table public.advisories enable row level security;

create policy prices_read on public.commodity_prices for select to anon, authenticated using (true);
create policy prices_admin_write on public.commodity_prices for insert to authenticated
  with check (public.is_admin() and created_by = auth.uid());
create policy prices_admin_delete on public.commodity_prices for delete to authenticated
  using (public.is_admin());
create policy prices_admin_update on public.commodity_prices for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy advisories_read on public.advisories for select to anon, authenticated
  using (status = 'published' or author_id = auth.uid() or public.is_admin());
create policy advisories_insert on public.advisories for insert to authenticated
  with check (author_id = auth.uid() and (public.is_admin() or (public.is_extension_agent() and status = 'pending')));
create policy advisories_admin_update on public.advisories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy advisories_admin_delete on public.advisories for delete to authenticated
  using (public.is_admin());

create or replace function public.stamp_advisory() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger advisories_stamp before insert or update on public.advisories
  for each row execute function public.stamp_advisory();

create or replace function public.log_intelligence_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'commodity_prices' and tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'price.published', 'price', new.id::text,
      jsonb_build_object('crop', new.crop_key, 'region', new.region, 'price', new.price_per_kg_ghs));
  elsif tg_table_name = 'advisories' and tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'advisory.submitted', 'advisory', new.id::text,
      jsonb_build_object('title', new.title, 'status', new.status));
  elsif tg_table_name = 'advisories' and tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'advisory.' || new.status, 'advisory', new.id::text,
      jsonb_build_object('title', new.title, 'from', old.status, 'to', new.status));
  end if;
  return new;
end $$;
create trigger prices_log after insert on public.commodity_prices
  for each row execute function public.log_intelligence_event();
create trigger advisories_log after insert or update on public.advisories
  for each row execute function public.log_intelligence_event();
