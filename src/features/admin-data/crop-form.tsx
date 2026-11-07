"use client";

import { useActionState } from "react";
import { addCrop, type CropFormState } from "./actions";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";

export function CropForm({ categories }: { categories: string[] }) {
  const [state, action, pending] = useActionState<CropFormState, FormData>(addCrop, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      {state.error && <Alert tone="error" className="sm:col-span-3">{state.error}</Alert>}
      {state.success && <Alert tone="success" className="sm:col-span-3">{state.success}</Alert>}
      <Field label="Crop name" name="name">
        <Input name="name" required maxLength={60} />
      </Field>
      <Field label="Category" name="category">
        <Select name="category" defaultValue={categories[0]}>
          {categories.map((c) => (
            <option key={c} value={c}>{c.replace("_", " ")}</option>
          ))}
        </Select>
      </Field>
      <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add crop"}</Button>
    </form>
  );
}
