"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { submitContact, type FormState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, {});
  const e = state.fieldErrors ?? {};
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" error={e.name}>
          <Input name="name" autoComplete="name" required error={e.name} />
        </Field>
        <Field label="Email address" name="email" error={e.email}>
          <Input name="email" type="email" autoComplete="email" required error={e.email} />
        </Field>
      </div>
      <Field label="Subject" name="subject" error={e.subject}>
        <Input name="subject" required error={e.subject} />
      </Field>
      <Field label="Message" name="message" error={e.message}>
        <Textarea name="message" rows={6} required error={e.message} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
