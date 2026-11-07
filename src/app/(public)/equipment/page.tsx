import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config/env";
import { Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";

export const metadata = { title: "Agro-input catalogue" };
export const dynamic = "force-dynamic";

const CATEGORIES = ["seed", "fertiliser", "agrochemical", "tool", "equipment", "other"];

type Item = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  unit: string;
  price_ghs: number;
  stock_quantity: number;
  dealer_name: string;
  dealer_region: string | null;
  dealer_district: string | null;
};

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "" } = await searchParams;
  let items: Item[] = [];
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    let q = supabase.from("public_agro_inputs").select("*").order("name").limit(100);
    if (CATEGORIES.includes(category)) q = q.eq("category", category);
    items = ((await q).data as Item[] | null) ?? [];
  }

  return (
    <>
      <section className="field-pattern text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-fresh-400">Agricultural inputs</p>
          <h1 className="mt-3 text-4xl font-semibold lg:text-5xl">Seeds, fertiliser, tools and equipment</h1>
          <p className="mt-4 max-w-3xl text-lg text-forest-100">Products listed by verified agro-dealers. Prices are set by each dealer.</p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 lg:px-8">
        <form className="flex gap-3 rounded-xl border border-charcoal-200 bg-white p-4" role="search">
          <Select name="category" defaultValue={category} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Button>Filter</Button>
        </form>
        {items.length === 0 ? (
          <Card className="border-dashed text-center">
            <h2 className="text-xl font-semibold text-forest-900">No products listed yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-charcoal-500">
              Products appear here once verified agro-dealers add them. No sample products are shown.
            </p>
            <div className="mt-5 flex justify-center">
              <ButtonLink href="/for-agro-dealers">Sell as an agro-dealer</ButtonLink>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((i) => (
              <Card key={i.id}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-semibold text-forest-900">{i.name}</p>
                  <Badge tone="grey">{i.category}</Badge>
                </div>
                {i.description && <p className="mt-1 text-sm text-charcoal-700">{i.description}</p>}
                <p className="mt-3 text-2xl font-semibold text-forest-800">
                  GHS {Number(i.price_ghs).toFixed(2)}
                  <span className="text-sm font-normal text-charcoal-500"> / {i.unit}</span>
                </p>
                <p className="text-sm text-charcoal-500">
                  {Number(i.stock_quantity) > 0 ? `${Number(i.stock_quantity)} in stock` : "Out of stock"} · {i.dealer_name},{" "}
                  {i.dealer_district ? `${i.dealer_district}, ` : ""}
                  {i.dealer_region}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
