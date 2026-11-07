import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-forest-700 text-white hover:bg-forest-800",
  fresh: "bg-fresh-500 text-white hover:bg-fresh-600",
  outline: "border border-forest-700 text-forest-700 hover:bg-forest-50",
  ghost: "text-forest-800 hover:bg-forest-50",
  light: "bg-white text-forest-800 hover:bg-forest-50",
  outlineLight: "border border-white/70 text-white hover:bg-white/10",
};
const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3 text-base" };

type Common = { variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string };

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
}: Common & { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}
