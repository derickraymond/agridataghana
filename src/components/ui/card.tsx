import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-charcoal-200 bg-white p-6 shadow-sm", className)} {...props} />;
}

const badgeTones = {
  green: "bg-forest-100 text-forest-800",
  earth: "bg-earth-100 text-earth-700",
  grey: "bg-charcoal-50 text-charcoal-700 ring-1 ring-charcoal-200",
  red: "bg-red-50 text-danger",
};

export function Badge({
  tone = "green",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone], className)}
      {...props}
    />
  );
}

const alertTones = {
  info: "border-forest-200 bg-forest-50 text-forest-900",
  warning: "border-earth-500/40 bg-earth-50 text-earth-700",
  error: "border-danger/30 bg-red-50 text-danger",
  success: "border-fresh-500/40 bg-forest-50 text-forest-800",
};

export function Alert({
  tone = "info",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: keyof typeof alertTones }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-lg border p-4 text-sm", alertTones[tone], className)} {...props} />
  );
}

// Used wherever a module's live data source is not configured yet.
export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <Alert tone="warning">
      <strong>Demonstration data.</strong> {children ?? "This content is illustrative only and is not a live market or farm record."}
    </Alert>
  );
}
