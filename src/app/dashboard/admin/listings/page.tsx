import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { moderateListing, removeListing } from "@/features/marketplace/actions";
import { formatDate } from "@/lib/admin/data";
import type { Listing } from "@/types/database";

export const metadata = { title: "Marketplace moderation" };

const TONE = { pending: "earth", active: "green", rejected: "red", sold: "grey", withdrawn: "grey" } as const;

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("*, crops(name)").order("created_at", { ascending: false }).limit(200);
  const listings = (data as unknown as Listing[] | null) ?? [];
  const pending = listings.filter((l) => l.status === "pending");
  const others = listings.filter((l) => l.status !== "pending");

  const row = (l: Listing) => (
    <Card key={l.id} className="space-y-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-forest-900">{l.title}</p>
        <Badge tone={TONE[l.status]}>{l.status}</Badge>
      </div>
      <p className="text-sm text-charcoal-500">
        {l.crops?.name} · {Number(l.quantity_kg).toLocaleString("en-GB")} kg · GHS {Number(l.price_per_kg_ghs).toFixed(2)}/kg · {l.region} · {formatDate(l.created_at)}
      </p>
      {l.description && <p className="whitespace-pre-wrap text-sm text-charcoal-700">{l.description}</p>}
      <p className="text-xs text-charcoal-500">
        Seller:{" "}
        <Link className="underline" href="/dashboard/admin/users">
          {l.seller_id.slice(0, 8)}
        </Link>
      </p>
      <form action={moderateListing} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="listingId" value={l.id} />
        <Input name="note" placeholder="Note to seller (optional)" aria-label="Note to seller" className="max-w-xs" maxLength={500} />
        {l.status !== "active" && (
          <Button size="sm" name="decision" value="active">
            Approve
          </Button>
        )}
        {l.status !== "rejected" && (
          <Button size="sm" variant="outline" name="decision" value="rejected">
            Reject
          </Button>
        )}
      </form>
      <form action={removeListing}>
        <input type="hidden" name="listingId" value={l.id} />
        <Button size="sm" variant="outline">
          Delete permanently
        </Button>
      </form>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Marketplace moderation</h1>
        <p className="mt-1 text-charcoal-500">Approve or reject produce listings before they go public.</p>
      </div>
      <section className="space-y-3" aria-label="Pending listings">
        <h2 className="text-xl font-semibold text-forest-900">Awaiting review ({pending.length})</h2>
        {pending.length === 0 && <Card className="text-charcoal-500">Nothing waiting for review.</Card>}
        {pending.map(row)}
      </section>
      <section className="space-y-3" aria-label="All other listings">
        <h2 className="text-xl font-semibold text-forest-900">All other listings ({others.length})</h2>
        {others.length === 0 && <Card className="text-charcoal-500">No other listings.</Card>}
        {others.map(row)}
      </section>
    </div>
  );
}
