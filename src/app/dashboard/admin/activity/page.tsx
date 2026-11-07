import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui/card";
import { formatDate } from "@/lib/admin/data";
import type { AuditLog } from "@/types/database";

export const metadata = { title: "Activity log" };

const PAGE = 40;
const ENTITIES = ["profile", "organization", "contact_message", "farm", "harvest", "listing", "enquiry", "order", "price", "advisory", "batch", "export"];

const ACTION_LABELS: Record<string, string> = {
  "user.registered": "New registration",
  "profile.privileged_change": "Account changed by administrator",
  "contact.received": "Contact message received",
  "organization.created": "Organisation created",
  "farm.created": "Farm registered",
  "harvest.recorded": "Harvest recorded",
  "listing.submitted": "Listing submitted",
  "listing.active": "Listing approved",
  "listing.rejected": "Listing rejected",
  "listing.sold": "Listing marked sold",
  "listing.withdrawn": "Listing withdrawn",
  "enquiry.sent": "Enquiry sent",
  "order.placed": "Order placed",
  "order.accepted": "Order accepted",
  "order.rejected": "Order rejected",
  "order.dispatched": "Order dispatched",
  "order.delivered": "Order delivered",
  "order.completed": "Order completed",
  "order.cancelled": "Order cancelled",
  "order.payment_recorded": "Payment recorded",
  "price.published": "Price published",
  "batch.created": "Batch created",
  "batch.event": "Batch event recorded",
  "user.created": "Account created by admin",
  "user.deleted": "Account deleted",
  "export.users": "Users exported",
  "export.listings": "Listings exported",
  "export.orders": "Orders exported",
  "export.harvests": "Harvests exported",
  "export.prices": "Prices exported",
  "export.audit": "Activity log exported",
  "advisory.submitted": "Advisory submitted",
  "advisory.published": "Advisory published",
  "advisory.archived": "Advisory archived",
  "organization.verified": "Organisation verified",
  "organization.rejected": "Organisation rejected",
  "organization.pending": "Organisation set to pending",
};

function describe(log: AuditLog) {
  const d = log.details as Record<string, unknown>;
  if (log.action === "profile.privileged_change") {
    return (["role", "account_status", "verification_status"] as const)
      .map((k) => {
        const pair = d[k] as [string, string] | undefined;
        return pair && pair[0] !== pair[1] ? `${k.replace("_", " ")}: ${pair[0]} → ${pair[1]}` : null;
      })
      .filter(Boolean)
      .join(" · ");
  }
  if (log.action === "user.registered") return `Role ${String(d.role)}${d.requested_role ? `, requested ${String(d.requested_role)}` : ""}`;
  if (log.action === "contact.received") return String(d.subject ?? "");
  if (log.action === "organization.created") return `${String(d.name)} (${String(d.type)})`;
  if (log.action === "farm.created") return `${String(d.name)}, ${String(d.region)} · ${String(d.size_hectares)} ha`;
  if (log.action === "harvest.recorded") return `${String(d.quantity_kg)} kg`;
  if (log.action === "order.placed") return `${String(d.title)} · ${String(d.quantity_kg)} kg · GHS ${String(d.total_ghs)}`;
  if (log.action.startsWith("order.")) return String(d.title ?? "");
  if (log.action === "price.published") return `${String(d.crop)} · ${String(d.region)} · GHS ${String(d.price)}/kg`;
  if (log.action.startsWith("batch.")) return String(d.code ?? "");
  if (log.action.startsWith("advisory.")) return String(d.title ?? "");
  return "";
}

export default async function Page({ searchParams }: { searchParams: Promise<{ entity?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const entity = sp.entity && ENTITIES.includes(sp.entity) ? sp.entity : undefined;
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const supabase = await createClient();

  let q = supabase.from("audit_logs").select("*", { count: "exact" });
  if (entity) q = q.eq("entity_type", entity);
  const { data, count } = await q.order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  const logs = (data as AuditLog[] | null) ?? [];

  const ids = [...new Set(logs.flatMap((l) => [l.actor_id, l.entity_type === "profile" ? l.entity_id : null]).filter(Boolean))] as string[];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const names = new Map((people ?? []).map((p) => [p.id as string, p.full_name as string]));
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const href = (p: number, e = entity) => `/dashboard/admin/activity?${new URLSearchParams({ ...(e ? { entity: e } : {}), page: String(p) })}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Activity log</h1>
        <p className="mt-1 text-charcoal-500">
          A record of registrations, approvals, role and status changes, messages and organisations. {count ?? 0} events.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {[undefined, ...ENTITIES].map((e) => (
          <Link
            key={e ?? "all"}
            href={href(1, e)}
            className={`rounded-full px-3 py-1 ${e === entity ? "bg-forest-700 text-white" : "bg-white text-charcoal-700 ring-1 ring-charcoal-200"}`}
          >
            {e ? e.replace("_", " ") : "All"}
          </Link>
        ))}
      </div>
      <Card className="divide-y divide-charcoal-100 p-0">
        {logs.length === 0 && <p className="p-6 text-charcoal-500">No activity recorded yet.</p>}
        {logs.map((l) => (
          <div key={l.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-forest-900">{ACTION_LABELS[l.action] ?? l.action}</p>
              <p className="text-sm text-charcoal-500">
                {l.entity_type === "profile" && l.entity_id ? `${names.get(l.entity_id) ?? "Unknown user"} · ` : ""}
                {describe(l)}
              </p>
              <p className="text-xs text-charcoal-500">By {l.actor_id ? (names.get(l.actor_id) ?? "Unknown user") : "Public visitor / system"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="grey">{l.entity_type.replace("_", " ")}</Badge>
              <span className="text-xs text-charcoal-500">{formatDate(l.created_at)}</span>
            </div>
          </div>
        ))}
      </Card>
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="font-medium text-forest-700">← Newer</Link> : <span />}
          <span className="text-charcoal-500">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="font-medium text-forest-700">Older →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
