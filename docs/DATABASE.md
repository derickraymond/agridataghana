# Database

Supabase Postgres with Row Level Security on every table.

## Migrations (apply in order)

1. `20260101000000_foundation.sql` – profiles, roles, audit logs, signup trigger
2. `20260107000000_admin_portal.sql`
3. `20260108000000_farms.sql` – farms, crop cycles, harvests, crops
4. `20260109000000_marketplace.sql`
5. `20260110000000_organizations.sql`, `20260110000001_org_member_list.sql`
6. `20260111000000_orders.sql`
7. `20260112000000_intelligence.sql` – prices, advisories
8. `20260113000000_traceability.sql`
9. `20260114000000_phase8.sql` – public organisation view, analytics, export logging

Apply with the Supabase CLI (`supabase db push`) or paste each file into the SQL editor.

## Security model

- RLS everywhere; helpers `is_admin`, `is_approved_member`, `is_extension_agent`, `is_analyst`, `owns_farm`, `owns_cycle` are SECURITY DEFINER.
- Orders, batches and batch events are written only through RPCs.
- Public data is exposed only through views/RPCs with safe columns (`public_agro_inputs`, `public_organizations`, `verify_batch`).
- `analytics_summary()` hides groups with fewer than 3 producers/sellers.

## Backups

Enable daily backups (Supabase Pro) or schedule `pg_dump` before launch.
