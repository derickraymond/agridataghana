"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { addMember, createInput, createOrganization, updateOrganization, type OrgFormState } from "@/features/organizations/actions";
import { GHANA_REGIONS } from "@/lib/config/roles";

const initial: OrgFormState = {};

function Status({ state }: { state: OrgFormState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return null;
}

export function OrganizationForm({
  org,
}: {
  org?: { id: string; name: string; registration_number: string | null; region: string | null; district: string | null };
}) {
  const [state, action, pending] = useActionState(org ? updateOrganization : createOrganization, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      {org && <input type="hidden" name="id" value={org.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organisation name" name="name" error={e.name}>
          <Input name="name" required defaultValue={org?.name} error={e.name} />
        </Field>
        <Field label="Registration number (optional)" name="registration_number" error={e.registration_number}>
          <Input name="registration_number" defaultValue={org?.registration_number ?? ""} error={e.registration_number} />
        </Field>
        <Field label="Region" name="region" error={e.region}>
          <Select name="region" required defaultValue={org?.region ?? ""} error={e.region}>
            <option value="" disabled>
              Choose region
            </option>
            {GHANA_REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="District (optional)" name="district" error={e.district}>
          <Input name="district" defaultValue={org?.district ?? ""} error={e.district} />
        </Field>
      </div>
      <Button disabled={pending}>{pending ? "Saving…" : org ? "Save changes" : "Create organisation"}</Button>
    </form>
  );
}

export function AddMemberForm({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(addMember, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3">
      <Status state={state} />
      <input type="hidden" name="org" value={orgId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Member email" name="email" error={e.email}>
          <Input name="email" type="email" required error={e.email} />
        </Field>
        <Field label="Role" name="member_role">
          <Select name="member_role" defaultValue="member">
            <option value="member">Member</option>
            <option value="staff">Staff</option>
          </Select>
        </Field>
      </div>
      <p className="text-xs text-charcoal-500">The person must already have an approved AgriData Ghana account.</p>
      <Button size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add member"}
      </Button>
    </form>
  );
}

export function InputForm({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(createInput, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Status state={state} />
      <input type="hidden" name="organization_id" value={orgId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name" name="name" error={e.name}>
          <Input name="name" required error={e.name} />
        </Field>
        <Field label="Category" name="category" error={e.category}>
          <Select name="category" defaultValue="seed">
            <option value="seed">Seed</option>
            <option value="fertiliser">Fertiliser</option>
            <option value="agrochemical">Agrochemical</option>
            <option value="tool">Tool</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Unit" name="unit" error={e.unit} hint="e.g. 50 kg bag, litre, piece">
          <Input name="unit" required error={e.unit} />
        </Field>
        <Field label="Price per unit (GHS)" name="price_ghs" error={e.price_ghs}>
          <Input name="price_ghs" type="number" step="0.01" min="0.01" required error={e.price_ghs} />
        </Field>
        <Field label="Stock on hand" name="stock_quantity" error={e.stock_quantity}>
          <Input name="stock_quantity" type="number" step="0.01" min="0" defaultValue="0" required error={e.stock_quantity} />
        </Field>
      </div>
      <Field label="Description (optional)" name="description" error={e.description}>
        <Textarea name="description" rows={2} maxLength={1500} />
      </Field>
      <Button disabled={pending}>{pending ? "Saving…" : "Add product"}</Button>
    </form>
  );
}
