-- AgriData Ghana — Phase 8: analytics for analysts, public organisation directory, export logging.

-- Public directory: verified organisations only, safe columns only.
create view public.public_organizations as
  select id, name, type::text as type, region, district
  from public.organizations
  where verification_status = 'verified' and deleted_at is null;
grant select on public.public_organizations to anon, authenticated;

create or replace function public.is_analyst() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'institutional_analyst' and account_status = 'active'
      and deleted_at is null and verification_status = 'verified');
$$;

-- Aggregate, anonymised analytics. Groups with fewer than 3 distinct producers/sellers are suppressed
-- so that no individual farm or seller can be identified.
create or replace function public.analytics_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare prod jsonb; mkt jsonb; px jsonb;
begin
  if not (public.is_admin() or public.is_analyst()) then
    raise exception 'Not permitted';
  end if;

  select coalesce(jsonb_agg(x order by x->>'region', x->>'crop'), '[]'::jsonb) into prod from (
    select jsonb_build_object('region', f.region, 'crop', c.name, 'producers', count(distinct f.owner_id),
           'harvest_kg', round(sum(h.quantity_kg)::numeric, 0)) x
    from public.harvests h
    join public.crop_cycles cc on cc.id = h.cycle_id
    join public.farms f on f.id = cc.farm_id
    join public.crops c on c.key = cc.crop_key
    group by f.region, c.name
    having count(distinct f.owner_id) >= 3) s;

  select coalesce(jsonb_agg(x order by x->>'crop', x->>'region'), '[]'::jsonb) into mkt from (
    select jsonb_build_object('region', l.region, 'crop', c.name, 'sellers', count(distinct l.seller_id),
           'avg_price', round(avg(l.price_per_kg_ghs)::numeric, 2), 'listed_kg', round(sum(l.quantity_kg)::numeric, 0)) x
    from public.listings l join public.crops c on c.key = l.crop_key
    where l.status = 'active'
    group by l.region, c.name
    having count(distinct l.seller_id) >= 3) s;

  select coalesce(jsonb_agg(x order by x->>'crop', x->>'region'), '[]'::jsonb) into px from (
    select jsonb_build_object('region', p.region, 'crop', c.name, 'avg_price', round(avg(p.price_per_kg_ghs)::numeric, 2),
           'observations', count(*), 'latest', max(p.observed_on)) x
    from public.commodity_prices p join public.crops c on c.key = p.crop_key
    group by p.region, c.name) s;

  return jsonb_build_object('production', prod, 'market', mkt, 'prices', px,
    'min_group', 3, 'totals', jsonb_build_object(
      'farms', (select count(*) from public.farms),
      'harvest_kg', (select coalesce(sum(quantity_kg), 0) from public.harvests)));
end $$;

create or replace function public.log_export(p_type text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not permitted'; end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'export.' || left(p_type, 30), 'export', null, '{}'::jsonb);
end $$;

revoke all on function public.analytics_summary() from public, anon;
revoke all on function public.log_export(text) from public, anon;
grant execute on function public.analytics_summary() to authenticated;
grant execute on function public.log_export(text) to authenticated;
