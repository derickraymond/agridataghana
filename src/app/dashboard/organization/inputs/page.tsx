import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Alert, Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { InputForm } from "@/features/organizations/organization-forms";
import { updateInput } from "@/features/organizations/actions";

export const metadata = { title: "Input catalogue" };

type Input = { id: string; name: string; category: string; unit: string; price_ghs: number; stock_quantity: number; status: string };

export default async function Page() {
  await requireRole(["agro_dealer"]);
  const supabase = await createClient();
  const { data: orgs } = await supabase.from("organizations").select("id, verification_status").is("deleted_at", null).limit(1);
  const org = orgs?.[0];
  if (!org) redirect("/dashboard/organization");
  const { data } = await supabase.from("agro_inputs").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
  const items = (data as Input[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">Input catalogue</h1>
          <p className="mt-1 text-charcoal-500">Seeds, fertilisers, chemicals, tools and equipment you sell.</p>
        </div>
        <ButtonLink href="/dashboard/organization" variant="outline" size="sm">
          Organisation
        </ButtonLink>
      </div>
      {org.verification_status !== "verified" && (
        <Alert tone="warning">Products are saved but only appear in the public catalogue once an administrator verifies your organisation.</Alert>
      )}
      <section className="space-y-3" aria-label="Products">
        {items.length === 0 && <Card className="text-charcoal-500">No products yet.</Card>}
        {items.map((p) => (
          <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-forest-900">{p.name}</p>
              <p className="text-sm text-charcoal-500">
                {p.category} · GHS {Number(p.price_ghs).toFixed(2)} per {p.unit} · {Number(p.stock_quantity)} in stock
              </p>
            </div>
            <form action={updateInput} className="flex items-center gap-2">
              <input type="hidden" name="id" value={p.id} />
              <Badge tone={p.status === "active" ? "green" : "grey"}>{p.status}</Badge>
              <Button size="sm" variant="outline" name="intent" value={p.status === "active" ? "deactivate" : "activate"}>
                {p.status === "active" ? "Hide" : "Show"}
              </Button>
              <Button size="sm" variant="outline" name="intent" value="delete">
                Delete
              </Button>
            </form>
          </Card>
        ))}
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold text-forest-900">Add a product</h2>
        <Card>
          <InputForm orgId={org.id} />
        </Card>
      </section>
    </div>
  );
}
