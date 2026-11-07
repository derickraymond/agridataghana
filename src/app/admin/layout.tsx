import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="field-pattern hidden flex-col justify-between p-12 text-white lg:flex">
        <Link href="/">
          <Logo light />
        </Link>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">Administrative access portal</h2>
          <p className="mt-4 max-w-md text-forest-100">Secure sign-in for platform administrators and system operators.</p>
        </div>
        <p className="text-sm text-forest-200">Access is restricted to verified administrator accounts.</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block lg:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
