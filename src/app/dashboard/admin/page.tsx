import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { countProfiles, formatDate } from "@/lib/admin/data";
import { ROLE_LABELS, type UserRole } from "@/lib/config/roles";
import { ROLE_MODULES } from "@/lib/config/dashboard-modules";
import type { AuditLog } from "@/types/database";

export const metadata = { title: "Administration" };

function Stat({ label, value, href, tone }: { label: string; value: number; href?: string; tone?: "alert" }) {
  const body = (
    <Card className={`p-4 ${tone === "alert" && value > 0 ? "border-earth-500/50 bg-earth-50" : ""}`}>
      <p className="text-sm text-charcoal-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-forest-900">{value}</p>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
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
  const { profile } = await requireAdmin();
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const [total, awaiting, suspended, rejected, unhandled, events24h, roles, recent, farmsRes, harvestRes, listingsRes, ordersRes, pricesRes, advisoriesRes] = await Promise.all([
    countProfiles({}),
    countProfiles({}, true),
    countProfiles({ account_status: "suspended" }),
    countProfiles({ verification_status: "rejected" }),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("profiles").select("role").is("deleted_at", null).limit(5000),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("farms").select("size_hectares", { count: "exact" }).limit(5000),
    supabase.from("harvests").select("quantity_kg").limit(5000),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("commodity_prices").select("id", { count: "exact", head: true }),
    supabase.from("advisories").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  const farmHa = (farmsRes.data ?? []).reduce((s, f) => s + Number(f.size_hectares), 0);
  const harvestKg = (harvestRes.data ?? []).reduce((s, h) => s + Number(h.quantity_kg), 0);

  const roleCounts = new Map<string, number>();
  for (const r of roles.data ?? []) roleCounts.set(r.role, (roleCounts.get(r.role) ?? 0) + 1);
  const roleEntries = [...roleCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxRoleValue = Math.max(...roleEntries.map(([, count]) => count), 1);
  const chartMax = Math.max(
    total,
    farmsRes.count ?? 0,
    listingsRes.count ?? 0,
    ordersRes.count ?? 0,
    pricesRes.count ?? 0,
    advisoriesRes.count ?? 0,
    1,
  );
  const logs = (recent.data as AuditLog[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold text-forest-900">Administration</h1>
        <Badge>Signed in as {profile.full_name}</Badge>
      </div>

      <section aria-label="Platform summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Total accounts" value={total} href="/dashboard/admin/users" />
        <Stat label="Awaiting approval" value={awaiting} href="/dashboard/admin/approvals" tone="alert" />
        <Stat label="Suspended" value={suspended} href="/dashboard/admin/users?status=suspended" />
        <Stat label="Rejected" value={rejected} />
        <Stat label="Unhandled messages" value={unhandled.count ?? 0} href="/dashboard/admin/messages" tone="alert" />
        <Stat label="Events in last 24 hours" value={events24h.count ?? 0} href="/dashboard/admin/activity" />
        <Stat label="Registered farms" value={farmsRes.count ?? 0} />
        <Stat label="Farmland registered (ha)" value={Math.round(farmHa * 10) / 10} />
        <Stat label="Harvest recorded (kg)" value={Math.round(harvestKg)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-forest-900">Accounts by role</h2>
          <Card className="p-5">
            <div className="space-y-4">
              {roleEntries.map(([role, count]) => (
                <Link key={role} href={`/dashboard/admin/users?role=${role}`} className="block">
                  <ProgressBar label={ROLE_LABELS[role as UserRole] ?? role} value={count} total={maxRoleValue} />
                </Link>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-forest-900">Recent activity</h2>
            <Link href="/dashboard/admin/activity" className="text-sm font-medium text-forest-700">
              View all
            </Link>
          </div>
          <Card className="divide-y divide-charcoal-100 p-0">
            {logs.length === 0 && <p className="p-4 text-sm text-charcoal-500">No activity yet.</p>}
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-charcoal-700">{l.action.replace(/[._]/g, " ")}</span>
                <span className="shrink-0 text-xs text-charcoal-500">{formatDate(l.created_at)}</span>
              </div>
            ))}
          </Card>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-forest-900">Platform activity</h2>
        <Card className="p-5">
          <div className="space-y-4">
            <ProgressBar label="Accounts" value={total} total={chartMax} />
            <ProgressBar label="Farms" value={farmsRes.count ?? 0} total={chartMax} />
            <ProgressBar label="Listings" value={listingsRes.count ?? 0} total={chartMax} />
            <ProgressBar label="Orders" value={ordersRes.count ?? 0} total={chartMax} />
            <ProgressBar label="Prices" value={pricesRes.count ?? 0} total={chartMax} />
            <ProgressBar label="Advisories" value={advisoriesRes.count ?? 0} total={chartMax} />
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-forest-900">Coming in later phases</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLE_MODULES.administrator.map((m) => (
            <Card key={m.title} className="p-4">
              <Badge tone="grey">Planned · Phase {m.phase}</Badge>
              <p className="mt-2 font-semibold text-forest-900">{m.title}</p>
              <p className="text-sm text-charcoal-500">{m.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
