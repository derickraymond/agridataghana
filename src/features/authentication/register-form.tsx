"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { APPROVAL_REQUIRED_TYPES, REGISTRATION_TYPES, ROLE_LABELS } from "@/lib/config/roles";
import { signUp, type FormState } from "./actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  const e = state.fieldErrors ?? {};

  if (state.success) return <Alert tone="success">{state.success}</Alert>;

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Account type" name="account_type" error={e.account_type} hint="Extension agent and institutional analyst accounts require administrator approval.">
        <Select name="account_type" defaultValue="" required error={e.account_type}>
          <option value="" disabled>
            Select account type
          </option>
          {REGISTRATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {ROLE_LABELS[t]}
              {APPROVAL_REQUIRED_TYPES.includes(t) ? " (approval required)" : ""}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Full name" name="full_name" error={e.full_name}>
        <Input name="full_name" autoComplete="name" required error={e.full_name} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone number" name="phone" error={e.phone}>
          <Input name="phone" type="tel" autoComplete="tel" placeholder="+233 24 123 4567" required error={e.phone} />
        </Field>
        <Field label="Location" name="location" error={e.location}>
          <Input name="location" autoComplete="address-level2" placeholder="Town, region" required error={e.location} />
        </Field>
      </div>
      <Field label="Email address" name="email" error={e.email}>
        <Input name="email" type="email" autoComplete="email" required error={e.email} />
      </Field>
      <Field label="Password" name="password" error={e.password} hint="At least 10 characters, with letters and numbers.">
        <Input name="password" type="password" autoComplete="new-password" required error={e.password} />
      </Field>

      <div className="space-y-2 text-sm text-charcoal-700">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="consent_terms" className="mt-1 h-4 w-4 accent-forest-700" />
          <span>
            I accept the{" "}
            <Link href="/terms" className="font-medium text-forest-700 underline">
              Terms &amp; Conditions
            </Link>{" "}
            and consent to my data being processed as described in the{" "}
            <Link href="/privacy" className="font-medium text-forest-700 underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {e.consent_terms && <p className="text-xs text-danger">{e.consent_terms}</p>}
        <label className="flex items-start gap-2">
          <input type="checkbox" name="consent_marketing" className="mt-1 h-4 w-4 accent-forest-700" />
          <span>Send me updates and agricultural tips (optional).</span>
        </label>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
