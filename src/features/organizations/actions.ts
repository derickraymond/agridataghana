"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_ROLES } from "./constants";

export type OrgFormState = { error?: string; success?: string; fieldErrors?: Record<string, string> };

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const idSchema = z.string().uuid();

function failure(issues: { path: PropertyKey[]; message: string }[]): OrgFormState {
  const fieldErrors: Record<string, string> = {};
  for (const i of issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
  return { error: "Please correct the highlighted fields.", fieldErrors };
}

const orgSchema = z.object({
  name: z.string().trim().min(2, "Enter the organisation name").max(160),
  registration_number: optionalText(60),
  region: z.string().trim().min(2, "Choose a region").max(60),
  district: optionalText(80),
});

export async function createOrganization(_: OrgFormState, formData: FormData): Promise<OrgFormState> {
  const { user, profile } = await requireRole(BUSINESS_ROLES);
  const parsed = orgSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  // The database sets verification to "pending" and requires the type to match the account type.
  const { error } = await supabase
    .from("organizations")
    .insert({ ...parsed.data, type: profile.role, created_by: user.id });
  if (error) {
    return { error: error.code === "23505" ? "You already have an organisation." : "We could not create the organisation. Please try again." };
  }
  revalidatePath("/dashboard/organization");
  redirect("/dashboard/organization");
}

export async function updateOrganization(_: OrgFormState, formData: FormData): Promise<OrgFormState> {
  await requireRole(BUSINESS_ROLES);
  const id = idSchema.safeParse(formData.get("id"));
  const parsed = orgSchema.safeParse(Object.fromEntries(formData));
  if (!id.success) return { error: "Invalid organisation." };
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  const { data, error } = await supabase.from("organizations").update(parsed.data).eq("id", id.data).select("id");
  if (error || !data?.length) return { error: "Only an organisation manager can update these details." };
  revalidatePath("/dashboard/organization");
  return { success: "Organisation updated." };
}

export async function addMember(_: OrgFormState, formData: FormData): Promise<OrgFormState> {
  await requireRole(BUSINESS_ROLES);
  const parsed = z
    .object({
      org: idSchema,
      email: z.string().trim().email("Enter a valid email address"),
      member_role: z.enum(["member", "staff"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_org_member", {
    org: parsed.data.org,
    member_email: parsed.data.email,
    as_role: parsed.data.member_role,
  });
  if (error) return { error: "Only an approved organisation manager can add members." };
  if (data !== "added") return { error: "No approved, active account was found for that email address." };
  revalidatePath("/dashboard/organization");
  return { success: "Member added." };
}

export async function removeMember(formData: FormData) {
  const { user } = await requireRole(BUSINESS_ROLES);
  const org = idSchema.safeParse(formData.get("org"));
  const member = idSchema.safeParse(formData.get("userId"));
  if (!org.success || !member.success || member.data === user.id) return;
  const supabase = await createClient();
  await supabase.from("organization_members").delete().eq("organization_id", org.data).eq("user_id", member.data);
  revalidatePath("/dashboard/organization");
}

const inputSchema = z.object({
  organization_id: idSchema,
  name: z.string().trim().min(2, "Enter a product name").max(140),
  category: z.enum(["seed", "fertiliser", "agrochemical", "tool", "equipment", "other"]),
  description: optionalText(1500),
  unit: z.string().trim().min(1, "Enter a unit, e.g. 50 kg bag").max(30),
  price_ghs: z.coerce.number().positive("Price must be greater than 0").max(100000000),
  stock_quantity: z.coerce.number().min(0, "Stock cannot be negative").max(100000000),
});

export async function createInput(_: OrgFormState, formData: FormData): Promise<OrgFormState> {
  await requireRole(["agro_dealer"]);
  const parsed = inputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  const { error } = await supabase.from("agro_inputs").insert(parsed.data);
  if (error) return { error: "We could not save the product. Your organisation must be an agro-dealer." };
  revalidatePath("/dashboard/organization/inputs");
  revalidatePath("/equipment");
  return { success: "Product added. It is listed publicly once your organisation is verified." };
}

export async function updateInput(formData: FormData) {
  await requireRole(["agro_dealer"]);
  const id = idSchema.safeParse(formData.get("id"));
  const intent = z.enum(["activate", "deactivate", "delete"]).safeParse(formData.get("intent"));
  if (!id.success || !intent.success) return;
  const supabase = await createClient();
  if (intent.data === "delete") await supabase.from("agro_inputs").delete().eq("id", id.data);
  else await supabase.from("agro_inputs").update({ status: intent.data === "activate" ? "active" : "inactive" }).eq("id", id.data);
  revalidatePath("/dashboard/organization/inputs");
  revalidatePath("/equipment");
}

export async function reviewOrganization(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("orgId"));
  const decision = z.enum(["verified", "rejected", "pending"]).safeParse(formData.get("decision"));
  if (!id.success || !decision.success) return;
  const supabase = await createClient();
  await supabase.from("organizations").update({ verification_status: decision.data }).eq("id", id.data);
  revalidatePath("/dashboard/admin/organizations");
  revalidatePath("/equipment");
}
