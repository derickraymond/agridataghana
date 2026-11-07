"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { addBatchEvent, createBatch, type TraceFormState } from "@/features/traceability/actions";

const initial: TraceFormState = {};

function Status({ state }: { state: TraceFormState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return null;
}

export function BatchForm({ harvests }: { harvests: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(createBatch, initial);
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Harvest" name="harvest_id">
          <Select name="harvest_id" required defaultValue="">
            <option value="" disabled>
              Choose a harvest
            </option>
            {harvests.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes (optional)" name="notes">
          <Input name="notes" maxLength={500} />
        </Field>
      </div>
      <Button disabled={pending}>{pending ? "Creating…" : "Create batch"}</Button>
    </form>
  );
}

const TYPES: [string, string][] = [
  ["stored", "Stored"],
  ["quality_check", "Quality check"],
  ["packed", "Packed"],
  ["transported", "Transported"],
  ["delivered", "Delivered"],
  ["sold", "Sold"],
];

export function EventForm({ batchId }: { batchId: string }) {
  const [state, action, pending] = useActionState(addBatchEvent, initial);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      <input type="hidden" name="batch_id" value={batchId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event" name="event_type">
          <Select name="event_type" required defaultValue="">
            <option value="" disabled>
              Choose event
            </option>
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" name="occurred_on">
          <Input name="occurred_on" type="date" max={today} defaultValue={today} required />
        </Field>
        <Field label="Location (optional)" name="location">
          <Input name="location" maxLength={120} />
        </Field>
        <Field label="Details (optional)" name="description">
          <Input name="description" maxLength={300} />
        </Field>
      </div>
      <Button disabled={pending}>{pending ? "Saving…" : "Add event"}</Button>
    </form>
  );
}
