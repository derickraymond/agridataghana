import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config/env";
import { ROLE_DASHBOARD, type UserRole } from "@/lib/config/roles";
import type { Profile } from "@/types/database";

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile: profile as Profile | null };
}

// Guards a dashboard page: requires sign-in, an active account and (optionally) specific roles.
export async function requireRole(allowed: UserRole[]) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const { user, profile } = current;
  if (!profile) redirect("/login?error=no_profile");
  if (profile.account_status === "suspended") redirect("/dashboard/suspended");
  // Every non-administrator account must be approved by an administrator before using a dashboard.
  if (profile.role !== "administrator" && profile.verification_status !== "verified") redirect("/dashboard/pending");
  if (!allowed.includes(profile.role)) redirect(ROLE_DASHBOARD[profile.role]);
  return { user, profile };
}

export async function requireAdmin() {
  return requireRole(["administrator"]);
}
