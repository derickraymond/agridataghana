"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { createListing, replyToEnquiry, sendEnquiry, type MarketFormState } from "@/features/marketplace/actions";
import { GHANA_REGIONS } from "@/lib/config/roles";

const initial: MarketFormState = {};

function Status({ state }: { state: MarketFormState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return null;
}

export function ListingForm({ crops }: { crops: { key: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createListing, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Produce" name="crop_key" error={e.crop_key}>
          <Select name="crop_key" required defaultValue="">
            <option value="" disabled>
              Choose produce
            </option>
            {crops.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Listing title" name="title" error={e.title}>
          <Input name="title" placeholder="e.g. Dry white maize, 2026 major season" required error={e.title} />
        </Field>
        <Field label="Quantity available (kg)" name="quantity_kg" error={e.quantity_kg}>
          <Input name="quantity_kg" type="number" step="0.01" min="0.01" required error={e.quantity_kg} />
        </Field>
        <Field label="Asking price (GHS per kg)" name="price_per_kg_ghs" error={e.price_per_kg_ghs}>
          <Input name="price_per_kg_ghs" type="number" step="0.01" min="0.01" required error={e.price_per_kg_ghs} />
        </Field>
        <Field label="Region" name="region" error={e.region}>
          <Select name="region" required defaultValue="">
            <option value="" disabled>
              Choose region
            </option>
            {GHANA_REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="District (optional)" name="district" error={e.district}>
          <Input name="district" error={e.district} />
        </Field>
        <Field label="Quality grade" name="quality_grade">
          <Select name="quality_grade" defaultValue="">
            <option value="">Not graded</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </Select>
        </Field>
        <Field label="Available from (optional)" name="available_from" error={e.available_from}>
          <Input name="available_from" type="date" error={e.available_from} />
        </Field>
      </div>
      <Field label="Description (optional)" name="description" error={e.description}>
        <Textarea name="description" rows={3} maxLength={2000} />
      </Field>
      <p className="text-sm text-charcoal-500">New listings are reviewed by an administrator before they appear in the marketplace.</p>
      <Button disabled={pending}>{pending ? "Submitting…" : "Submit for review"}</Button>
    </form>
  );
}

export function EnquiryForm({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(sendEnquiry, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      <input type="hidden" name="listing_id" value={listingId} />
      <Field label="Message to seller" name="message" error={e.message}>
        <Textarea name="message" rows={4} required maxLength={1500} error={e.message} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quantity wanted (kg, optional)" name="quantity_kg" error={e.quantity_kg}>
          <Input name="quantity_kg" type="number" step="0.01" min="0.01" error={e.quantity_kg} />
        </Field>
        <Field label="Your offer (GHS per kg, optional)" name="offered_price_per_kg_ghs" error={e.offered_price_per_kg_ghs}>
          <Input name="offered_price_per_kg_ghs" type="number" step="0.01" min="0.01" error={e.offered_price_per_kg_ghs} />
        </Field>
      </div>
      <Button disabled={pending}>{pending ? "Sending…" : "Send enquiry"}</Button>
    </form>
  );
}

export function ReplyForm({ enquiryId }: { enquiryId: string }) {
  const [state, action, pending] = useActionState(replyToEnquiry, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3 rounded-lg bg-charcoal-50 p-4">
      <Status state={state} />
      <input type="hidden" name="enquiry_id" value={enquiryId} />
      <Field label="Your reply" name={`reply-${enquiryId}`} error={e.reply}>
        <Textarea id={`reply-${enquiryId}`} name="reply" rows={3} required maxLength={1500} error={e.reply} />
      </Field>
      <Button size="sm" disabled={pending}>
        {pending ? "Sending…" : "Send reply"}
      </Button>
    </form>
  );
}
