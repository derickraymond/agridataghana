import Link from "next/link";
import { Alert } from "@/components/ui/card";
import { AdminLoginForm } from "@/features/authentication/admin-login-form";
import { isSupabaseConfigured } from "@/lib/config/env";
import { safeNext } from "@/lib/auth/redirect";

export const metadata = { title: "Admin login" };

const ERRORS: Record<string, string> = {
  not_configured: "The platform database is not configured yet, so admin sign-in is unavailable.",
  link_invalid: "That verification or reset link is invalid or has expired. Please try again.",
  no_profile: "We could not load your profile. Please contact support.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div>
      <h1 className="text-3xl font-semibold text-forest-900">Admin sign in</h1>
      <p className="mt-2 text-sm text-charcoal-500">Use your administrator credentials to access the management dashboard.</p>
      <div className="mt-6 space-y-4">
        {!isSupabaseConfigured && <Alert tone="warning">Supabase is not configured in this environment. Admin sign-in is pending configuration.</Alert>}
        {error && ERRORS[error] && <Alert tone="error">{ERRORS[error]}</Alert>}
        <AdminLoginForm next={next ? safeNext(next) : "/dashboard/admin"} />
      </div>
      <p className="mt-6 text-center text-sm text-charcoal-700">
        Not an admin?{" "}
        <Link href="/login" className="font-semibold text-forest-700 hover:underline">
          Back to user login
        </Link>
      </p>
    </div>
  );
}
