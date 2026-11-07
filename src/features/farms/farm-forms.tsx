"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { createCycle, createFarm, recordHarvest, type FarmFormState } from "@/features/farms/actions";
import { GHANA_REGIONS } from "@/lib/config/roles";

const initial: FarmFormState = {};

function Status({ state }: { state: FarmFormState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return null;
}

export function FarmForm() {
  const [state, action, pending] = useActionState(createFarm, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Farm name" name="name" error={e.name}>
          <Input name="name" required error={e.name} />
        </Field>
        <Field label="Region" name="region" error={e.region}>
          <Select name="region" required defaultValue="" error={e.region}>
            <option value="" disabled>
              Choose region
            </option>
            {GHANA_REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="District" name="district" error={e.district}>
          <Input name="district" error={e.district} />
        </Field>
        <Field label="Community / village" name="community" error={e.community}>
          <Input name="community" error={e.community} />
        </Field>
        <Field label="Size (hectares)" name="size_hectares" error={e.size_hectares}>
          <Input name="size_hectares" type="number" step="0.01" min="0.01" required error={e.size_hectares} />
        </Field>
        <Field label="Land ownership" name="ownership" error={e.ownership}>
          <Select name="ownership" defaultValue="owned">
            <option value="owned">Owned</option>
            <option value="leased">Leased</option>
            <option value="family">Family land</option>
            <option value="communal">Communal</option>
          </Select>
        </Field>
        <Field label="Latitude (optional)" name="latitude" error={e.latitude} hint="Decimal degrees, e.g. 6.6885">
          <Input name="latitude" type="number" step="0.000001" error={e.latitude} />
        </Field>
        <Field label="Longitude (optional)" name="longitude" error={e.longitude} hint="Decimal degrees, e.g. -1.6244">
          <Input name="longitude" type="number" step="0.000001" error={e.longitude} />
        </Field>
      </div>
      <Button disabled={pending}>{pending ? "Saving…" : "Save farm"}</Button>
    </form>
  );
}

export function CycleForm({ farmId, crops }: { farmId: string; crops: { key: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createCycle, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      <input type="hidden" name="farm_id" value={farmId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Crop" name="crop_key" error={e.crop_key}>
          <Select name="crop_key" required defaultValue="">
            <option value="" disabled>
              Choose crop
            </option>
            {crops.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Season" name="season" error={e.season}>
          <Input name="season" placeholder="2026 Major" required error={e.season} />
        </Field>
        <Field label="Area planted (hectares)" name="area_hectares" error={e.area_hectares}>
          <Input name="area_hectares" type="number" step="0.01" min="0.01" required error={e.area_hectares} />
        </Field>
        <Field label="Status" name="status" error={e.status}>
          <Select name="status" defaultValue="planned">
            <option value="planned">Planned</option>
            <option value="growing">Growing</option>
          </Select>
        </Field>
        <Field label="Planting date" name="planting_date" error={e.planting_date}>
          <Input name="planting_date" type="date" error={e.planting_date} />
        </Field>
        <Field label="Expected harvest" name="expected_harvest_date" error={e.expected_harvest_date}>
          <Input name="expected_harvest_date" type="date" error={e.expected_harvest_date} />
        </Field>
      </div>
      <Field label="Notes (optional)" name="notes" error={e.notes}>
        <Textarea name="notes" rows={2} maxLength={1000} />
      </Field>
      <Button disabled={pending}>{pending ? "Saving…" : "Add crop cycle"}</Button>
    </form>
  );
}

export function HarvestForm({ farmId, cycleId }: { farmId: string; cycleId: string }) {
  const [state, action, pending] = useActionState(recordHarvest, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3 rounded-lg bg-charcoal-50 p-4">
      <Status state={state} />
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="cycle_id" value={cycleId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Harvest date" name={`hd-${cycleId}`} error={e.harvest_date}>
          <Input id={`hd-${cycleId}`} name="harvest_date" type="date" required error={e.harvest_date} />
        </Field>
        <Field label="Quantity (kg)" name={`q-${cycleId}`} error={e.quantity_kg}>
          <Input id={`q-${cycleId}`} name="quantity_kg" type="number" step="0.01" min="0.01" required error={e.quantity_kg} />
        </Field>
        <Field label="Grade" name={`g-${cycleId}`}>
          <Select id={`g-${cycleId}`} name="quality_grade" defaultValue="">
            <option value="">Not graded</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </Select>
        </Field>
      </div>
      <Button size="sm" disabled={pending}>
        {pending ? "Saving…" : "Record harvest"}
      </Button>
    </form>
  );
}
