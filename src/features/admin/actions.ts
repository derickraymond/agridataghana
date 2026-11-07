"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ACCOUNT_TYPES } from "@/lib/config/roles";

const idSchema = z.string().uuid();

async function adminContext() {
  const { user } = await requireAdmin();
  return { supabase: await createClient(), adminId: user.id };
}

function done() {
  revalidatePath("/dashboard/admin", "layout");
}

// Approve or reject a registration. Approving a pending privileged request grants the role the user asked for.
export async function reviewAccount(formData: FormData) {
  const { supabase, adminId } = await adminContext();
  const id = idSchema.safeParse(formData.get("userId"));
  const decision = z.enum(["approve", "reject"]).safeParse(formData.get("decision"));
  if (!id.success || !decision.success || id.data === adminId) return;

  const { data: target } = await supabase.from("profiles").select("role, requested_role").eq("id", id.data).maybeSingle();
  if (!target) return;

  const update: Record<string, string> =
    decision.data === "approve" ? { verification_status: "verified" } : { verification_status: "rejected" };
  if (decision.data === "approve" && target.role === "pending_review" && target.requested_role) {
    update.role = target.requested_role;
  }
  await supabase.from("profiles").update(update).eq("id", id.data);
  done();
}

export async function setAccountStatus(formData: FormData) {
  const { supabase, adminId } = await adminContext();
  const id = idSchema.safeParse(formData.get("userId"));
  const status = z.enum(["active", "suspended"]).safeParse(formData.get("status"));
  if (!id.success || !status.success || id.data === adminId) return;
  await supabase.from("profiles").update({ account_status: status.data }).eq("id", id.data);
  done();
}

export async function setRole(formData: FormData) {
  const { supabase, adminId } = await adminContext();
  const id = idSchema.safeParse(formData.get("userId"));
  const role = z.enum(ACCOUNT_TYPES).safeParse(formData.get("role"));
  if (!id.success || !role.success || id.data === adminId) return;
  const update: Record<string, string> = { role: role.data };
  if (formData.get("approve") === "1") update.verification_status = "verified";
  await supabase.from("profiles").update(update).eq("id", id.data);
  done();
}

export type UserFormState = { error?: string; success?: string };

const createUserSchema = z.object({
  full_name: z.string().trim().min(2, "Enter the full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z.string().min(10, "Password must be at least 10 characters").max(72),
  phone: z.string().trim().max(20).regex(/^(\+?[0-9 ]{7,20})?$/, "Enter a valid phone number"),
  role: z.enum(ACCOUNT_TYPES, { message: "Choose a role" }),
});

export async function createUser(_: UserFormState, formData: FormData): Promise<UserFormState> {
  const { supabase } = await adminContext();
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const d = parsed.data;
  const { error } = await supabase.rpc("admin_create_user", {
    p_email: d.email,
    p_password: d.password,
    p_full_name: d.full_name,
    p_role: d.role,
    p_phone: d.phone || null,
  });
  if (error) return { error: error.code === "23505" ? "An account with this email already exists." : "We could not create the account." };
  done();
  return { success: `Account created for ${d.email}. Share the password securely; they can change it after signing in.` };
}

export async function deleteUser(formData: FormData) {
  const { supabase } = await adminContext();
  const id = idSchema.safeParse(formData.get("userId"));
  if (!id.success) return;
  const { error } = await supabase.rpc("admin_delete_user", { p_user: id.data });
  if (error) {
    redirect(`/dashboard/admin/users?error=${encodeURIComponent(error.code === "23503" ? "This user has records (farms, orders…). Suspend the account instead." : error.message)}`);
  }
  done();
  redirect("/dashboard/admin/users?deleted=1");
}

export async function markMessageHandled(formData: FormData) {
  const { supabase } = await adminContext();
  const id = idSchema.safeParse(formData.get("messageId"));
  const handled = formData.get("handled") === "true";
  if (!id.success) return;
  await supabase.from("contact_messages").update({ handled }).eq("id", id.data);
  done();
}
