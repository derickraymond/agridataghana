import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ReplyForm } from "@/features/marketplace/marketplace-forms";
import { formatDate } from "@/lib/admin/data";
import { ROLE_DASHBOARD } from "@/lib/config/roles";
import type { Enquiry } from "@/types/database";

export const metadata = { title: "Enquiries" };

const SELLERS = ["farmer", "cooperative", "aggregator"];

export default async function Page() {
  const { profile } = await requireRole(["farmer", "cooperative", "aggregator", "agro_dealer", "buyer", "processor", "exporter"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("enquiries")
    .select("*, listings(title, seller_id)")
    .order("created_at", { ascending: false })
    .limit(100);
  const all = (data as unknown as Enquiry[] | null) ?? [];
  const received = all.filter((e) => e.listings?.seller_id === profile.id);
  const sent = all.filter((e) => e.buyer_id === profile.id);
  const isSeller = SELLERS.includes(profile.role);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">Enquiries</h1>
          <p className="mt-1 text-charcoal-500">Messages about marketplace listings.</p>
        </div>
        <div className="flex gap-2">
          {isSeller && (
            <ButtonLink href="/dashboard/listings" variant="outline" size="sm">
              My listings
            </ButtonLink>
          )}
          <ButtonLink href="/marketplace" variant="outline" size="sm">
            Marketplace
          </ButtonLink>
          <ButtonLink href={ROLE_DASHBOARD[profile.role]} variant="outline" size="sm">
            Dashboard
          </ButtonLink>
        </div>
      </div>

      {isSeller && (
        <section aria-label="Received enquiries" className="space-y-3">
          <h2 className="text-xl font-semibold text-forest-900">Received ({received.length})</h2>
          {received.length === 0 && <Card className="text-charcoal-500">No enquiries on your listings yet.</Card>}
          {received.map((e) => (
            <Card key={e.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/marketplace/${e.listing_id}`} className="font-semibold text-forest-900 underline">
                  {e.listings?.title}
                </Link>
                <Badge tone={e.status === "replied" ? "green" : "earth"}>{e.status}</Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm text-charcoal-700">{e.message}</p>
              <p className="text-xs text-charcoal-500">
                {formatDate(e.created_at)}
                {e.quantity_kg ? ` · wants ${Number(e.quantity_kg).toLocaleString("en-GB")} kg` : ""}
                {e.offered_price_per_kg_ghs ? ` · offers GHS ${Number(e.offered_price_per_kg_ghs).toFixed(2)}/kg` : ""}
              </p>
              {e.seller_reply ? (
                <p className="rounded-lg bg-forest-50 p-3 text-sm text-forest-900">Your reply: {e.seller_reply}</p>
              ) : (
                <ReplyForm enquiryId={e.id} />
              )}
            </Card>
          ))}
        </section>
      )}

      <section aria-label="Sent enquiries" className="space-y-3">
        <h2 className="text-xl font-semibold text-forest-900">Sent ({sent.length})</h2>
        {sent.length === 0 && (
          <Card className="text-charcoal-500">
            You have not sent any enquiries. Browse the{" "}
            <Link href="/marketplace" className="font-semibold text-forest-700 underline">
              marketplace
            </Link>
            .
          </Card>
        )}
        {sent.map((e) => (
          <Card key={e.id} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/marketplace/${e.listing_id}`} className="font-semibold text-forest-900 underline">
                {e.listings?.title}
              </Link>
              <Badge tone={e.status === "replied" ? "green" : "earth"}>{e.status === "replied" ? "Seller replied" : "Awaiting reply"}</Badge>
            </div>
            <p className="whitespace-pre-wrap text-sm text-charcoal-700">{e.message}</p>
            <p className="text-xs text-charcoal-500">{formatDate(e.created_at)}</p>
            {e.seller_reply && <p className="rounded-lg bg-forest-50 p-3 text-sm text-forest-900">Seller: {e.seller_reply}</p>}
          </Card>
        ))}
      </section>
    </div>
  );
}
