import { requireAdmin } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Reports (admin)" };

const EXPORTS: [string, string, string][] = [
  ["users", "Users", "Accounts, roles and approval status."],
  ["listings", "Listings", "Marketplace listings and moderation status."],
  ["orders", "Orders", "Orders, totals and payment records."],
  ["harvests", "Harvests", "Recorded harvest quantities."],
  ["prices", "Commodity prices", "Published market prices with sources."],
  ["audit", "Activity log", "Audit trail of platform events."],
];

export default async function Page() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Reports and exports</h1>
        <p className="mt-1 text-charcoal-500">Download CSV files (up to 10,000 most recent rows). Every export is recorded in the activity log. Exports can contain personal data; handle them accordingly.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORTS.map(([type, title, desc]) => (
          <Card key={type} className="flex flex-col justify-between gap-3">
            <div>
              <h2 className="font-semibold text-forest-900">{title}</h2>
              <p className="mt-1 text-sm text-charcoal-500">{desc}</p>
            </div>
            {/* Plain anchor so Next never prefetches (and logs) the export. */}
            <a
              href={`/dashboard/admin/export?type=${type}`}
              className="inline-flex items-center justify-center rounded-lg border border-forest-700 px-3 py-1.5 text-sm font-semibold text-forest-700 hover:bg-forest-50"
            >
              Download CSV
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
