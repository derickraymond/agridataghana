import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-lg border border-charcoal-200 bg-white px-3.5 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-500 focus:border-fresh-500 focus:outline-none focus:ring-2 focus:ring-fresh-500/30 aria-[invalid=true]:border-danger";

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-charcoal-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-charcoal-500">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      id={props.name}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${props.name}-error` : undefined}
      className={cn(inputCls, className)}
      {...props}
    />
  );
}

export function Select({ className, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <select
      id={props.name}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${props.name}-error` : undefined}
      className={cn(inputCls, className)}
      {...props}
    />
  );
}

export function Textarea({ className, error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      id={props.name}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${props.name}-error` : undefined}
      className={cn(inputCls, className)}
      {...props}
    />
  );
}
