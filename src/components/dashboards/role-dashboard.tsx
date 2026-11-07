import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { ANALYTICS_ROLES, ROLE_LABELS, type UserRole } from "@/lib/config/roles";
import { ROLE_MODULES } from "@/lib/config/dashboard-modules";
import type { Profile } from "@/types/database";

const SELLER_ROLES: UserRole[] = ["farmer", "cooperative", "aggregator"];
import { BUSINESS_ROLES } from "@/features/organizations/constants";
const MARKET_ROLES: UserRole[] = [...SELLER_ROLES, "agro_dealer", "buyer", "processor", "exporter"];

export function RoleDashboard({ profile, role }: { profile: Profile; role: UserRole }) {
  const modules = ROLE_MODULES[role];
  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-forest-900">Welcome, {profile.full_name.split(" ")[0]}</h1>
          <Badge>{ROLE_LABELS[role]}</Badge>
          <Badge tone={profile.verification_status === "verified" ? "green" : "earth"}>
            {profile.verification_status === "verified" ? "Verified" : "Verification " + profile.verification_status}
          </Badge>
        </div>
        <p className="mt-2 text-charcoal-500">
          {profile.location ?? "Location not set"}
          {profile.phone ? ` · ${profile.phone}` : ""}
        </p>
      </div>

      {MARKET_ROLES.includes(role) && (
        <section aria-labelledby="market" className="space-y-3">
          <h2 id="market" className="text-xl font-semibold text-forest-900">
            Marketplace
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SELLER_ROLES.includes(role) && (
              <Link href="/dashboard/listings">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <h3 className="font-semibold text-forest-900">My listings</h3>
                  <p className="mt-1 text-sm text-charcoal-500">Publish produce for sale and track approval.</p>
                </Card>
              </Link>
            )}
            {BUSINESS_ROLES.includes(role) && (
              <Link href="/dashboard/organization">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <h3 className="font-semibold text-forest-900">My organisation</h3>
                  <p className="mt-1 text-sm text-charcoal-500">Organisation profile, verification and members.</p>
                </Card>
              </Link>
            )}
            <Link href="/dashboard/orders">
              <Card className="h-full transition-shadow hover:shadow-md">
                <h3 className="font-semibold text-forest-900">Orders</h3>
                <p className="mt-1 text-sm text-charcoal-500">Orders placed and received, delivery and payment records.</p>
              </Card>
            </Link>
            <Link href="/dashboard/enquiries">
              <Card className="h-full transition-shadow hover:shadow-md">
                <h3 className="font-semibold text-forest-900">Enquiries</h3>
                <p className="mt-1 text-sm text-charcoal-500">Messages and replies about listings.</p>
              </Card>
            </Link>
            <Link href="/marketplace">
              <Card className="h-full transition-shadow hover:shadow-md">
                <h3 className="font-semibold text-forest-900">Browse marketplace</h3>
                <p className="mt-1 text-sm text-charcoal-500">Find produce by crop, region and price.</p>
              </Card>
            </Link>
          </div>
        </section>
      )}

      <section aria-labelledby="intel" className="space-y-3">
        <h2 id="intel" className="text-xl font-semibold text-forest-900">
          Prices &amp; advice
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ANALYTICS_ROLES.includes(role) && (
            <Link href="/dashboard/analytics">
              <Card className="h-full transition-shadow hover:shadow-md">
                <h3 className="font-semibold text-forest-900">Analytics</h3>
                <p className="mt-1 text-sm text-charcoal-500">Role-based overview of farms, listings, orders and market activity.</p>
              </Card>
            </Link>
          )}
          {role === "extension_agent" && (
            <Link href="/dashboard/advisories">
              <Card className="h-full transition-shadow hover:shadow-md">
                <h3 className="font-semibold text-forest-900">My advisories</h3>
                <p className="mt-1 text-sm text-charcoal-500">Submit farming advice for review and publishing.</p>
              </Card>
            </Link>
          )}
          {role === "farmer" && (
            <Link href="/dashboard/traceability">
              <Card className="h-full transition-shadow hover:shadow-md">
                <h3 className="font-semibold text-forest-900">Traceability</h3>
                <p className="mt-1 text-sm text-charcoal-500">Create batches and QR labels from your harvests.</p>
              </Card>
            </Link>
          )}
          <Link href="/commodity-prices">
            <Card className="h-full transition-shadow hover:shadow-md">
              <h3 className="font-semibold text-forest-900">Commodity prices</h3>
              <p className="mt-1 text-sm text-charcoal-500">Published market prices with sources.</p>
            </Card>
          </Link>
          <Link href="/weather">
            <Card className="h-full transition-shadow hover:shadow-md">
              <h3 className="font-semibold text-forest-900">Weather &amp; advisory</h3>
              <p className="mt-1 text-sm text-charcoal-500">Regional forecasts and published advice.</p>
            </Card>
          </Link>
        </div>
      </section>

      {modules.length > 0 && (
      <section aria-labelledby="modules">
        <h2 id="modules" className="text-xl font-semibold text-forest-900">
          Your workspace
        </h2>
        <p className="mt-1 text-sm text-charcoal-500">Modules are released in phases. Unreleased modules are shown so you can see what is coming.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Card key={m.title}>
              <Badge tone="grey">Planned · Phase {m.phase}</Badge>
              <h3 className="mt-3 font-semibold text-forest-900">{m.title}</h3>
              <p className="mt-1 text-sm text-charcoal-500">{m.description}</p>
            </Card>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
