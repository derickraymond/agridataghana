import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { LEGAL_LINKS, NAV_GROUPS } from "@/lib/config/navigation";

export function SiteFooter() {
  return (
    <footer className="bg-forest-900 text-forest-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo light />
          <p className="mt-4 text-sm text-forest-200">
            Digital infrastructure connecting Ghana&apos;s farmers, cooperatives, dealers and buyers.
          </p>
        </div>
        {NAV_GROUPS.map((g) => (
          <nav key={g.label} aria-label={g.label}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{g.label}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {g.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="text-forest-200 hover:text-white">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-forest-200 sm:flex-row sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} AgriData Ghana. All rights reserved.</p>
          <p className="flex gap-4">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
