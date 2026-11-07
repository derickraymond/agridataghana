"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard/admin", label: "Overview" },
  { href: "/dashboard/admin/approvals", label: "Approvals" },
  { href: "/dashboard/admin/users", label: "Users" },
  { href: "/dashboard/admin/listings", label: "Listings" },
  { href: "/dashboard/admin/organizations", label: "Organisations" },
  { href: "/dashboard/admin/orders", label: "Orders" },
  { href: "/dashboard/admin/prices", label: "Prices" },
  { href: "/dashboard/admin/advisories", label: "Advisories" },
  { href: "/dashboard/admin/activity", label: "Activity" },
  { href: "/dashboard/admin/reports", label: "Reports" },
  { href: "/dashboard/admin/data", label: "Data" },
  { href: "/dashboard/admin/messages", label: "Messages" },
];

export function AdminNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration" className="-mx-1 flex flex-wrap gap-1 border-b border-charcoal-200 pb-3">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard/admin" ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
              active ? "bg-forest-700 text-white" : "text-charcoal-700 hover:bg-forest-50",
            )}
          >
            {l.label}
            {l.label === "Approvals" && pendingCount > 0 && (
              <span className="rounded-full bg-earth-500 px-1.5 text-xs font-semibold text-white">{pendingCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
