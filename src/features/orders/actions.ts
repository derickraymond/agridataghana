"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type OrderFormState = { error?: string; success?: string; fieldErrors?: Record<string, string> };

const TRADERS = ["farmer", "cooperative", "aggregator", "agro_dealer", "buyer", "processor", "exporter"] as const;

const orderSchema = z
  .object({
    listing_id: z.string().uuid(),
    quantity_kg: z.coerce.number().positive("Quantity must be greater than 0").max(100000000),
    delivery_method: z.enum(["pickup", "delivery"]),
    delivery_address: z.string().trim().max(300).optional(),
    contact_phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ]{7,20}$/, "Enter a valid phone number"),
    payment_method: z.enum(["mobile_money", "cash", "bank_transfer"]),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.delivery_method === "pickup" || (v.delivery_address ?? "").length >= 5, {
    message: "Enter the delivery address",
    path: ["delivery_address"],
  });

export async function placeOrder(_: OrderFormState, formData: FormData): Promise<OrderFormState> {
  await requireRole([...TRADERS]);
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { error: "Please correct the highlighted fields.", fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("place_order", {
    p_listing: v.listing_id,
    p_quantity: v.quantity_kg,
    p_delivery_method: v.delivery_method,
    p_address: v.delivery_method === "delivery" ? v.delivery_address ?? "" : "",
    p_phone: v.contact_phone,
    p_payment_method: v.payment_method,
    p_notes: v.notes ?? "",
  });
  if (error) return { error: error.code === "P0001" ? error.message : "We could not place your order. Please try again." };
  revalidatePath("/dashboard/orders");
  redirect("/dashboard/orders?placed=1");
}

export async function advanceOrder(formData: FormData) {
  await requireRole([...TRADERS]);
  const id = z.string().uuid().safeParse(formData.get("orderId"));
  const status = z.enum(["accepted", "rejected", "dispatched", "delivered", "completed", "cancelled"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  const supabase = await createClient();
  await supabase.rpc("advance_order", { p_order: id.data, p_status: status.data });
  revalidatePath("/dashboard/orders");
}

export async function recordPayment(formData: FormData) {
  await requireRole([...TRADERS]);
  const id = z.string().uuid().safeParse(formData.get("orderId"));
  const ref = z.string().trim().max(80).safeParse(formData.get("reference") ?? "");
  if (!id.success || !ref.success) return;
  const supabase = await createClient();
  await supabase.rpc("record_order_payment", { p_order: id.data, p_reference: ref.data });
  revalidatePath("/dashboard/orders");
}
