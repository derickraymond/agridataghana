import Link from "next/link";
import { Alert } from "@/components/ui/card";
import { LoginForm } from "@/features/authentication/login-form";
import { isSupabaseConfigured } from "@/lib/config/env";
import { safeNext } from "@/lib/auth/redirect";

export const metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  not_configured: "The platform database is not configured yet, so sign-in is unavailable.",
  link_invalid: "That verification or reset link is invalid or has expired. Please try again.",
  no_profile: "We could not load your profile. Please contact support.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div>
      <h1 className="text-3xl font-semibold text-forest-900">Welcome back</h1>
      <p className="mt-2 text-sm text-charcoal-500">Log in to your AgriData Ghana account.</p>
      <div className="mt-6 space-y-4">
        {!isSupabaseConfigured && <Alert tone="warning">Supabase is not configured in this environment. Sign-in is pending configuration.</Alert>}
        {error && ERRORS[error] && <Alert tone="error">{ERRORS[error]}</Alert>}
        <LoginForm next={next ? safeNext(next) : undefined} />
      </div>
      <p className="mt-6 text-center text-sm text-charcoal-700">
        New to AgriData Ghana?{" "}
        <Link href="/register" className="font-semibold text-forest-700 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-charcoal-700">
        Admin access?{" "}
        <Link href="/admin/login" className="font-semibold text-forest-700 hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
