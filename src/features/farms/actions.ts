"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const optionalNumber = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v) : null))
  .refine((v) => v === null || Number.isFinite(v), "Enter a valid number");
const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date");

const farmSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a farm name").max(120),
    region: z.string().trim().min(2, "Choose a region").max(60),
    district: optionalText(80),
    community: optionalText(120),
    size_hectares: z.coerce.number().positive("Size must be greater than 0").max(100000),
    latitude: optionalNumber,
    longitude: optionalNumber,
    ownership: z.enum(["owned", "leased", "family", "communal"]),
  })
  .refine((v) => (v.latitude === null) === (v.longitude === null), { message: "Provide both latitude and longitude", path: ["latitude"] })
  .refine((v) => v.latitude === null || (v.latitude >= 4.5 && v.latitude <= 11.5), { message: "Latitude must be within Ghana (4.5 to 11.5)", path: ["latitude"] })
  .refine((v) => v.longitude === null || (v.longitude >= -3.5 && v.longitude <= 1.5), { message: "Longitude must be within Ghana (-3.5 to 1.5)", path: ["longitude"] });

const cycleSchema = z
  .object({
    farm_id: z.string().uuid(),
    crop_key: z.string().min(2).max(40),
    season: z.string().trim().min(2, "Enter a season, e.g. 2026 Major").max(40),
    area_hectares: z.coerce.number().positive("Area must be greater than 0").max(100000),
    planting_date: optionalDate,
    expected_harvest_date: optionalDate,
    status: z.enum(["planned", "growing", "harvested", "abandoned"]),
    notes: optionalText(1000),
  })
  .refine((v) => !v.planting_date || !v.expected_harvest_date || v.expected_harvest_date >= v.planting_date, {
    message: "Harvest date must be after planting",
    path: ["expected_harvest_date"],
  });

const harvestSchema = z.object({
  cycle_id: z.string().uuid(),
  farm_id: z.string().uuid(),
  harvest_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  quantity_kg: z.coerce.number().positive("Quantity must be greater than 0").max(100000000),
  quality_grade: z.enum(["A", "B", "C", ""]).transform((v) => (v ? v : null)),
  notes: optionalText(1000),
});

export type FarmFormState = { error?: string; success?: string; fieldErrors?: Record<string, string> };

function failure(issues: { path: PropertyKey[]; message: string }[]): FarmFormState {
  const fieldErrors: Record<string, string> = {};
  for (const i of issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
  return { error: "Please correct the highlighted fields.", fieldErrors };
}

export async function createFarm(_: FarmFormState, formData: FormData): Promise<FarmFormState> {
  const { user } = await requireRole(["farmer"]);
  const parsed = farmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  const { data, error } = await supabase.from("farms").insert({ ...parsed.data, owner_id: user.id }).select("id").single();
  if (error || !data) return { error: "We could not save the farm. Please try again." };
  revalidatePath("/dashboard/farmer/farms");
  redirect(`/dashboard/farmer/farms/${data.id}`);
}

export async function createCycle(_: FarmFormState, formData: FormData): Promise<FarmFormState> {
  await requireRole(["farmer"]);
  const parsed = cycleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const supabase = await createClient();
  const { error } = await supabase.from("crop_cycles").insert(parsed.data);
  if (error) return { error: "We could not save the crop cycle. Check the farm and crop and try again." };
  revalidatePath(`/dashboard/farmer/farms/${parsed.data.farm_id}`);
  return { success: "Crop cycle added." };
}

export async function recordHarvest(_: FarmFormState, formData: FormData): Promise<FarmFormState> {
  await requireRole(["farmer"]);
  const parsed = harvestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues);
  const { farm_id, ...row } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("harvests").insert(row);
  if (error) return { error: "We could not record the harvest. The date cannot be in the future." };
  await supabase.from("crop_cycles").update({ status: "harvested" }).eq("id", row.cycle_id);
  revalidatePath(`/dashboard/farmer/farms/${farm_id}`);
  return { success: "Harvest recorded." };
}

export async function deleteFarm(formData: FormData) {
  await requireRole(["farmer"]);
  const id = z.string().uuid().safeParse(formData.get("farmId"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("farms").delete().eq("id", id.data);
  revalidatePath("/dashboard/farmer/farms");
  redirect("/dashboard/farmer/farms");
}
