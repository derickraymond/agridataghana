import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config/env";
import { GHANA_REGIONS } from "@/lib/config/roles";
import { Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import type { PublicListing } from "@/types/database";

export const metadata = { title: "Agricultural Marketplace" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const crop = sp.crop ?? "";
  const region = sp.region ?? "";

  let listings: PublicListing[] = [];
  let crops: { key: string; name: string }[] = [];
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    let query = supabase
      .from("listings")
      .select("id, title, crop_key, quantity_kg, price_per_kg_ghs, quality_grade, region, district, available_from, created_at, crops(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(60);
    if (crop) query = query.eq("crop_key", crop);
    if (region) query = query.eq("region", region);
    // Strip characters that have meaning in PostgREST filter syntax.
    if (q) query = query.ilike("title", `%${q.replace(/[%_,()*\\]/g, " ")}%`);
    const [l, c] = await Promise.all([query, supabase.from("crops").select("key, name").order("name")]);
    listings = (l.data as unknown as PublicListing[] | null) ?? [];
    crops = c.data ?? [];
  }
  const filtered = Boolean(q || crop || region);

  return (
    <>
      <section className="field-pattern text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-fresh-400">Marketplace</p>
          <h1 className="mt-3 text-4xl font-semibold lg:text-5xl">Agricultural marketplace</h1>
          <p className="mt-4 max-w-3xl text-lg text-forest-100">
            Browse produce listed by approved farmers, cooperatives and aggregators. Every listing is reviewed by an administrator before it appears here.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 lg:px-8">
        <form className="grid gap-3 rounded-xl border border-charcoal-200 bg-white p-4 sm:grid-cols-4" role="search" aria-label="Search listings">
          <Input name="q" defaultValue={q} placeholder="Search title" aria-label="Search title" />
          <Select name="crop" defaultValue={crop} aria-label="Produce">
            <option value="">All produce</option>
            {crops.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select name="region" defaultValue={region} aria-label="Region">
            <option value="">All regions</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          <Button>Search</Button>
        </form>

        {listings.length === 0 ? (
          <Card className="border-dashed text-center">
            <h2 className="text-xl font-semibold text-forest-900">{filtered ? "No listings match your search" : "No listings yet"}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-charcoal-500">
              {filtered
                ? "Try a different produce type or region."
                : "No sample listings are shown. Listings appear here as soon as approved sellers publish and an administrator approves them."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              {filtered && (
                <ButtonLink href="/marketplace" variant="outline">
                  Clear search
                </ButtonLink>
              )}
              <ButtonLink href="/register">Create an account</ButtonLink>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((l) => (
              <Link key={l.id} href={`/marketplace/${l.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-semibold text-forest-900">{l.title}</p>
                    {l.quality_grade && <Badge tone="earth">Grade {l.quality_grade}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-charcoal-500">
                    {l.crops?.name ?? l.crop_key} · {l.district ? `${l.district}, ` : ""}
                    {l.region}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-forest-800">
                    GHS {Number(l.price_per_kg_ghs).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    <span className="text-sm font-normal text-charcoal-500"> / kg</span>
                  </p>
                  <p className="text-sm text-charcoal-700">{Number(l.quantity_kg).toLocaleString("en-GB")} kg available</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
        <p className="text-xs text-charcoal-500">
          Prices are asking prices set by sellers. Online payments and order management are not available yet; use enquiries to agree terms directly.
        </p>
      </div>
    </>
  );
}
