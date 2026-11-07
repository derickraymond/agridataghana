import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";

// Public module page for features whose live data source is not connected yet.
export function PendingModulePage({
  eyebrow,
  title,
  intro,
  phase,
  features,
  emptyTitle,
  emptyText,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  phase: number;
  features: string[];
  emptyTitle: string;
  emptyText: string;
}) {
  return (
    <>
      <section className="field-pattern text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8 lg:py-20">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-fresh-400">{eyebrow}</p>
            <Badge tone="earth">Planned — Phase {phase}</Badge>
          </div>
          <h1 className="mt-3 text-4xl font-semibold lg:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-forest-100">{intro}</p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-14 lg:px-8">
        <Card className="border-dashed text-center">
          <h2 className="text-xl font-semibold text-forest-900">{emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-charcoal-500">{emptyText}</p>
          <div className="mt-5 flex justify-center gap-3">
            <ButtonLink href="/register">Create an account</ButtonLink>
            <ButtonLink href="/contact" variant="outline">
              Contact us
            </ButtonLink>
          </div>
        </Card>
        <section>
          <h2 className="text-2xl font-semibold text-forest-900">What is coming</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="rounded-lg border border-charcoal-200 bg-white px-4 py-3 text-sm text-charcoal-700">
                {f}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
