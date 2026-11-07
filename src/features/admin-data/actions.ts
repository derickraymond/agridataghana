"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CropFormState = { error?: string; success?: string };

const schema = z.object({
  name: z.string().trim().min(2, "Enter the crop name").max(60),
  category: z.string().trim().min(2).max(40),
});

export async function addCrop(_: CropFormState, formData: FormData): Promise<CropFormState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const key = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (key.length < 2) return { error: "Enter a valid crop name." };
  const supabase = await createClient();
  const { error } = await supabase.from("crops").insert({ key, name: parsed.data.name, category: parsed.data.category });
  if (error) return { error: error.code === "23505" ? "That crop already exists." : "We could not add the crop." };
  revalidatePath("/dashboard/admin/data");
  return { success: "Crop added." };
}
