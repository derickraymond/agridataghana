import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Alert } from "@/components/ui/card";
import { ROLE_DASHBOARD, ROLE_LABELS } from "@/lib/config/roles";

export const metadata = { title: "Account pending approval" };

export default async function Page() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const profile = current.profile;
  if (!profile) redirect("/login?error=no_profile");
  if (profile.account_status === "suspended") redirect("/dashboard/suspended");
  if (profile.role === "administrator" || (profile.role !== "pending_review" && profile.verification_status === "verified")) {
    redirect(ROLE_DASHBOARD[profile.role]);
  }

  if (profile.verification_status === "rejected") {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold text-forest-900">Your account was not approved</h1>
        <Alert tone="error">
          An administrator reviewed your registration and could not approve it. If you think this is a mistake, please contact us from
          the Help page.
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold text-forest-900">Your account is awaiting approval</h1>
      <Alert tone="info">
        {profile.requested_role
          ? `You registered as ${ROLE_LABELS[profile.requested_role]}. An administrator must review and approve your account before you can use your dashboard.`
          : "An administrator must review your registration and assign your account type before you can use a dashboard."}{" "}
        Check back after a decision has been made; you can sign in again at any time.
      </Alert>
    </div>
  );
}
