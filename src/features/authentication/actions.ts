"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";
import { isSupabaseConfigured, siteUrl } from "@/lib/config/env";
import { contactSchema, forgotSchema, loginSchema, registerSchema, resetSchema } from "@/lib/validation/schemas";

export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

const NOT_CONFIGURED: FormState = {
  error: "The platform database is not configured yet. Add the Supabase environment variables to enable this feature.",
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "form");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
      data: {
        full_name: d.full_name,
        phone: d.phone,
        location: d.location,
        account_type: d.account_type,
        consent_terms: "true",
        consent_marketing: d.consent_marketing === "on" ? "true" : "false",
      },
    },
  });

  if (error) {
    // Surface actionable causes instead of one generic message.
    if (error.code === "over_email_send_rate_limit" || error.status === 429)
      return { error: "Too many sign-up emails were sent recently. Please wait a few minutes and try again." };
    if (error.code === "user_already_exists" || error.code === "email_exists")
      return { error: "An account with this email already exists. Try logging in instead." };
    if (error.code === "weak_password") return { error: "That password is too weak. Use at least 10 characters with letters and numbers." };
    return { error: "We could not create your account. Please check your details and try again." };
  }
  if (data.session) redirect("/dashboard");
  return { success: "Account created. Check your email and follow the verification link to activate your account." };
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const unconfirmed = error.code === "email_not_confirmed";
    return { error: unconfirmed ? "Please verify your email address before signing in." : "Invalid email or password." };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile && profile.role === "administrator") {
    redirect("/dashboard/admin");
  }

  redirect(safeNext(formData.get("next")));
}

export async function signInAdmin(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const unconfirmed = error.code === "email_not_confirmed";
    return { error: unconfirmed ? "Please verify your email address before signing in." : "Invalid email or password." };
  }

  const { data: profile } = await supabase.from("profiles").select("role, verification_status, account_status").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.role !== "administrator") {
    return { error: "This account does not have administrator access." };
  }
  if (profile.account_status === "suspended") {
    return { error: "This administrator account is suspended. Contact the platform owner." };
  }
  redirect(safeNext(formData.get("next")) ?? "/dashboard/admin");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });
  // Same response whether or not the account exists, to prevent account enumeration.
  return { success: "If an account exists for that email, a password reset link has been sent." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Your reset link may have expired. Request a new one and try again." };
  redirect("/dashboard");
}

export async function submitContact(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert(parsed.data);
  if (error) return { error: "Your message could not be sent. Please try again later." };
  return { success: "Thank you. Your message has been received and our team will respond by email." };
}
