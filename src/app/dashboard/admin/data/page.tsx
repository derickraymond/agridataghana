import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { CropForm } from "@/features/admin-data/crop-form";

export const metadata = { title: "Agricultural data (admin)" };

export default async function Page() {
  await requireAdmin();
  const supabase = await createClient();
  const crops = ((await supabase.from("crops").select("key, name, category").order("category").order("name")).data ?? []) as { key: string; name: string; category: string }[];
  const categories = [...new Set(crops.map((c) => c.category))];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Agricultural data</h1>
        <p className="mt-1 text-charcoal-500">The crop list used across farms, listings, prices and traceability. Add a crop once and it appears everywhere.</p>
      </div>
      <Card>
        <h2 className="mb-3 font-semibold text-forest-900">Add a crop</h2>
        <CropForm categories={categories} />
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold text-forest-900">Crops ({crops.length})</h2>
        <div className="flex flex-wrap gap-2">
          {crops.map((c) => (
            <Badge key={c.key} tone="grey">{c.name} · {c.category.replace("_", " ")}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
