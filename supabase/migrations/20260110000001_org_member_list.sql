-- Member roster for organisation managers/staff (names and roles only, no contact data).
create or replace function public.org_member_list(org uuid)
returns table (user_id uuid, full_name text, member_role public.org_member_role, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, p.full_name, m.member_role, m.joined_at
  from public.organization_members m join public.profiles p on p.id = m.user_id
  where m.organization_id = org and (public.is_org_staff(org) or public.is_admin())
  order by m.joined_at;
$$;
revoke all on function public.org_member_list(uuid) from public, anon;
grant execute on function public.org_member_list(uuid) to authenticated;
