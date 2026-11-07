import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="field-pattern hidden flex-col justify-between p-12 text-white lg:flex">
        <Link href="/">
          <Logo light />
        </Link>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">Farm records, markets and traceability in one trusted platform.</h2>
          <p className="mt-4 max-w-md text-forest-100">Built for Ghana&apos;s farmers, cooperatives, agro-dealers, buyers and exporters.</p>
        </div>
        <p className="text-sm text-forest-200">Your data is protected in line with Ghana&apos;s Data Protection Act, 2012 (Act 843).</p>
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
