import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceForm } from "@/features/intelligence/intelligence-forms";
import { deletePrice } from "@/features/intelligence/actions";

export const metadata = { title: "Prices (admin)" };

type Row = { id: string; market: string; region: string; price_per_kg_ghs: number; observed_on: string; source: string; crops: { name: string } | null };

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: crops }, { data }] = await Promise.all([
    supabase.from("crops").select("key, name").order("name"),
    supabase
      .from("commodity_prices")
      .select("id, market, region, price_per_kg_ghs, observed_on, source, crops(name)")
      .order("observed_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60),
  ]);
  const rows = (data as unknown as Row[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Commodity prices</h1>
        <p className="mt-1 text-charcoal-500">Publish observed market prices. Every price needs a source and an observation date.</p>
      </div>
      <Card>
        <h2 className="mb-4 text-xl font-semibold text-forest-900">Publish a price</h2>
        <PriceForm crops={(crops as { key: string; name: string }[] | null) ?? []} />
      </Card>
      <section aria-label="Recent prices" className="space-y-3">
        <h2 className="text-xl font-semibold text-forest-900">Recent prices ({rows.length})</h2>
        {rows.length === 0 && <Card className="text-charcoal-500">No prices published yet.</Card>}
        {rows.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-forest-900">
                {r.crops?.name} · GHS {Number(r.price_per_kg_ghs).toFixed(2)}/kg
              </p>
              <p className="text-xs text-charcoal-500">
                {r.market}, {r.region} · observed {r.observed_on} · source: {r.source}
              </p>
            </div>
            <form action={deletePrice}>
              <input type="hidden" name="id" value={r.id} />
              <Button size="sm" variant="outline">
                Delete
              </Button>
            </form>
          </Card>
        ))}
        <Badge tone="grey">Showing the latest 60</Badge>
      </section>
    </div>
  );
}
