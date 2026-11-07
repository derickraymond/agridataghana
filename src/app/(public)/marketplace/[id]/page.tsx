import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { Alert, Badge, Card } from "@/components/ui/card";
import { EnquiryForm } from "@/features/marketplace/marketplace-forms";
import { OrderForm } from "@/features/orders/order-form";
import type { PublicListing } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("id, seller_id, title, description, crop_key, quantity_kg, price_per_kg_ghs, quality_grade, region, district, available_from, created_at, status, crops(name)")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  const listing = data as unknown as (PublicListing & { seller_id: string; description: string | null }) | null;
  if (!listing) notFound();

  const current = await getCurrentUser();
  const profile = current?.profile ?? null;
  const approved = profile && profile.verification_status === "verified" && profile.account_status === "active" && profile.role !== "pending_review" && profile.role !== "administrator";
  const isOwn = current?.user.id === listing.seller_id;
  let availableKg = 0;
  if (approved && !isOwn) {
    const { data: avail } = await supabase.rpc("listing_available_kg", { l: listing.id });
    availableKg = Number(avail ?? 0);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 lg:px-8">
      <Link href="/marketplace" className="text-sm font-semibold text-forest-700 underline">
        ← All listings
      </Link>
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{listing.crops?.name ?? listing.crop_key}</Badge>
            {listing.quality_grade && <Badge tone="earth">Grade {listing.quality_grade}</Badge>}
            <Badge tone="grey">Approved listing</Badge>
          </div>
          <h1 className="text-3xl font-semibold text-forest-900">{listing.title}</h1>
          <p className="text-charcoal-500">
            {listing.district ? `${listing.district}, ` : ""}
            {listing.region}
            {listing.available_from ? ` · available from ${listing.available_from}` : ""}
          </p>
          {listing.description && <p className="whitespace-pre-wrap text-charcoal-700">{listing.description}</p>}
        </div>
        <Card className="space-y-1 lg:col-span-2">
          <p className="text-sm text-charcoal-500">Asking price</p>
          <p className="text-3xl font-semibold text-forest-800">
            GHS {Number(listing.price_per_kg_ghs).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            <span className="text-sm font-normal text-charcoal-500"> / kg</span>
          </p>
          <p className="pt-2 text-sm text-charcoal-500">Quantity available</p>
          <p className="text-xl font-semibold text-forest-900">{Number(listing.quantity_kg).toLocaleString("en-GB")} kg</p>
        </Card>
      </div>

      {approved && !isOwn && (
        <section aria-label="Place an order">
          <h2 className="mb-3 text-xl font-semibold text-forest-900">Place an order</h2>
          <Card>
            {availableKg > 0 ? (
              <OrderForm listingId={listing.id} pricePerKg={Number(listing.price_per_kg_ghs)} maxKg={availableKg} />
            ) : (
              <Alert tone="warning">All of the quantity on this listing is already committed to other orders.</Alert>
            )}
          </Card>
        </section>
      )}

      <section aria-label="Contact the seller">
        <h2 className="mb-3 text-xl font-semibold text-forest-900">Contact the seller</h2>
        <Card>
          {!current ? (
            <p className="text-charcoal-700">
              <Link href={`/login?next=/marketplace/${listing.id}`} className="font-semibold text-forest-700 underline">
                Sign in
              </Link>{" "}
              or{" "}
              <Link href="/register" className="font-semibold text-forest-700 underline">
                create an account
              </Link>{" "}
              to send an enquiry. Seller contact details are not shown publicly.
            </p>
          ) : isOwn ? (
            <Alert>This is your own listing.</Alert>
          ) : !approved ? (
            <Alert tone="warning">Your account must be approved before you can send enquiries.</Alert>
          ) : (
            <EnquiryForm listingId={listing.id} />
          )}
        </Card>
      </section>
    </div>
  );
}
