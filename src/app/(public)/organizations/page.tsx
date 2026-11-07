import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config/env";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";

export const metadata = { title: "Organisation directory" };
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  cooperative: "Cooperative",
  aggregator: "Aggregator",
  agro_dealer: "Agro-dealer",
  buyer: "Buyer",
  processor: "Processor",
  exporter: "Exporter",
  institution: "Institution",
};

type Org = { id: string; name: string; type: string; region: string | null; district: string | null };

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "" } = await searchParams;
  let orgs: Org[] = [];
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    let q = supabase.from("public_organizations").select("id, name, type, region, district").order("name").limit(200);
    if (type in TYPES) q = q.eq("type", type);
    orgs = ((await q).data as Org[] | null) ?? [];
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Organisation directory</h1>
        <p className="mt-1 text-charcoal-500">Verified cooperatives, businesses and institutions on AgriData Ghana. Only organisations approved by our administrators are listed.</p>
      </div>
      <form className="flex gap-2">
        <Select name="type" defaultValue={type} aria-label="Organisation type">
          <option value="">All types</option>
          {Object.entries(TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {orgs.length === 0 ? (
        <Card><p className="text-charcoal-500">No verified organisations to show yet.</p></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orgs.map((o) => (
            <Card key={o.id}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-forest-900">{o.name}</h2>
                <Badge tone="green">{TYPES[o.type] ?? o.type}</Badge>
              </div>
              <p className="mt-1 text-sm text-charcoal-500">{[o.district, o.region].filter(Boolean).join(", ") || "Ghana"}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
