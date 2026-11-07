import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { FarmForm } from "@/features/farms/farm-forms";

export const metadata = { title: "My farms" };

type FarmRow = { id: string; name: string; region: string; district: string | null; size_hectares: number; ownership: string };

export default async function Page() {
  await requireRole(["farmer"]);
  const supabase = await createClient();
  const { data } = await supabase.from("farms").select("id, name, region, district, size_hectares, ownership").order("created_at", { ascending: false });
  const farms = (data as FarmRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">My farms</h1>
          <p className="mt-1 text-charcoal-500">Register your farms, then record crop cycles and harvests for each one.</p>
        </div>
        <ButtonLink href="/dashboard/farmer" variant="outline" size="sm">
          Back to dashboard
        </ButtonLink>
      </div>

      <section aria-label="Registered farms" className="grid gap-4 sm:grid-cols-2">
        {farms.length === 0 && <Card className="text-charcoal-500 sm:col-span-2">You have not registered a farm yet. Add your first one below.</Card>}
        {farms.map((f) => (
          <Link key={f.id} href={`/dashboard/farmer/farms/${f.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <p className="text-lg font-semibold text-forest-900">{f.name}</p>
              <p className="text-sm text-charcoal-500">
                {f.district ? `${f.district}, ` : ""}
                {f.region}
              </p>
              <div className="mt-3 flex gap-2">
                <Badge>{Number(f.size_hectares)} ha</Badge>
                <Badge tone="grey">{f.ownership}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-forest-900">Add a farm</h2>
        <Card>
          <FarmForm />
        </Card>
      </section>
    </div>
  );
}
