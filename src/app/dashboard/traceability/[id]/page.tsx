import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { EventForm } from "@/features/traceability/trace-forms";
import { EVENT_LABELS } from "@/features/traceability/constants";

export const metadata = { title: "Batch" };

type Batch = {
  id: string;
  code: string;
  quantity_kg: number;
  quality_grade: string | null;
  harvest_date: string;
  origin_region: string;
  origin_district: string | null;
  crops: { name: string } | null;
};
type Ev = { id: string; event_type: string; description: string | null; location: string | null; occurred_on: string };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["farmer"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase
    .from("batches")
    .select("id, code, quantity_kg, quality_grade, harvest_date, origin_region, origin_district, crops(name)")
    .eq("id", id)
    .maybeSingle();
  const batch = data as unknown as Batch | null;
  if (!batch) notFound();
  const { data: ev } = await supabase.from("batch_events").select("id, event_type, description, location, occurred_on").eq("batch_id", id).order("occurred_on").order("created_at");
  const events = (ev as Ev[] | null) ?? [];

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const url = `${origin}/traceability?code=${batch.code}`;
  const qr = await QRCode.toDataURL(url, { width: 240, margin: 1 });

  return (
    <div className="space-y-8">
      <Link href="/dashboard/traceability" className="text-sm underline">
        ← All batches
      </Link>
      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">
            {batch.crops?.name} · {Number(batch.quantity_kg).toLocaleString("en-GB")} kg
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="green">{batch.code}</Badge>
            {batch.quality_grade && <Badge tone="grey">Grade {batch.quality_grade}</Badge>}
            <Badge tone="grey">
              {batch.origin_district ? `${batch.origin_district}, ` : ""}
              {batch.origin_region}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-charcoal-500">
            Public verification link:{" "}
            <a className="underline" href={url}>
              {url}
            </a>
          </p>
        </div>
        <Card className="flex flex-col items-center gap-2 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`QR code for batch ${batch.code}`} width={200} height={200} />
          <p className="font-mono text-sm">{batch.code}</p>
        </Card>
      </div>

      <section aria-label="History" className="space-y-3">
        <h2 className="text-xl font-semibold text-forest-900">History</h2>
        {events.map((e) => (
          <Card key={e.id} className="p-4">
            <p className="font-semibold text-forest-900">{EVENT_LABELS[e.event_type] ?? e.event_type}</p>
            <p className="text-xs text-charcoal-500">
              {e.occurred_on}
              {e.location ? ` · ${e.location}` : ""}
            </p>
            {e.description && <p className="mt-1 text-sm text-charcoal-700">{e.description}</p>}
          </Card>
        ))}
      </section>

      <Card>
        <h2 className="mb-4 text-xl font-semibold text-forest-900">Add an event</h2>
        <p className="mb-4 text-sm text-charcoal-500">Events cannot be edited or deleted after they are recorded.</p>
        <EventForm batchId={batch.id} />
      </Card>
    </div>
  );
}
