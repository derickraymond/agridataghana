import Link from "next/link";
import { ForgotPasswordForm } from "@/features/authentication/password-forms";

export const metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-forest-900">Forgot your password?</h1>
      <p className="mt-2 text-sm text-charcoal-500">Enter your email and we will send you a reset link.</p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-forest-700 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
