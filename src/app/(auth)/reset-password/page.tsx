import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/authentication/password-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // The recovery link signs the user in via /auth/callback; without a session there is nothing to reset.
  const current = await getCurrentUser();
  if (!current) redirect("/forgot-password");
  return (
    <div>
      <h1 className="text-3xl font-semibold text-forest-900">Choose a new password</h1>
      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
