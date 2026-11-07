import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { CycleForm, HarvestForm } from "@/features/farms/farm-forms";
import { deleteFarm } from "@/features/farms/actions";

export const metadata = { title: "Farm details" };

type Harvest = { id: string; harvest_date: string; quantity_kg: number; quality_grade: string | null };
type Cycle = {
  id: string;
  crop_key: string;
  season: string;
  area_hectares: number;
  planting_date: string | null;
  expected_harvest_date: string | null;
  status: string;
  harvests: Harvest[];
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["farmer"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();

  const { data: farm } = await supabase.from("farms").select("*").eq("id", id).maybeSingle();
  if (!farm) notFound();
  const [{ data: crops }, { data: cycleData }] = await Promise.all([
    supabase.from("crops").select("key, name").order("name"),
    supabase
      .from("crop_cycles")
      .select("id, crop_key, season, area_hectares, planting_date, expected_harvest_date, status, harvests(id, harvest_date, quantity_kg, quality_grade)")
      .eq("farm_id", id)
      .order("created_at", { ascending: false }),
  ]);
  const cropList = (crops as { key: string; name: string }[] | null) ?? [];
  const cropName = new Map(cropList.map((c) => [c.key, c.name]));
  const cycles = (cycleData as unknown as Cycle[] | null) ?? [];
  const totalKg = cycles.reduce((s, c) => s + c.harvests.reduce((h, x) => h + Number(x.quantity_kg), 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">{farm.name}</h1>
          <p className="mt-1 text-charcoal-500">
            {[farm.community, farm.district, farm.region].filter(Boolean).join(", ")} · {Number(farm.size_hectares)} ha · {farm.ownership}
            {farm.latitude !== null ? ` · ${farm.latitude}, ${farm.longitude}` : ""}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge>{cycles.length} crop cycles</Badge>
            <Badge tone="earth">{totalKg.toLocaleString("en-GB")} kg harvested</Badge>
          </div>
        </div>
        <ButtonLink href="/dashboard/farmer/farms" variant="outline" size="sm">
          All farms
        </ButtonLink>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-forest-900">Crop cycles</h2>
        <div className="space-y-4">
          {cycles.length === 0 && <Card className="text-charcoal-500">No crop cycles yet. Add one below.</Card>}
          {cycles.map((c) => (
            <Card key={c.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-semibold text-forest-900">
                  {cropName.get(c.crop_key) ?? c.crop_key} · {c.season}
                </p>
                <Badge tone={c.status === "harvested" ? "green" : c.status === "abandoned" ? "red" : "earth"}>{c.status}</Badge>
              </div>
              <p className="text-sm text-charcoal-500">
                {Number(c.area_hectares)} ha
                {c.planting_date ? ` · planted ${c.planting_date}` : ""}
                {c.expected_harvest_date ? ` · expected harvest ${c.expected_harvest_date}` : ""}
              </p>
              {c.harvests.length > 0 && (
                <ul className="divide-y divide-charcoal-100 rounded-lg border border-charcoal-100 text-sm">
                  {c.harvests.map((h) => (
                    <li key={h.id} className="flex justify-between px-3 py-2">
                      <span>{h.harvest_date}</span>
                      <span className="font-medium">
                        {Number(h.quantity_kg).toLocaleString("en-GB")} kg{h.quality_grade ? ` · Grade ${h.quality_grade}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {c.status !== "abandoned" && <HarvestForm farmId={id} cycleId={c.id} />}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-forest-900">Add a crop cycle</h2>
        <Card>
          <CycleForm farmId={id} crops={cropList} />
        </Card>
      </section>

      <form action={deleteFarm} className="border-t border-charcoal-200 pt-6">
        <input type="hidden" name="farmId" value={id} />
        <Button variant="outline" size="sm" className="border-danger text-danger hover:bg-red-50">
          Delete this farm and its records
        </Button>
      </form>
    </div>
  );
}
