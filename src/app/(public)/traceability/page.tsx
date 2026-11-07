import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config/env";
import { Alert, Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { EVENT_LABELS } from "@/features/traceability/constants";

export const metadata = { title: "Farm Traceability" };
export const dynamic = "force-dynamic";

type Result = {
  code: string;
  crop: string;
  quantity_kg: number;
  quality_grade: string | null;
  harvest_date: string;
  region: string;
  district: string | null;
  producer_verified: boolean;
  events: { type: string; description: string | null; location: string | null; date: string }[];
};

export default async function Page({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code = "" } = await searchParams;
  const clean = code.trim().slice(0, 30);
  let result: Result | null = null;
  if (clean && isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("verify_batch", { p_code: clean });
    result = (data as Result | null) ?? null;
  }

  return (
    <>
      <section className="field-pattern text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-fresh-400">Farm-to-market</p>
          <h1 className="mt-3 text-4xl font-semibold lg:text-5xl">Verify a batch</h1>
          <p className="mt-4 max-w-3xl text-lg text-forest-100">Enter the code printed on a produce label, or scan its QR code, to see where it was grown and how it moved.</p>
        </div>
      </section>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 lg:px-8">
        <form className="flex flex-wrap gap-3 rounded-xl border border-charcoal-200 bg-white p-4" role="search">
          <Input name="code" defaultValue={clean} placeholder="AGD-XXXX-XXXX-XXXX" aria-label="Batch code" className="sm:w-72" maxLength={30} />
          <Button>Verify</Button>
        </form>

        {clean && !result && <Alert tone="warning">No batch matches “{clean}”. Check the code and try again.</Alert>}

        {result && (
          <div className="space-y-6">
            <Card className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="green">{result.code}</Badge>
                <Badge tone={result.producer_verified ? "green" : "earth"}>{result.producer_verified ? "Verified producer" : "Producer not verified"}</Badge>
                {result.quality_grade && <Badge tone="grey">Grade {result.quality_grade}</Badge>}
              </div>
              <h2 className="text-2xl font-semibold text-forest-900">
                {result.crop} · {Number(result.quantity_kg).toLocaleString("en-GB")} kg
              </h2>
              <p className="text-charcoal-700">
                Grown in {result.district ? `${result.district}, ` : ""}
                {result.region}. Harvested {result.harvest_date}.
              </p>
            </Card>
            <section aria-label="Journey" className="space-y-3">
              <h2 className="text-xl font-semibold text-forest-900">Journey</h2>
              {result.events.map((e, i) => (
                <Card key={i} className="p-4">
                  <p className="font-semibold text-forest-900">{EVENT_LABELS[e.type] ?? e.type}</p>
                  <p className="text-xs text-charcoal-500">
                    {e.date}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  {e.description && <p className="mt-1 text-sm text-charcoal-700">{e.description}</p>}
                </Card>
              ))}
            </section>
            <p className="text-xs text-charcoal-500">Events are recorded by the producer. Personal details are never shown.</p>
          </div>
        )}

        {!clean && (
          <Card className="text-sm text-charcoal-700">
            Farmers create batches from their recorded harvests and add events as the produce is stored, packed and moved. Each batch gets a unique code and QR label.
          </Card>
        )}
      </div>
    </>
  );
}
