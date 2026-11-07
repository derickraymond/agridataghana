import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { AdvisoryForm } from "@/features/intelligence/intelligence-forms";

export const metadata = { title: "My advisories" };

type Row = { id: string; title: string; category: string; region: string | null; status: string };

export default async function Page() {
  const { user } = await requireRole(["extension_agent"]);
  const supabase = await createClient();
  const [{ data: crops }, { data }] = await Promise.all([
    supabase.from("crops").select("key, name").order("name"),
    supabase.from("advisories").select("id, title, category, region, status").eq("author_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);
  const rows = (data as Row[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">My advisories</h1>
          <p className="mt-1 text-charcoal-500">Submit farming advice. An administrator reviews it before it is published.</p>
        </div>
        <ButtonLink href="/dashboard/extension" variant="outline" size="sm">
          Dashboard
        </ButtonLink>
      </div>
      <Card>
        <h2 className="mb-4 text-xl font-semibold text-forest-900">Write an advisory</h2>
        <AdvisoryForm crops={(crops as { key: string; name: string }[] | null) ?? []} />
      </Card>
      <section aria-label="Submitted advisories" className="space-y-3">
        <h2 className="text-xl font-semibold text-forest-900">Submitted ({rows.length})</h2>
        {rows.length === 0 && <Card className="text-charcoal-500">You have not submitted any advisories.</Card>}
        {rows.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="font-semibold text-forest-900">{r.title}</p>
              <p className="text-xs text-charcoal-500">
                {r.category.replace("_", " ")} · {r.region ?? "All regions"}
              </p>
            </div>
            <Badge tone={r.status === "published" ? "green" : r.status === "pending" ? "earth" : "grey"}>{r.status === "pending" ? "awaiting review" : r.status}</Badge>
          </Card>
        ))}
      </section>
    </div>
  );
}
