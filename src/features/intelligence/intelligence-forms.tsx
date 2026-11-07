"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { createAdvisory, publishPrice, type IntelFormState } from "@/features/intelligence/actions";
import { GHANA_REGIONS } from "@/lib/config/roles";

const initial: IntelFormState = {};
type Crop = { key: string; name: string };

function Status({ state }: { state: IntelFormState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return null;
}

export function PriceForm({ crops }: { crops: Crop[] }) {
  const [state, action, pending] = useActionState(publishPrice, initial);
  const e = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Commodity" name="crop_key" error={e.crop_key}>
          <Select name="crop_key" required defaultValue="">
            <option value="" disabled>
              Choose commodity
            </option>
            {crops.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Market" name="market" error={e.market}>
          <Input name="market" required placeholder="e.g. Kumasi Central Market" error={e.market} />
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
        <Field label="Price (GHS per kg)" name="price_per_kg_ghs" error={e.price_per_kg_ghs}>
          <Input name="price_per_kg_ghs" type="number" step="0.01" min="0.01" required error={e.price_per_kg_ghs} />
        </Field>
        <Field label="Observed on" name="observed_on" error={e.observed_on}>
          <Input name="observed_on" type="date" max={today} defaultValue={today} required error={e.observed_on} />
        </Field>
        <Field label="Source" name="source" error={e.source}>
          <Input name="source" required placeholder="e.g. MoFA market survey" error={e.source} />
        </Field>
      </div>
      <Button disabled={pending}>{pending ? "Publishing…" : "Publish price"}</Button>
    </form>
  );
}

export function AdvisoryForm({ crops }: { crops: Crop[] }) {
  const [state, action, pending] = useActionState(createAdvisory, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Title" name="title" error={e.title}>
          <Input name="title" required maxLength={160} error={e.title} />
        </Field>
        <Field label="Category" name="category">
          <Select name="category" defaultValue="general">
            <option value="general">General</option>
            <option value="planting">Planting and harvesting</option>
            <option value="pest_disease">Pest and disease</option>
            <option value="weather_alert">Weather alert</option>
            <option value="market">Market</option>
          </Select>
        </Field>
        <Field label="Crop (optional)" name="crop_key">
          <Select name="crop_key" defaultValue="">
            <option value="">All crops</option>
            {crops.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Region (optional)" name="region" error={e.region}>
          <Select name="region" defaultValue="">
            <option value="">All regions</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Advice" name="body" error={e.body}>
        <Textarea name="body" rows={5} required maxLength={8000} error={e.body} />
      </Field>
      <Button disabled={pending}>{pending ? "Saving…" : "Save advisory"}</Button>
    </form>
  );
}
