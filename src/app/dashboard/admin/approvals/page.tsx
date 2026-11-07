import { requireAdmin } from "@/lib/auth/session";
import { Badge, Card } from "@/components/ui/card";
import { ApprovalActions } from "@/components/admin/user-actions";
import { formatDate, listAdminUsers } from "@/lib/admin/data";
import { ROLE_LABELS } from "@/lib/config/roles";

export const metadata = { title: "Account approvals" };

export default async function Page() {
  const { user: me } = await requireAdmin();
  const { users, total } = await listAdminUsers({ verification: ["unverified", "pending"], pageSize: 100 });
  const queue = users.filter((u) => u.id !== me.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Account approvals</h1>
        <p className="mt-1 text-charcoal-500">
          New registrations stay locked out of their dashboards until you approve them. {total} awaiting review.
        </p>
      </div>
      {queue.length === 0 ? (
        <Card className="text-charcoal-500">No accounts are waiting for approval.</Card>
      ) : (
        <div className="space-y-3">
          {queue.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-semibold text-forest-900">{u.full_name}</p>
                <p className="truncate text-sm text-charcoal-500">
                  {u.email ?? "email unavailable"}
                  {u.phone ? ` · ${u.phone}` : ""}
                  {u.location ? ` · ${u.location}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone="earth">
                    {u.requested_role ? `Requested: ${ROLE_LABELS[u.requested_role]}` : u.role === "pending_review" ? "No role chosen" : ROLE_LABELS[u.role]}
                  </Badge>
                  <Badge tone={u.email_confirmed_at ? "green" : "grey"}>{u.email_confirmed_at ? "Email confirmed" : "Email not confirmed"}</Badge>
                  <span className="text-charcoal-500">Registered {formatDate(u.created_at)}</span>
                </div>
              </div>
              <ApprovalActions user={u} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
