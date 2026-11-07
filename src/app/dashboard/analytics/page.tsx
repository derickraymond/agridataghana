import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { ANALYTICS_ROLES, ROLE_LABELS } from "@/lib/config/roles";

export const metadata = { title: "Analytics dashboard" };
export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-charcoal-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-forest-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-charcoal-500">{hint}</p>}
    </Card>
  );
}

export default async function Page() {
  const { profile } = await requireRole(ANALYTICS_ROLES);
  const supabase = await createClient();

  if (profile.role === "administrator") {
    const [accounts, verified, pending, suspended, farms, harvests, listings, orders, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verification_status", "verified").is("deleted_at", null),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending").is("deleted_at", null),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "suspended").is("deleted_at", null),
      supabase.from("farms").select("id", { count: "exact", head: true }),
      supabase.from("harvests").select("quantity_kg"),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("role").is("deleted_at", null).limit(5000),
    ]);

    const harvestKg = (harvests.data ?? []).reduce((sum, item) => sum + Number(item.quantity_kg || 0), 0);
    const roleCounts = new Map<string, number>();
    for (const row of rolesRes.data ?? []) {
      const key = row.role ?? "unknown";
      roleCounts.set(key, (roleCounts.get(key) ?? 0) + 1);
    }

    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-forest-900">System analytics</h1>
          <Badge>{ROLE_LABELS[profile.role]}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Total accounts" value={String(accounts.count ?? 0)} />
          <Stat label="Verified users" value={String(verified.count ?? 0)} />
          <Stat label="Awaiting approval" value={String(pending.count ?? 0)} />
          <Stat label="Suspended" value={String(suspended.count ?? 0)} />
          <Stat label="Active listings" value={String(listings.count ?? 0)} />
          <Stat label="Registered farms" value={String(farms.count ?? 0)} />
          <Stat label="Harvest recorded" value={String(harvestKg.toLocaleString("en-GB")) + " kg"} />
          <Stat label="Orders" value={String(orders.count ?? 0)} />
          <Stat label="Role mix" value={String(roleCounts.size)} hint="Distinct account roles" />
        </div>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-forest-900">Platform summary</h2>
          <p className="mt-2 text-sm text-charcoal-500">
            This dashboard gives the administration team a quick read on user health, marketplace volume, farm activity and overall platform growth.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/admin" className="font-medium text-forest-700 underline">Admin overview</Link>
            <Link href="/dashboard/admin/users" className="font-medium text-forest-700 underline">View users</Link>
            <Link href="/dashboard/admin/listings" className="font-medium text-forest-700 underline">Review listings</Link>
            <Link href="/dashboard/admin/orders" className="font-medium text-forest-700 underline">Manage orders</Link>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-forest-900">Accounts by role</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...roleCounts.entries()].sort((a, b) => b[1] - a[1]).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between rounded-lg border border-charcoal-200 px-3 py-2 text-sm">
                <span className="capitalize text-charcoal-700">{role.replace(/_/g, " ")}</span>
                <span className="font-semibold text-forest-900">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (profile.role === "farmer") {
    const farmsRes = await supabase.from("farms").select("id").eq("owner_id", profile.id);
    const farmIds = (farmsRes.data ?? []).map((farm) => farm.id);
    const [cycles, harvests, listings, orders] = await Promise.all([
      supabase.from("crop_cycles").select("id", { count: "exact", head: true }).in("farm_id", farmIds.length ? farmIds : ["00000000-0000-0000-0000-000000000000"]),
      supabase.from("harvests")
        .select("quantity_kg")
        .in("cycle_id", (await supabase.from("crop_cycles").select("id").in("farm_id", farmIds.length ? farmIds : ["00000000-0000-0000-0000-000000000000"]))
          .data?.map((cycle) => cycle.id) ?? []),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).eq("status", "active"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", profile.id),
    ]);

    const totalKg = (harvests.data ?? []).reduce((sum, item) => sum + Number(item.quantity_kg || 0), 0);

    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-forest-900">Farmer analytics</h1>
          <Badge>{ROLE_LABELS[profile.role]}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Farms" value={String((farmsRes.data ?? []).length)} />
          <Stat label="Crop cycles" value={String(cycles.count ?? 0)} />
          <Stat label="Harvest recorded" value={String(totalKg.toLocaleString("en-GB")) + " kg"} />
          <Stat label="Active listings" value={String(listings.count ?? 0)} />
          <Stat label="Orders received" value={String(orders.count ?? 0)} />
        </div>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-forest-900">Farming overview</h2>
          <p className="mt-2 text-sm text-charcoal-500">Keep an eye on production output and market activity from your own farm records.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/farmer/farms" className="font-medium text-forest-700 underline">Manage farms</Link>
            <Link href="/dashboard/listings" className="font-medium text-forest-700 underline">My listings</Link>
            <Link href="/dashboard/orders" className="font-medium text-forest-700 underline">Orders</Link>
          </div>
        </Card>
      </div>
    );
  }

  const listingIdsRes = await supabase.from("listings").select("id").eq("seller_id", profile.id);
  const listingIds = (listingIdsRes.data ?? []).map((row) => row.id);
  const [orders, listings, enquiries] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq(profile.role === "buyer" ? "buyer_id" : "seller_id", profile.id),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).eq("status", "active"),
    profile.role === "buyer"
      ? supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("buyer_id", profile.id)
      : supabase.from("enquiries").select("id", { count: "exact", head: true }).in("listing_id", listingIds.length ? listingIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const label = profile.role === "buyer" ? "Buyer analytics" : "Exporter analytics";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold text-forest-900">{label}</h1>
        <Badge>{ROLE_LABELS[profile.role]}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={profile.role === "buyer" ? "Orders placed" : "Orders managed"} value={String(orders.count ?? 0)} />
        <Stat label="Active listings" value={String(listings.count ?? 0)} />
        <Stat label="Enquiries" value={String(enquiries.count ?? 0)} />
        <Stat label="Market activity" value={profile.role === "buyer" ? "Buying" : "Export"} hint="From your current marketplace activity" />
      </div>

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-forest-900">Trading overview</h2>
        <p className="mt-2 text-sm text-charcoal-500">Track your purchasing or exporting activity, active listings and communication history in one place.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/marketplace" className="font-medium text-forest-700 underline">Browse marketplace</Link>
          <Link href="/dashboard/orders" className="font-medium text-forest-700 underline">Orders</Link>
          <Link href="/dashboard/enquiries" className="font-medium text-forest-700 underline">Enquiries</Link>
        </div>
      </Card>
    </div>
  );
}
