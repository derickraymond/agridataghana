import { requireAdmin } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";
import { countProfiles } from "@/lib/admin/data";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const pending = await countProfiles({}, true);
  return (
    <div className="space-y-6">
      <AdminNav pendingCount={pending} />
      {children}
    </div>
  );
}
