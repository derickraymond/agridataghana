"use client";

import { useActionState } from "react";
import { createUser, type UserFormState } from "@/features/admin/actions";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { ACCOUNT_TYPES, ROLE_LABELS } from "@/lib/config/roles";

export function CreateUserForm() {
  const [state, action, pending] = useActionState<UserFormState, FormData>(createUser, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {state.error && <Alert tone="error" className="sm:col-span-2">{state.error}</Alert>}
      {state.success && <Alert tone="success" className="sm:col-span-2">{state.success}</Alert>}
      <Field label="Full name" name="full_name">
        <Input name="full_name" required maxLength={120} autoComplete="off" />
      </Field>
      <Field label="Email" name="email">
        <Input name="email" type="email" required maxLength={254} autoComplete="off" />
      </Field>
      <Field label="Temporary password (min 10 characters)" name="password">
        <Input name="password" type="password" required minLength={10} maxLength={72} autoComplete="new-password" />
      </Field>
      <Field label="Phone (optional)" name="phone">
        <Input name="phone" maxLength={20} autoComplete="off" />
      </Field>
      <Field label="Role" name="role">
        <Select name="role" defaultValue="farmer">
          {ACCOUNT_TYPES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </Select>
      </Field>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create account"}</Button>
      </div>
      <p className="text-xs text-charcoal-500 sm:col-span-2">
        Created accounts are approved immediately. Choosing Administrator gives full control of the platform; use it sparingly.
      </p>
    </form>
  );
}
