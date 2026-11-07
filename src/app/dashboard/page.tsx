import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_DASHBOARD } from "@/lib/config/roles";

export const dynamic = "force-dynamic";

// Sends each signed-in user to the dashboard for their granted role.
export default async function DashboardIndex() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.profile) redirect("/login?error=no_profile");
  if (current.profile.account_status === "suspended") redirect("/dashboard/suspended");
  redirect(ROLE_DASHBOARD[current.profile.role]);
}
