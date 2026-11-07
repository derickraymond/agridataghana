import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/features/authentication/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  return (
    <div className="min-h-screen bg-charcoal-50">
      <header className="border-b border-charcoal-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" aria-label="AgriData Ghana home">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-charcoal-700 sm:inline">{current.profile?.full_name ?? current.user.email}</span>
            <form action={signOut}>
              <button className="rounded-lg px-3 py-1.5 font-medium text-charcoal-700 hover:bg-charcoal-50">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
