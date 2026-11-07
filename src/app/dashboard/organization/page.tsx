import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Alert, Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { AddMemberForm, OrganizationForm } from "@/features/organizations/organization-forms";
import { removeMember } from "@/features/organizations/actions";
import { BUSINESS_ROLES } from "@/features/organizations/constants";
import { formatDate } from "@/lib/admin/data";
import { ROLE_DASHBOARD, ROLE_LABELS } from "@/lib/config/roles";

export const metadata = { title: "My organisation" };

type Org = { id: string; name: string; type: string; registration_number: string | null; region: string | null; district: string | null; verification_status: string; created_by: string };
type Member = { user_id: string; full_name: string; member_role: string; joined_at: string };

const TONE = { verified: "green", pending: "earth", unverified: "grey", rejected: "red" } as const;

export default async function Page() {
  const { profile } = await requireRole(BUSINESS_ROLES);
  const supabase = await createClient();
  const { data: orgs } = await supabase.from("organizations").select("*").is("deleted_at", null).limit(1);
  const org = ((orgs as Org[] | null) ?? [])[0];

  const members: Member[] = org ? (((await supabase.rpc("org_member_list", { org: org.id })).data as Member[] | null) ?? []) : [];
  const me = members.find((m) => m.user_id === profile.id);
  const isManager = me?.member_role === "manager";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">My organisation</h1>
          <p className="mt-1 text-charcoal-500">{ROLE_LABELS[profile.role]} profile, verification and members.</p>
        </div>
        <div className="flex gap-2">
          {profile.role === "agro_dealer" && org && (
            <ButtonLink href="/dashboard/organization/inputs" variant="outline" size="sm">
              Input catalogue
            </ButtonLink>
          )}
          <ButtonLink href={ROLE_DASHBOARD[profile.role]} variant="outline" size="sm">
            Dashboard
          </ButtonLink>
        </div>
      </div>

      {!org ? (
        <section>
          <h2 className="mb-3 text-xl font-semibold text-forest-900">Register your organisation</h2>
          <Card>
            <p className="mb-4 text-sm text-charcoal-500">
              Your organisation is created as a {ROLE_LABELS[profile.role].toLowerCase()} and reviewed by an administrator before it is verified.
            </p>
            <OrganizationForm />
          </Card>
        </section>
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-forest-900">{org.name}</p>
              <p className="text-sm text-charcoal-500">
                {ROLE_LABELS[org.type as keyof typeof ROLE_LABELS] ?? org.type} · {org.district ? `${org.district}, ` : ""}
                {org.region}
              </p>
            </div>
            <Badge tone={TONE[org.verification_status as keyof typeof TONE] ?? "grey"}>
              {org.verification_status === "verified" ? "Verified" : `Verification ${org.verification_status}`}
            </Badge>
          </Card>
          {org.verification_status !== "verified" && (
            <Alert tone="warning">
              {org.verification_status === "rejected"
                ? "Your organisation was not verified. Contact support for details."
                : "Your organisation is awaiting administrator verification. Some features, such as the public input catalogue, stay hidden until it is verified."}
            </Alert>
          )}

          {isManager && (
            <section>
              <h2 className="mb-3 text-xl font-semibold text-forest-900">Organisation details</h2>
              <Card>
                <OrganizationForm org={org} />
              </Card>
            </section>
          )}

          <section className="space-y-3" aria-label="Members">
            <h2 className="text-xl font-semibold text-forest-900">Members ({members.length})</h2>
            {members.map((m) => (
              <Card key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium text-forest-900">{m.full_name}</p>
                  <p className="text-xs text-charcoal-500">Joined {formatDate(m.joined_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={m.member_role === "manager" ? "green" : "grey"}>{m.member_role}</Badge>
                  {isManager && m.user_id !== profile.id && (
                    <form action={removeMember}>
                      <input type="hidden" name="org" value={org.id} />
                      <input type="hidden" name="userId" value={m.user_id} />
                      <Button size="sm" variant="outline">
                        Remove
                      </Button>
                    </form>
                  )}
                </div>
              </Card>
            ))}
            {isManager && (
              <Card>
                <h3 className="mb-3 font-semibold text-forest-900">Add a member</h3>
                <AddMemberForm orgId={org.id} />
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
