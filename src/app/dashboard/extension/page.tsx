import { requireRole } from "@/lib/auth/session";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";

export const metadata = { title: "Extension agent dashboard" };

export default async function Page() {
  const { profile } = await requireRole(["extension_agent"]);
  return <RoleDashboard profile={profile} role="extension_agent" />;
}
