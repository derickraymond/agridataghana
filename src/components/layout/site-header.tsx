import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { NAV_GROUPS } from "@/lib/config/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/features/authentication/actions";

export async function SiteHeader() {
  const current = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-charcoal-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" aria-label="AgriData Ghana home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_GROUPS.map((g) => (
            <div key={g.label} className="group relative">
              <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-charcoal-700 hover:bg-forest-50">
                {g.label} <ChevronDown className="h-4 w-4" />
              </button>
              <div className="invisible absolute left-0 top-full w-60 rounded-xl border border-charcoal-200 bg-white p-2 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                {g.items.map((i) => (
                  <Link key={i.href} href={i.href} className="block rounded-lg px-3 py-2 text-sm text-charcoal-700 hover:bg-forest-50 hover:text-forest-800">
                    {i.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {current ? (
            <>
              <ButtonLink href="/dashboard" size="sm">
                Dashboard
              </ButtonLink>
              <form action={signOut}>
                <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Register
              </ButtonLink>
            </>
          )}
        </div>

        <details className="relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-lg p-2 text-forest-800 hover:bg-forest-50" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </summary>
          <div className="absolute right-0 top-full mt-2 max-h-[80vh] w-72 overflow-y-auto rounded-xl border border-charcoal-200 bg-white p-3 shadow-xl">
            {NAV_GROUPS.map((g) => (
              <div key={g.label} className="mb-2">
                <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-charcoal-500">{g.label}</p>
                {g.items.map((i) => (
                  <Link key={i.href} href={i.href} className="block rounded-lg px-3 py-2 text-sm text-charcoal-700 hover:bg-forest-50">
                    {i.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="flex gap-2 border-t border-charcoal-200 pt-3">
              {current ? (
                <ButtonLink href="/dashboard" size="sm" className="flex-1">
                  Dashboard
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/login" variant="outline" size="sm" className="flex-1">
                    Log in
                  </ButtonLink>
                  <ButtonLink href="/register" size="sm" className="flex-1">
                    Register
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
