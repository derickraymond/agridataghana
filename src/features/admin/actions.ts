"use server";

import { revalidatePath } from "next/cache";
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

export async function markMessageHandled(formData: FormData) {
  const { supabase } = await adminContext();
  const id = idSchema.safeParse(formData.get("messageId"));
  const handled = formData.get("handled") === "true";
  if (!id.success) return;
  await supabase.from("contact_messages").update({ handled }).eq("id", id.data);
  done();
}
