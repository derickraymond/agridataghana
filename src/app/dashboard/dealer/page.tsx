import { requireRole } from "@/lib/auth/session";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";

export const metadata = { title: "Agro-dealer dashboard" };

export default async function Page() {
  const { profile } = await requireRole(["agro_dealer"]);
  return <RoleDashboard profile={profile} role="agro_dealer" />;
}
