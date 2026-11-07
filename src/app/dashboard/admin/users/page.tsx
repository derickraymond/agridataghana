import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, Card } from "@/components/ui/card";
import { ManageActions } from "@/components/admin/user-actions";
import { formatDate, listAdminUsers } from "@/lib/admin/data";
import { ACCOUNT_TYPES, ROLE_LABELS } from "@/lib/config/roles";

export const metadata = { title: "Users" };

type Search = { q?: string; role?: string; status?: string; page?: string };

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  const { user: me } = await requireAdmin();
  const sp = await searchParams;
  const role = sp.role && (sp.role === "pending_review" || (ACCOUNT_TYPES as readonly string[]).includes(sp.role)) ? sp.role : undefined;
  const status = sp.status === "active" || sp.status === "suspended" ? sp.status : undefined;
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const { users, total, pageSize } = await listAdminUsers({ q: sp.q?.slice(0, 80), role, status, page });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/dashboard/admin/users?${params}`;
  };
  const field = "rounded-lg border border-charcoal-200 bg-white px-3 py-2 text-sm";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900">Users</h1>
        <p className="mt-1 text-charcoal-500">{total} accounts. Every change you make here is recorded in the activity log.</p>
      </div>

      <form className="flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Search name, phone or location" className={`${field} min-w-56 flex-1`} />
        <select name="role" defaultValue={role ?? ""} className={field} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="pending_review">Pending approval</option>
          {ACCOUNT_TYPES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className={field} aria-label="Filter by status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800">Filter</button>
      </form>

      <div className="space-y-3">
        {users.length === 0 && <Card className="text-charcoal-500">No users match these filters.</Card>}
        {users.map((u) => (
          <Card key={u.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-forest-900">{u.full_name}</p>
                <p className="truncate text-sm text-charcoal-500">{u.email ?? "email unavailable"}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge>{ROLE_LABELS[u.role]}</Badge>
                <Badge tone={u.verification_status === "verified" ? "green" : u.verification_status === "rejected" ? "red" : "earth"}>
                  {u.verification_status === "verified" ? "Approved" : u.verification_status === "rejected" ? "Rejected" : "Awaiting approval"}
                </Badge>
                {u.account_status === "suspended" && <Badge tone="red">Suspended</Badge>}
              </div>
            </div>
            <p className="text-xs text-charcoal-500">
              Registered {formatDate(u.created_at)} · Last sign-in {formatDate(u.last_sign_in_at)}
              {u.location ? ` · ${u.location}` : ""}
            </p>
            <ManageActions user={u} isSelf={u.id === me.id} />
          </Card>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={qs(page - 1)} className="font-medium text-forest-700">← Previous</Link> : <span />}
          <span className="text-charcoal-500">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={qs(page + 1)} className="font-medium text-forest-700">Next →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
