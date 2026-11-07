-- Phase 5: orders and payment records.
-- Orders are created and advanced only through the SECURITY DEFINER functions below.
-- No payment gateway is integrated: the seller records payments received off-platform
-- (mobile money, cash or bank transfer) and the buyer confirms receipt of goods.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  crop_key text not null,
  quantity_kg numeric(12,2) not null check (quantity_kg > 0),
  unit_price_ghs numeric(12,2) not null check (unit_price_ghs > 0),
  total_ghs numeric(14,2) generated always as (round(quantity_kg * unit_price_ghs, 2)) stored,
  delivery_method text not null check (delivery_method in ('pickup','delivery')),
  delivery_address text check (delivery_address is null or char_length(delivery_address) <= 300),
  contact_phone text not null check (char_length(contact_phone) between 7 and 20),
  notes text check (notes is null or char_length(notes) <= 1000),
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected','dispatched','delivered','completed','cancelled')),
  payment_method text not null check (payment_method in ('mobile_money','cash','bank_transfer')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  payment_reference text check (payment_reference is null or char_length(payment_reference) <= 80),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id),
  check (delivery_method = 'pickup' or delivery_address is not null)
);
create index orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index orders_seller_idx on public.orders (seller_id, created_at desc);
create index orders_listing_idx on public.orders (listing_id);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
create policy orders_select on public.orders for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
revoke insert, update, delete on public.orders from anon, authenticated;

-- Quantity still open for orders on a listing.
create or replace function public.listing_available_kg(l uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select li.quantity_kg - coalesce((
    select sum(o.quantity_kg) from public.orders o
    where o.listing_id = li.id and o.status in ('accepted','dispatched','delivered','completed')
  ), 0)
  from public.listings li where li.id = l;
$$;

create or replace function public.place_order(
  p_listing uuid, p_quantity numeric, p_delivery_method text, p_address text,
  p_phone text, p_payment_method text, p_notes text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  li public.listings;
  new_id uuid;
begin
  if auth.uid() is null or not public.is_approved_member() then
    raise exception 'Your account must be approved before you can place orders';
  end if;
  select * into li from public.listings where id = p_listing;
  if not found or li.status <> 'active' then
    raise exception 'This listing is no longer available';
  end if;
  if li.seller_id = auth.uid() then
    raise exception 'You cannot order your own listing';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Enter a quantity greater than 0';
  end if;
  if p_quantity > public.listing_available_kg(p_listing) then
    raise exception 'Only % kg is still available on this listing', public.listing_available_kg(p_listing);
  end if;
  insert into public.orders (listing_id, buyer_id, seller_id, title, crop_key, quantity_kg, unit_price_ghs,
    delivery_method, delivery_address, contact_phone, notes, payment_method)
  values (li.id, auth.uid(), li.seller_id, li.title, li.crop_key, p_quantity, li.price_per_kg_ghs,
    p_delivery_method, nullif(trim(p_address), ''), trim(p_phone), nullif(trim(p_notes), ''), p_payment_method)
  returning id into new_id;
  return new_id;
end $$;

-- Moves an order along its lifecycle. Allowed transitions depend on who is calling.
create or replace function public.advance_order(p_order uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  is_seller boolean;
  is_buyer boolean;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  is_seller := o.seller_id = auth.uid();
  is_buyer := o.buyer_id = auth.uid();
  if not (is_seller or is_buyer) then raise exception 'Order not found'; end if;

  if is_seller and ((o.status = 'pending' and p_status in ('accepted','rejected'))
      or (o.status = 'accepted' and p_status = 'dispatched')
      or (o.status = 'dispatched' and p_status = 'delivered')) then
    if p_status = 'accepted' and o.quantity_kg > public.listing_available_kg(o.listing_id) then
      raise exception 'Not enough quantity left on the listing to accept this order';
    end if;
  elsif is_buyer and ((o.status in ('pending','accepted') and p_status = 'cancelled' and o.payment_status = 'unpaid')
      or (o.status = 'delivered' and p_status = 'completed')) then
    null;
  else
    raise exception 'This order cannot move from % to %', o.status, p_status;
  end if;
  update public.orders set status = p_status where id = p_order;
end $$;

-- Seller records that payment was received outside the platform.
create or replace function public.record_order_payment(p_order uuid, p_reference text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found or o.seller_id <> auth.uid() then raise exception 'Order not found'; end if;
  if o.status not in ('accepted','dispatched','delivered','completed') then
    raise exception 'Payment can only be recorded on an accepted order';
  end if;
  if o.payment_status = 'paid' then raise exception 'Payment is already recorded'; end if;
  update public.orders
    set payment_status = 'paid', paid_at = now(), payment_reference = nullif(trim(p_reference), '')
    where id = p_order;
end $$;

revoke all on function public.place_order(uuid, numeric, text, text, text, text, text) from public, anon;
revoke all on function public.advance_order(uuid, text) from public, anon;
revoke all on function public.record_order_payment(uuid, text) from public, anon;
revoke all on function public.listing_available_kg(uuid) from public, anon;
grant execute on function public.place_order(uuid, numeric, text, text, text, text, text) to authenticated;
grant execute on function public.advance_order(uuid, text) to authenticated;
grant execute on function public.record_order_payment(uuid, text) to authenticated;
grant execute on function public.listing_available_kg(uuid) to authenticated;

create or replace function public.log_order_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'order.placed', 'order', new.id::text,
      jsonb_build_object('title', new.title, 'quantity_kg', new.quantity_kg, 'total_ghs', new.total_ghs));
  else
    if new.status is distinct from old.status then
      insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
      values (auth.uid(), 'order.' || new.status, 'order', new.id::text,
        jsonb_build_object('title', new.title, 'from', old.status, 'to', new.status));
    end if;
    if new.payment_status is distinct from old.payment_status then
      insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
      values (auth.uid(), 'order.payment_recorded', 'order', new.id::text,
        jsonb_build_object('title', new.title, 'total_ghs', new.total_ghs, 'method', new.payment_method));
    end if;
  end if;
  return new;
end $$;
create trigger orders_log after insert or update on public.orders
  for each row execute function public.log_order_event();
