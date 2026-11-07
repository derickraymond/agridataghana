import Link from "next/link";
import { Alert } from "@/components/ui/card";
import { RegisterForm } from "@/features/authentication/register-form";
import { isSupabaseConfigured } from "@/lib/config/env";

export const metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-forest-900">Create your account</h1>
      <p className="mt-2 text-sm text-charcoal-500">Join Ghana&apos;s agricultural data and marketplace platform.</p>
      <div className="mt-6 space-y-4">
        {!isSupabaseConfigured && <Alert tone="warning">Supabase is not configured in this environment. Registration is pending configuration.</Alert>}
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-charcoal-700">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-forest-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
