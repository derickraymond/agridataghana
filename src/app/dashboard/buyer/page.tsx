import { requireRole } from "@/lib/auth/session";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";

export const metadata = { title: "Buyer dashboard" };

export default async function Page() {
  const { profile } = await requireRole(["buyer", "processor", "exporter"]);
  return <RoleDashboard profile={profile} role={profile.role} />;
}
