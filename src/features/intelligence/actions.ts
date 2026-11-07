"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { GHANA_REGIONS } from "@/lib/config/roles";

export type IntelFormState = { error?: string; success?: string; fieldErrors?: Record<string, string> };

function failure(issues: { path: PropertyKey[]; message: string }[]): IntelFormState {
  const fieldErrors: Record<string, string> = {};
  for (const i of issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
  return { error: "Please correct the highlighted fields.", fieldErrors };
}

const priceSchema = z.object({
  crop_key: z.string().min(2).max(40),
  market: z.string().trim().min(2, "Enter the market name").max(100),
  region: z.enum(GHANA_REGIONS, { message: "Choose a region" }),
  price_per_kg_ghs: z.coerce.number().positive("Price must be greater than 0").max(1000000),
  observed_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the observation date")
    .refine((v) => v <= new Date().toISOString().slice(0, 10), "The date cannot be in the future"),
  source: z.string().trim().min(2, "Name the source of this price").max(200),
});

export async function publishPrice(_: IntelFormState, formData: FormData): Promise<IntelFormState> {
  const { user } = await requireAdmin();
  const parsed = priceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  const { error } = await supabase.from("commodity_prices").insert({ ...parsed.data, created_by: user.id });
  if (error) return { error: "We could not save the price." };
  revalidatePath("/commodity-prices");
  revalidatePath("/dashboard/admin/prices");
  return { success: "Price published." };
}

export async function deletePrice(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("commodity_prices").delete().eq("id", id.data);
  revalidatePath("/commodity-prices");
  revalidatePath("/dashboard/admin/prices");
}

const advisorySchema = z.object({
  title: z.string().trim().min(4, "Enter a title of at least 4 characters").max(160),
  body: z.string().trim().min(20, "Write at least 20 characters").max(8000),
  category: z.enum(["planting", "pest_disease", "weather_alert", "market", "general"]),
  crop_key: z.string().max(40).optional().transform((v) => (v ? v : null)),
  region: z.string().max(60).optional().transform((v) => (v ? v : null)),
});

export async function createAdvisory(_: IntelFormState, formData: FormData): Promise<IntelFormState> {
  const { user, profile } = await requireRole(["administrator", "extension_agent"]);
  const parsed = advisorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  if (parsed.data.region && !(GHANA_REGIONS as readonly string[]).includes(parsed.data.region)) {
    return { error: "Choose a valid region.", fieldErrors: { region: "Choose a valid region" } };
  }
  const isAdmin = profile.role === "administrator";
  const supabase = await createClient();
  const { error } = await supabase
    .from("advisories")
    .insert({ ...parsed.data, author_id: user.id, status: isAdmin ? "published" : "pending" });
  if (error) return { error: "We could not save the advisory." };
  revalidatePath("/weather");
  revalidatePath("/dashboard/advisories");
  revalidatePath("/dashboard/admin/advisories");
  return { success: isAdmin ? "Advisory published." : "Advisory submitted. An administrator will review it before it is published." };
}

export async function setAdvisoryStatus(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const status = z.enum(["published", "archived"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  const supabase = await createClient();
  await supabase.from("advisories").update({ status: status.data }).eq("id", id.data);
  revalidatePath("/weather");
  revalidatePath("/dashboard/admin/advisories");
}

export async function deleteAdvisory(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("advisories").delete().eq("id", id.data);
  revalidatePath("/weather");
  revalidatePath("/dashboard/admin/advisories");
}
