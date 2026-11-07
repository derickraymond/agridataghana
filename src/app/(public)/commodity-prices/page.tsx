import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config/env";
import { Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { GHANA_REGIONS } from "@/lib/config/roles";

export const metadata = { title: "Commodity Prices" };
export const dynamic = "force-dynamic";

type Price = {
  id: string;
  crop_key: string;
  market: string;
  region: string;
  price_per_kg_ghs: number;
  observed_on: string;
  source: string;
  crops: { name: string } | null;
};

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function Page({ searchParams }: { searchParams: Promise<{ crop?: string; region?: string }> }) {
  const { crop = "", region = "" } = await searchParams;
  let prices: Price[] = [];
  let crops: { key: string; name: string }[] = [];
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    crops = ((await supabase.from("crops").select("key, name").order("name")).data as typeof crops | null) ?? [];
    let q = supabase
      .from("commodity_prices")
      .select("id, crop_key, market, region, price_per_kg_ghs, observed_on, source, crops(name)")
      .order("observed_on", { ascending: false })
      .limit(500);
    if (crops.some((c) => c.key === crop)) q = q.eq("crop_key", crop);
    if ((GHANA_REGIONS as readonly string[]).includes(region)) q = q.eq("region", region);
    prices = ((await q).data as unknown as Price[] | null) ?? [];
  }

  // Latest observation per commodity, market and region, with the change against the previous one.
  const groups = new Map<string, Price[]>();
  for (const p of prices) {
    const k = `${p.crop_key}|${p.market}|${p.region}`;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  const rows = [...groups.values()].map((g) => {
    const [latest, previous] = g;
    const change = previous ? ((Number(latest.price_per_kg_ghs) - Number(previous.price_per_kg_ghs)) / Number(previous.price_per_kg_ghs)) * 100 : null;
    return { latest, change };
  });

  return (
    <>
      <section className="field-pattern text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-fresh-400">Price intelligence</p>
          <h1 className="mt-3 text-4xl font-semibold lg:text-5xl">Commodity prices</h1>
          <p className="mt-4 max-w-3xl text-lg text-forest-100">
            Market prices published by administrators, each with its source and observation date. These are reported observations, not live quotes.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 lg:px-8">
        <form className="flex flex-wrap gap-3 rounded-xl border border-charcoal-200 bg-white p-4" role="search">
          <Select name="crop" defaultValue={crop} aria-label="Commodity" className="sm:w-56">
            <option value="">All commodities</option>
            {crops.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select name="region" defaultValue={region} aria-label="Region" className="sm:w-56">
            <option value="">All regions</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          <Button>Filter</Button>
        </form>

        {rows.length === 0 ? (
          <Card className="border-dashed text-center">
            <h2 className="text-xl font-semibold text-forest-900">No published prices yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-charcoal-500">
              Prices appear here only after administrators publish them with a source and date. No sample figures are shown.
            </p>
            <div className="mt-5 flex justify-center">
              <ButtonLink href="/marketplace" variant="outline">
                See marketplace asking prices
              </ButtonLink>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-charcoal-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-charcoal-50 text-charcoal-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Commodity</th>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Price (GHS/kg)</th>
                  <th className="px-4 py-3 font-semibold">Change</th>
                  <th className="px-4 py-3 font-semibold">Observed</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ latest, change }) => (
                  <tr key={latest.id} className="border-t border-charcoal-100">
                    <td className="px-4 py-3 font-medium text-forest-900">{latest.crops?.name ?? latest.crop_key}</td>
                    <td className="px-4 py-3">
                      {latest.market}, {latest.region}
                    </td>
                    <td className="px-4 py-3 font-semibold">{Number(latest.price_per_kg_ghs).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {change === null ? (
                        <span className="text-charcoal-500">—</span>
                      ) : (
                        <Badge tone={change > 0 ? "earth" : change < 0 ? "green" : "grey"}>
                          {change > 0 ? "▲" : change < 0 ? "▼" : "•"} {Math.abs(change).toFixed(1)}%
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{fmtDate(latest.observed_on)}</td>
                    <td className="px-4 py-3 text-charcoal-500">{latest.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-sm text-charcoal-500">
          Change compares the latest observation with the previous one for the same commodity and market. Price alerts and downloadable reports are not available yet.
        </p>
      </div>
    </>
  );
}
