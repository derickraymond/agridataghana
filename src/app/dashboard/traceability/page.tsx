import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { BatchForm } from "@/features/traceability/trace-forms";

export const metadata = { title: "Traceability" };

type Batch = { id: string; code: string; quantity_kg: number; harvest_date: string; crops: { name: string } | null };
type Cycle = { crop_key: string; crops: { name: string } | null; harvests: { id: string; harvest_date: string; quantity_kg: number }[] };

export default async function Page() {
  await requireRole(["farmer"]);
  const supabase = await createClient();
  const [{ data: b }, { data: c }] = await Promise.all([
    supabase.from("batches").select("id, code, quantity_kg, harvest_date, harvest_id, crops(name)").order("created_at", { ascending: false }),
    supabase.from("crop_cycles").select("crop_key, crops(name), harvests(id, harvest_date, quantity_kg)"),
  ]);
  const rows = (b as unknown as (Batch & { harvest_id: string })[] | null) ?? [];
  const batches: Batch[] = rows;
  const batched = new Set(rows.map((r) => r.harvest_id));
  const harvests = ((c as unknown as Cycle[] | null) ?? []).flatMap((cy) =>
    cy.harvests
      .filter((h) => !batched.has(h.id))
      .map((h) => ({ id: h.id, label: `${cy.crops?.name ?? cy.crop_key} · ${Number(h.quantity_kg).toLocaleString("en-GB")} kg · ${h.harvest_date}` })),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Traceability</h1>
        <p className="mt-1 text-charcoal-500">Turn a recorded harvest into a batch with a code and QR label that anyone can verify.</p>
      </div>
      <Card>
        <h2 className="mb-4 text-xl font-semibold text-forest-900">Create a batch</h2>
        {harvests.length === 0 ? (
          <p className="text-sm text-charcoal-500">
            No harvests are waiting for a batch. Record a harvest on one of your{" "}
            <Link className="underline" href="/dashboard/farmer/farms">
              farms
            </Link>{" "}
            first.
          </p>
        ) : (
          <BatchForm harvests={harvests} />
        )}
      </Card>
      <section aria-label="Batches" className="space-y-3">
        <h2 className="text-xl font-semibold text-forest-900">Your batches ({batches.length})</h2>
        {batches.length === 0 && <Card className="text-charcoal-500">No batches yet.</Card>}
        {batches.map((x) => (
          <Link key={x.id} href={`/dashboard/traceability/${x.id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-2 p-4 transition-shadow hover:shadow-md">
              <div>
                <p className="font-semibold text-forest-900">
                  {x.crops?.name} · {Number(x.quantity_kg).toLocaleString("en-GB")} kg
                </p>
                <p className="text-xs text-charcoal-500">Harvested {x.harvest_date}</p>
              </div>
              <Badge tone="green">{x.code}</Badge>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
