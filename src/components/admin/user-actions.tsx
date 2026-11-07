import { Button } from "@/components/ui/button";
import { ACCOUNT_TYPES, ROLE_LABELS } from "@/lib/config/roles";
import { reviewAccount, setAccountStatus, setRole } from "@/features/admin/actions";
import type { AdminUser } from "@/types/database";

const selectClass = "rounded-lg border border-charcoal-200 bg-white px-2 py-1.5 text-sm";

export function ApprovalActions({ user }: { user: AdminUser }) {
  const needsRole = user.role === "pending_review" && !user.requested_role;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {needsRole ? (
        <form action={setRole} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="approve" value="1" />
          <select name="role" className={selectClass} defaultValue="" required aria-label="Assign role">
            <option value="" disabled>
              Assign role…
            </option>
            {ACCOUNT_TYPES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <Button size="sm">Assign &amp; approve</Button>
        </form>
      ) : (
        <form action={reviewAccount}>
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="decision" value="approve" />
          <Button size="sm">Approve</Button>
        </form>
      )}
      {user.verification_status !== "rejected" && (
        <form action={reviewAccount}>
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="decision" value="reject" />
          <Button size="sm" variant="outline">
            Reject
          </Button>
        </form>
      )}
    </div>
  );
}

export function ManageActions({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  if (isSelf) return <span className="text-xs text-charcoal-500">This is you</span>;
  const approved = user.verification_status === "verified";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!approved && <ApprovalActions user={user} />}
      <form action={setRole} className="flex items-center gap-1">
        <input type="hidden" name="userId" value={user.id} />
        <select name="role" className={selectClass} defaultValue={user.role === "pending_review" ? "" : user.role} aria-label="Role">
          {user.role === "pending_review" && (
            <option value="" disabled>
              Pending
            </option>
          )}
          {ACCOUNT_TYPES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <Button size="sm" variant="ghost">
          Set role
        </Button>
      </form>
      <form action={setAccountStatus}>
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="status" value={user.account_status === "active" ? "suspended" : "active"} />
        <Button size="sm" variant="outline">
          {user.account_status === "active" ? "Suspend" : "Reinstate"}
        </Button>
      </form>
    </div>
  );
}
