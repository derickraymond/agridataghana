import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reviewOrganization } from "@/features/organizations/actions";
import { formatDate } from "@/lib/admin/data";
import { ROLE_LABELS } from "@/lib/config/roles";

export const metadata = { title: "Organisations" };

type Org = { id: string; name: string; type: string; registration_number: string | null; region: string | null; district: string | null; verification_status: string; created_at: string };
const TONE = { verified: "green", pending: "earth", unverified: "grey", rejected: "red" } as const;

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(200);
  const orgs = (data as Org[] | null) ?? [];
  const pending = orgs.filter((o) => o.verification_status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Organisations</h1>
        <p className="mt-1 text-charcoal-500">
          Verify cooperatives, aggregators, dealers, buyers, processors and exporters. {pending.length} awaiting review.
        </p>
      </div>
      {orgs.length === 0 && <Card className="text-charcoal-500">No organisations registered yet.</Card>}
      {orgs.map((o) => (
        <Card key={o.id} className="space-y-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-forest-900">{o.name}</p>
            <Badge tone={TONE[o.verification_status as keyof typeof TONE] ?? "grey"}>{o.verification_status}</Badge>
          </div>
          <p className="text-sm text-charcoal-500">
            {ROLE_LABELS[o.type as keyof typeof ROLE_LABELS] ?? o.type} · {o.district ? `${o.district}, ` : ""}
            {o.region} · Reg. no. {o.registration_number ?? "not provided"} · {formatDate(o.created_at)}
          </p>
          <form action={reviewOrganization} className="flex gap-2">
            <input type="hidden" name="orgId" value={o.id} />
            {o.verification_status !== "verified" && (
              <Button size="sm" name="decision" value="verified">
                Verify
              </Button>
            )}
            {o.verification_status !== "rejected" && (
              <Button size="sm" variant="outline" name="decision" value="rejected">
                Reject
              </Button>
            )}
          </form>
        </Card>
      ))}
    </div>
  );
}
