import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Alert } from "@/components/ui/card";

export const metadata = { title: "Account suspended" };

export default async function Page() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.profile?.account_status !== "suspended") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold text-forest-900">Account suspended</h1>
      <Alert tone="error">
        Your account has been suspended. To appeal or recover your account, please contact support through the Contact page.
      </Alert>
    </div>
  );
}
