import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { ANALYTICS_ROLES, ROLE_LABELS } from "@/lib/config/roles";
import { buildAdminMetrics } from "@/lib/analytics/metrics";

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

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  const width = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize text-charcoal-700">{label}</span>
        <span className="font-semibold text-forest-900">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-charcoal-100">
        <div className="h-full rounded-full bg-forest-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default async function Page() {
  const { profile } = await requireRole(ANALYTICS_ROLES);
  const supabase = await createClient();

  if (profile.role === "administrator") {
    const [accounts, verified, pending, suspended, farms, harvests, listings, orders, rolesRes, pricesRes, advisoriesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verification_status", "verified").is("deleted_at", null),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending").is("deleted_at", null),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "suspended").is("deleted_at", null),
      supabase.from("farms").select("id", { count: "exact", head: true }),
      supabase.from("harvests").select("quantity_kg"),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("role").is("deleted_at", null).limit(5000),
      supabase.from("commodity_prices").select("id", { count: "exact", head: true }),
      supabase.from("advisories").select("id", { count: "exact", head: true }).eq("status", "published"),
    ]);

    const metrics = buildAdminMetrics({
      accounts: accounts.count ?? 0,
      verified: verified.count ?? 0,
      pending: pending.count ?? 0,
      suspended: suspended.count ?? 0,
      farms: farms.count ?? 0,
      listings: listings.count ?? 0,
      orders: orders.count ?? 0,
      harvests: harvests.data ?? [],
      roles: rolesRes.data ?? [],
      prices: pricesRes.count ?? 0,
      advisories: advisoriesRes.count ?? 0,
    });

    const roleEntries = [...metrics.roleMix.entries()].sort((a, b) => b[1] - a[1]);
    const maxRoleValue = Math.max(...roleEntries.map(([, count]) => count), 1);
    const chartMax = Math.max(metrics.totalAccounts, metrics.totalFarms, metrics.activeListings, metrics.totalOrders, metrics.publishedPrices, metrics.publishedAdvisories, 1);

    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-forest-900">System analytics</h1>
          <Badge>{ROLE_LABELS[profile.role]}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Total accounts" value={String(metrics.totalAccounts)} />
          <Stat label="Verified users" value={String(metrics.verifiedUsers)} />
          <Stat label="Awaiting approval" value={String(metrics.awaitingApproval)} />
          <Stat label="Suspended" value={String(metrics.suspendedUsers)} />
          <Stat label="Active listings" value={String(metrics.activeListings)} />
          <Stat label="Registered farms" value={String(metrics.totalFarms)} />
          <Stat label="Harvest recorded" value={String(metrics.harvestKg.toLocaleString("en-GB")) + " kg"} />
          <Stat label="Orders" value={String(metrics.totalOrders)} />
          <Stat label="Published prices" value={String(metrics.publishedPrices)} />
          <Stat label="Published advisories" value={String(metrics.publishedAdvisories)} />
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

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-xl font-semibold text-forest-900">Accounts by role</h2>
            <div className="mt-4 space-y-4">
              {roleEntries.map(([role, count]) => (
                <ProgressBar key={role} label={role.replace(/_/g, " ")} value={count} total={maxRoleValue} />
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-semibold text-forest-900">Platform activity</h2>
            <div className="mt-4 space-y-4">
              <ProgressBar label="Accounts" value={metrics.totalAccounts} total={chartMax} />
              <ProgressBar label="Farms" value={metrics.totalFarms} total={chartMax} />
              <ProgressBar label="Listings" value={metrics.activeListings} total={chartMax} />
              <ProgressBar label="Orders" value={metrics.totalOrders} total={chartMax} />
              <ProgressBar label="Prices" value={metrics.publishedPrices} total={chartMax} />
              <ProgressBar label="Advisories" value={metrics.publishedAdvisories} total={chartMax} />
            </div>
          </Card>
        </div>
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
