import Link from "next/link";
import {
  ArrowRight, BadgeCheck, CloudSun, Landmark, LineChart, MapPin, QrCode, Sprout, Store, Tractor, Users, Wheat,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { GHANA_REGIONS, REGISTRATION_TYPES } from "@/lib/config/roles";

const COMMODITIES = ["Maize", "Rice", "Cocoa", "Cashew", "Soybeans", "Cassava", "Yam", "Plantain", "Tomatoes", "Pepper", "Onions", "Groundnuts"];

const previews = [
  { icon: Store, title: "Marketplace", text: "Verified produce listings with quality grades, quantities and seller profiles.", href: "/marketplace", phase: 3 },
  { icon: LineChart, title: "Commodity prices", text: "Sourced, dated market prices by region with trends and alerts.", href: "/commodity-prices", phase: 6 },
  { icon: CloudSun, title: "Weather & advisory", text: "Location-specific forecasts and farming guidance.", href: "/weather", phase: 6 },
];

const steps = [
  { n: "01", title: "Register & verify", text: "Choose your role and verify your account." },
  { n: "02", title: "Build your profile", text: "Add farms, crops or business details." },
  { n: "03", title: "Trade with confidence", text: "List, enquire, quote and order with clear records." },
  { n: "04", title: "Track & grow", text: "Traceability, reports and market insight." },
];

const benefits = [
  { icon: Sprout, title: "Farmers", points: ["Digital farm and harvest records", "Direct access to buyers", "Prices and advisory for your area"], href: "/for-farmers" },
  { icon: Users, title: "Cooperatives", points: ["Member and produce management", "Bulk listings and contracts", "Statements and reports"], href: "/for-cooperatives" },
  { icon: Wheat, title: "Buyers & exporters", points: ["Discover verified suppliers", "Quotations and purchase orders", "Batch traceability records"], href: "/for-buyers" },
];

const services = [
  { icon: MapPin, title: "Farm mapping", href: "/for-farmers" },
  { icon: Tractor, title: "Equipment & inputs", href: "/equipment" },
  { icon: Landmark, title: "Financial services", href: "/financial-services" },
  { icon: QrCode, title: "Traceability", href: "/traceability" },
  { icon: BadgeCheck, title: "Verification", href: "/how-it-works" },
  { icon: LineChart, title: "Analytics", href: "/partnerships" },
];

export default function Home() {
  return (
    <>
      <section className="field-pattern relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-5 lg:px-8 lg:py-28">
          <div className="lg:col-span-3">
            <Badge tone="earth" className="bg-earth-100/90">Ghana&apos;s agricultural data platform</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">
              From farm records to <span className="text-fresh-400">fair markets</span>, in one trusted platform.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-forest-100">
              AgriData Ghana connects farmers, cooperatives, agro-dealers, buyers and exporters with secure records,
              a transparent marketplace and traceable supply chains.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register" variant="fresh" size="lg">Join as a Farmer</ButtonLink>
              <ButtonLink href="/marketplace" variant="light" size="lg">Find Produce</ButtonLink>
              <ButtonLink href="/register" variant="outlineLight" size="lg">Register as a Buyer</ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-2">
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-widest text-fresh-400">Commodities</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {COMMODITIES.map((c) => (
                  <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-sm">{c}</span>
                ))}
              </div>
              <p className="mt-5 text-sm text-forest-100">…and other agricultural produce across all {GHANA_REGIONS.length} regions.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-b border-charcoal-200 bg-charcoal-50">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-center lg:grid-cols-4 lg:px-8">
          {[
            [`${GHANA_REGIONS.length}`, "Regions supported"],
            [`${REGISTRATION_TYPES.length}`, "Account types"],
            [`${COMMODITIES.length}+`, "Core commodities"],
            ["Act 843", "Data protection by design"],
          ].map(([v, l]) => (
            <div key={l}>
              <dd className="font-display text-3xl font-semibold text-forest-800">{v}</dd>
              <dt className="mt-1 text-sm text-charcoal-500">{l}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <h2 className="text-3xl font-semibold text-forest-900">Market intelligence, marketplace and advisory</h2>
        <p className="mt-2 max-w-2xl text-charcoal-500">These modules open as live data sources are connected. We never show invented figures as real data.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {previews.map((p) => (
            <Link key={p.title} href={p.href} className="group">
              <Card className="h-full transition group-hover:border-fresh-500 group-hover:shadow-md">
                <p.icon className="h-8 w-8 text-fresh-600" />
                <h3 className="mt-4 text-lg font-semibold text-forest-900">{p.title}</h3>
                <p className="mt-1 text-sm text-charcoal-500">{p.text}</p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge tone="earth">Phase {p.phase}</Badge>
                  <ArrowRight className="h-4 w-4 text-forest-700 transition group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-forest-50">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <h2 className="text-3xl font-semibold text-forest-900">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n}>
                <p className="font-display text-4xl text-fresh-500">{s.n}</p>
                <h3 className="mt-2 font-semibold text-forest-900">{s.title}</h3>
                <p className="mt-1 text-sm text-charcoal-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <h2 className="text-3xl font-semibold text-forest-900">Built for every part of the value chain</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {benefits.map((b) => (
            <Card key={b.title}>
              <b.icon className="h-8 w-8 text-forest-700" />
              <h3 className="mt-4 text-lg font-semibold text-forest-900">{b.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-charcoal-700">
                {b.points.map((p) => (
                  <li key={p} className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-fresh-600" />{p}</li>
                ))}
              </ul>
              <Link href={b.href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-charcoal-50">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <h2 className="text-3xl font-semibold text-forest-900">Agricultural services</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {services.map((s) => (
              <Link key={s.title} href={s.href} className="flex flex-col items-center gap-3 rounded-xl border border-charcoal-200 bg-white p-5 text-center text-sm font-medium text-forest-900 transition hover:border-fresh-500">
                <s.icon className="h-7 w-7 text-fresh-600" />
                {s.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-earth-50">
            <h2 className="text-2xl font-semibold text-forest-900">Become a partner</h2>
            <p className="mt-2 text-sm text-charcoal-700">Government agencies, financial institutions, NGOs and agribusinesses are invited to partner with us.</p>
            <div className="mt-5"><ButtonLink href="/partnerships" variant="outline">Partnership options</ButtonLink></div>
          </Card>
          <Card className="bg-forest-900 text-white">
            <h2 className="text-2xl font-semibold">Questions?</h2>
            <p className="mt-2 text-sm text-forest-100">Talk to the AgriData Ghana team or browse the Help Centre.</p>
            <div className="mt-5 flex gap-3">
              <ButtonLink href="/contact" variant="fresh">Contact us</ButtonLink>
              <ButtonLink href="/help" variant="outlineLight">Help Centre</ButtonLink>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
