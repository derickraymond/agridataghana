"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { placeOrder, type OrderFormState } from "@/features/orders/actions";

const initial: OrderFormState = {};

export function OrderForm({ listingId, pricePerKg, maxKg }: { listingId: string; pricePerKg: number; maxKg: number }) {
  const [state, action, pending] = useActionState(placeOrder, initial);
  const [qty, setQty] = useState("");
  const [method, setMethod] = useState("pickup");
  const e = state.fieldErrors ?? {};
  const total = Number(qty) > 0 ? Number(qty) * pricePerKg : 0;
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="listing_id" value={listingId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Quantity (kg, up to ${maxKg.toLocaleString("en-GB")})`} name="quantity_kg" error={e.quantity_kg}>
          <Input
            name="quantity_kg"
            type="number"
            step="0.01"
            min="0.01"
            max={maxKg}
            required
            value={qty}
            onChange={(ev) => setQty(ev.target.value)}
            error={e.quantity_kg}
          />
        </Field>
        <Field label="Contact phone" name="contact_phone" error={e.contact_phone}>
          <Input name="contact_phone" type="tel" required placeholder="e.g. 024 000 0000" error={e.contact_phone} />
        </Field>
        <Field label="Delivery" name="delivery_method">
          <Select name="delivery_method" value={method} onChange={(ev) => setMethod(ev.target.value)}>
            <option value="pickup">I will collect (pickup)</option>
            <option value="delivery">Deliver to me</option>
          </Select>
        </Field>
        <Field label="Payment method" name="payment_method">
          <Select name="payment_method" defaultValue="mobile_money">
            <option value="mobile_money">Mobile money</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
          </Select>
        </Field>
      </div>
      {method === "delivery" && (
        <Field label="Delivery address" name="delivery_address" error={e.delivery_address}>
          <Input name="delivery_address" required maxLength={300} error={e.delivery_address} />
        </Field>
      )}
      <Field label="Notes (optional)" name="notes" error={e.notes}>
        <Textarea name="notes" rows={2} maxLength={1000} />
      </Field>
      <p className="text-sm text-charcoal-700">
        Order total: <strong>GHS {total.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </p>
      <p className="text-sm text-charcoal-500">
        Payment is made directly to the seller. AgriData Ghana does not process payments; the seller records it once received.
      </p>
      <Button disabled={pending}>{pending ? "Placing order…" : "Place order"}</Button>
    </form>
  );
}
