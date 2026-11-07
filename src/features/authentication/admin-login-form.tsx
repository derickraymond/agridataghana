"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { signInAdmin, type FormState } from "./actions";

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAdmin, {});
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? "/dashboard/admin"} />
      <Field label="Email address" name="email" error={e.email}>
        <Input name="email" type="email" autoComplete="email" required error={e.email} />
      </Field>
      <Field label="Password" name="password" error={e.password}>
        <Input name="password" type="password" autoComplete="current-password" required error={e.password} />
      </Field>
      <div className="text-right text-sm">
        <Link href="/forgot-password" className="font-medium text-forest-700 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in as admin"}
      </Button>
    </form>
  );
}
