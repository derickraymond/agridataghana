import { requireRole } from "@/lib/auth/session";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";

export const metadata = { title: "Cooperative dashboard" };

export default async function Page() {
  const { profile } = await requireRole(["cooperative", "aggregator"]);
  return <RoleDashboard profile={profile} role={profile.role} />;
}
