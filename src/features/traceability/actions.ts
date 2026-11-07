"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type TraceFormState = { error?: string; success?: string };

export async function createBatch(_: TraceFormState, formData: FormData): Promise<TraceFormState> {
  await requireRole(["farmer"]);
  const parsed = z
    .object({ harvest_id: z.string().uuid("Choose a harvest"), notes: z.string().trim().max(500).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choose a harvest." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_batch", { p_harvest: parsed.data.harvest_id, p_notes: parsed.data.notes ?? null });
  if (error || !data) {
    return { error: error?.message.includes("duplicate") ? "A batch already exists for this harvest." : "We could not create the batch." };
  }
  revalidatePath("/dashboard/traceability");
  redirect(`/dashboard/traceability/${data}`);
}

const eventSchema = z.object({
  batch_id: z.string().uuid(),
  event_type: z.enum(["stored", "quality_check", "packed", "transported", "delivered", "sold"], { message: "Choose an event type" }),
  description: z.string().trim().max(300).optional(),
  location: z.string().trim().max(120).optional(),
  occurred_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date")
    .refine((v) => v <= new Date().toISOString().slice(0, 10), "The date cannot be in the future"),
});

export async function addBatchEvent(_: TraceFormState, formData: FormData): Promise<TraceFormState> {
  await requireRole(["farmer"]);
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_batch_event", {
    p_batch: d.batch_id,
    p_type: d.event_type,
    p_description: d.description ?? "",
    p_location: d.location ?? "",
    p_on: d.occurred_on,
  });
  if (error) return { error: "We could not record the event." };
  revalidatePath(`/dashboard/traceability/${d.batch_id}`);
  return { success: "Event recorded." };
}
