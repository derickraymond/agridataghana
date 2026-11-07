import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";

export const metadata = { title: "Farmer dashboard" };

export default async function Page() {
  const { profile } = await requireRole(["farmer"]);
  const supabase = await createClient();
  const [farms, cycles, harvests] = await Promise.all([
    supabase.from("farms").select("id", { count: "exact", head: true }),
    supabase.from("crop_cycles").select("id", { count: "exact", head: true }).in("status", ["planned", "growing"]),
    supabase.from("harvests").select("quantity_kg"),
  ]);
  const totalKg = (harvests.data ?? []).reduce((s, h) => s + Number(h.quantity_kg), 0);

  return (
    <div className="space-y-8">
      <section aria-label="Farm records" className="space-y-3">
        <h2 className="text-xl font-semibold text-forest-900">Your farm records</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-charcoal-500">Farms</p>
            <p className="text-3xl font-semibold text-forest-900">{farms.count ?? 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-charcoal-500">Active crop cycles</p>
            <p className="text-3xl font-semibold text-forest-900">{cycles.count ?? 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-charcoal-500">Total harvested (kg)</p>
            <p className="text-3xl font-semibold text-forest-900">{totalKg.toLocaleString("en-GB")}</p>
          </Card>
        </div>
        <Link href="/dashboard/farmer/farms" className="inline-block font-semibold text-forest-700 underline">
          Manage farms, crop cycles and harvests →
        </Link>
      </section>
      <RoleDashboard profile={profile} role="farmer" />
    </div>
  );
}
