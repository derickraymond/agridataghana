import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdvisoryForm } from "@/features/intelligence/intelligence-forms";
import { deleteAdvisory, setAdvisoryStatus } from "@/features/intelligence/actions";

export const metadata = { title: "Advisories (admin)" };

type Row = { id: string; title: string; body: string; category: string; region: string | null; status: string; created_at: string };

function Act({ id, status, label, variant = "primary" }: { id: string; status: string; label: string; variant?: "primary" | "outline" }) {
  return (
    <form action={setAdvisoryStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: crops }, { data }] = await Promise.all([
    supabase.from("crops").select("key, name").order("name"),
    supabase.from("advisories").select("id, title, body, category, region, status, created_at").order("created_at", { ascending: false }).limit(60),
  ]);
  const rows = (data as Row[] | null) ?? [];
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Advisories</h1>
        <p className="mt-1 text-charcoal-500">Publish farming advice and review submissions from extension agents. {pending} awaiting review.</p>
      </div>
      <Card>
        <h2 className="mb-4 text-xl font-semibold text-forest-900">Write an advisory</h2>
        <AdvisoryForm crops={(crops as { key: string; name: string }[] | null) ?? []} />
      </Card>
      <section aria-label="Advisories" className="space-y-3">
        {rows.length === 0 && <Card className="text-charcoal-500">No advisories yet.</Card>}
        {rows.map((r) => (
          <Card key={r.id} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-forest-900">{r.title}</p>
              <div className="flex gap-2">
                <Badge tone="grey">{r.category.replace("_", " ")}</Badge>
                <Badge tone={r.status === "published" ? "green" : r.status === "pending" ? "earth" : "grey"}>{r.status}</Badge>
              </div>
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap text-sm text-charcoal-700">{r.body}</p>
            <p className="text-xs text-charcoal-500">{r.region ?? "All regions"}</p>
            <div className="flex flex-wrap gap-2">
              {r.status !== "published" && <Act id={r.id} status="published" label="Publish" />}
              {r.status === "published" && <Act id={r.id} status="archived" label="Archive" variant="outline" />}
              <form action={deleteAdvisory}>
                <input type="hidden" name="id" value={r.id} />
                <Button size="sm" variant="outline">
                  Delete
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
