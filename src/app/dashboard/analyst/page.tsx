import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Alert, Card } from "@/components/ui/card";

export const metadata = { title: "Analyst dashboard" };
export const dynamic = "force-dynamic";

type Summary = {
  production: { region: string; crop: string; producers: number; harvest_kg: number }[];
  market: { region: string; crop: string; sellers: number; avg_price: number; listed_kg: number }[];
  prices: { region: string; crop: string; avg_price: number; observations: number; latest: string }[];
  min_group: number;
  totals: { farms: number; harvest_kg: number };
};

const n = (v: number) => Number(v).toLocaleString("en-GH");

function Table({ head, rows, empty }: { head: string[]; rows: (string | number)[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-charcoal-500">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-charcoal-200 text-charcoal-500">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-charcoal-100">
              {r.map((c, j) => (
                <td key={j} className="py-2 pr-4">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function Page() {
  await requireRole(["institutional_analyst"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("analytics_summary");
  const s = data as Summary | null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Aggregate analytics</h1>
        <p className="mt-1 text-charcoal-500">
          Anonymised, aggregated data only. Production and market groups with fewer than {s?.min_group ?? 3} distinct producers or sellers are hidden to protect individual farmers.
        </p>
      </div>
      {error || !s ? (
        <Alert tone="error">Analytics are unavailable right now. Your account may not be verified yet.</Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card><p className="text-sm text-charcoal-500">Registered farms</p><p className="text-2xl font-semibold text-forest-900">{n(s.totals.farms)}</p></Card>
            <Card><p className="text-sm text-charcoal-500">Total recorded harvest (kg)</p><p className="text-2xl font-semibold text-forest-900">{n(s.totals.harvest_kg)}</p></Card>
          </div>
          <Card>
            <h2 className="mb-3 font-semibold text-forest-900">Production by region and crop</h2>
            <Table head={["Region", "Crop", "Producers", "Harvest (kg)"]} rows={s.production.map((r) => [r.region, r.crop, r.producers, n(r.harvest_kg)])} empty="No group has enough producers to be shown yet." />
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold text-forest-900">Marketplace supply</h2>
            <Table head={["Region", "Crop", "Sellers", "Avg price (GH₵/kg)", "Listed (kg)"]} rows={s.market.map((r) => [r.region, r.crop, r.sellers, r.avg_price, n(r.listed_kg)])} empty="No group has enough sellers to be shown yet." />
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold text-forest-900">Published commodity prices</h2>
            <Table head={["Region", "Crop", "Avg price (GH₵/kg)", "Observations", "Latest"]} rows={s.prices.map((r) => [r.region, r.crop, r.avg_price, r.observations, r.latest])} empty="No prices published yet." />
          </Card>
        </>
      )}
    </div>
  );
}
