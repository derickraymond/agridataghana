"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type MarketFormState = { error?: string; success?: string; fieldErrors?: Record<string, string> };

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const optionalPositive = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v) : null))
  .refine((v) => v === null || (Number.isFinite(v) && v > 0), "Enter a number greater than 0");

function failure(issues: { path: PropertyKey[]; message: string }[]): MarketFormState {
  const fieldErrors: Record<string, string> = {};
  for (const i of issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
  return { error: "Please correct the highlighted fields.", fieldErrors };
}

const listingSchema = z.object({
  crop_key: z.string().min(2).max(40),
  title: z.string().trim().min(4, "Enter a title of at least 4 characters").max(140),
  description: optionalText(2000),
  quantity_kg: z.coerce.number().positive("Quantity must be greater than 0").max(100000000),
  price_per_kg_ghs: z.coerce.number().positive("Price must be greater than 0").max(1000000),
  quality_grade: z.enum(["A", "B", "C", ""]).transform((v) => (v ? v : null)),
  region: z.string().trim().min(2, "Choose a region").max(60),
  district: optionalText(80),
  available_from: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date"),
});

const enquirySchema = z.object({
  listing_id: z.string().uuid(),
  message: z.string().trim().min(5, "Write at least a short message").max(1500),
  quantity_kg: optionalPositive,
  offered_price_per_kg_ghs: optionalPositive,
});

const idSchema = z.string().uuid();
const SELLERS = ["farmer", "cooperative", "aggregator"] as const;

export async function createListing(_: MarketFormState, formData: FormData): Promise<MarketFormState> {
  const { user } = await requireRole([...SELLERS]);
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  const { error } = await supabase.from("listings").insert({ ...parsed.data, seller_id: user.id, status: "pending" });
  if (error) return { error: "We could not submit the listing. Please try again." };
  revalidatePath("/dashboard/listings");
  redirect("/dashboard/listings?submitted=1");
}

export async function closeListing(formData: FormData) {
  await requireRole([...SELLERS]);
  const id = idSchema.safeParse(formData.get("listingId"));
  const status = z.enum(["withdrawn", "sold"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  const supabase = await createClient();
  await supabase.from("listings").update({ status: status.data }).eq("id", id.data);
  revalidatePath("/dashboard/listings");
  revalidatePath("/marketplace");
}

export async function sendEnquiry(_: MarketFormState, formData: FormData): Promise<MarketFormState> {
  const { user } = await requireRole(["farmer", "cooperative", "aggregator", "agro_dealer", "buyer", "processor", "exporter"]);
  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").insert({ ...parsed.data, buyer_id: user.id });
  if (error) return { error: "We could not send your enquiry. The listing may no longer be available." };
  revalidatePath("/dashboard/enquiries");
  return { success: "Enquiry sent. The seller can reply from their dashboard." };
}

export async function replyToEnquiry(_: MarketFormState, formData: FormData): Promise<MarketFormState> {
  await requireRole([...SELLERS]);
  const parsed = z
    .object({ enquiry_id: idSchema, reply: z.string().trim().min(2, "Write a reply").max(1500) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enquiries")
    .update({ seller_reply: parsed.data.reply, status: "replied" })
    .eq("id", parsed.data.enquiry_id)
    .select("id");
  if (error || !data?.length) return { error: "We could not send your reply." };
  revalidatePath("/dashboard/enquiries");
  return { success: "Reply sent." };
}

// Administrator moderation: approve or reject a pending listing.
export async function moderateListing(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("listingId"));
  const decision = z.enum(["active", "rejected"]).safeParse(formData.get("decision"));
  const note = z.string().trim().max(500).safeParse(formData.get("note") ?? "");
  if (!id.success || !decision.success || !note.success) return;
  const supabase = await createClient();
  await supabase
    .from("listings")
    .update({ status: decision.data, moderation_note: note.data || null })
    .eq("id", id.data);
  revalidatePath("/dashboard/admin/listings");
  revalidatePath("/marketplace");
}

export async function removeListing(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("listingId"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("listings").delete().eq("id", id.data);
  revalidatePath("/dashboard/admin/listings");
  revalidatePath("/marketplace");
}
