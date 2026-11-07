import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Alert, Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { ListingForm } from "@/features/marketplace/marketplace-forms";
import { closeListing } from "@/features/marketplace/actions";
import { ROLE_DASHBOARD } from "@/lib/config/roles";
import type { Listing } from "@/types/database";

export const metadata = { title: "My listings" };

const TONE = { pending: "earth", active: "green", rejected: "red", sold: "grey", withdrawn: "grey" } as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { profile } = await requireRole(["farmer", "cooperative", "aggregator"]);
  const { submitted } = await searchParams;
  const supabase = await createClient();
  const [l, c] = await Promise.all([
    supabase.from("listings").select("*, crops(name)").eq("seller_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("crops").select("key, name").order("name"),
  ]);
  const listings = (l.data as unknown as Listing[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">My listings</h1>
          <p className="mt-1 text-charcoal-500">Publish produce for sale. Listings go live after administrator approval.</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/dashboard/enquiries" variant="outline" size="sm">
            Enquiries
          </ButtonLink>
          <ButtonLink href={ROLE_DASHBOARD[profile.role]} variant="outline" size="sm">
            Dashboard
          </ButtonLink>
        </div>
      </div>
      {submitted && <Alert tone="success">Listing submitted. It will appear in the marketplace once approved.</Alert>}

      <section aria-label="Your listings" className="space-y-3">
        {listings.length === 0 && <Card className="text-charcoal-500">You have no listings yet. Create your first one below.</Card>}
        {listings.map((x) => (
          <Card key={x.id} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-forest-900">{x.title}</p>
              <Badge tone={TONE[x.status]}>{x.status}</Badge>
            </div>
            <p className="text-sm text-charcoal-500">
              {x.crops?.name} · {Number(x.quantity_kg).toLocaleString("en-GB")} kg · GHS {Number(x.price_per_kg_ghs).toFixed(2)}/kg · {x.region}
            </p>
            {x.status === "rejected" && x.moderation_note && <Alert tone="warning">Administrator note: {x.moderation_note}</Alert>}
            {(x.status === "pending" || x.status === "active") && (
              <form action={closeListing} className="flex gap-2">
                <input type="hidden" name="listingId" value={x.id} />
                {x.status === "active" && (
                  <Button size="sm" variant="outline" name="status" value="sold">
                    Mark as sold
                  </Button>
                )}
                <Button size="sm" variant="outline" name="status" value="withdrawn">
                  Withdraw
                </Button>
              </form>
            )}
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-forest-900">Create a listing</h2>
        <Card>
          <ListingForm crops={c.data ?? []} />
        </Card>
      </section>
    </div>
  );
}
