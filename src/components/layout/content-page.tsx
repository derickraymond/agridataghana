import { Badge, Alert, Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CONTENT } from "@/lib/config/content";

export function ContentPage({ slug }: { slug: string }) {
  const page = CONTENT[slug];
  return (
    <>
      <section className="field-pattern text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8 lg:py-20">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-fresh-400">{page.eyebrow}</p>
            {page.status && <Badge tone="earth">{page.status}</Badge>}
          </div>
          <h1 className="mt-3 text-4xl font-semibold lg:text-5xl">{page.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-forest-100">{page.intro}</p>
          {page.cta && (
            <div className="mt-8">
              <ButtonLink href={page.cta.href} variant="fresh" size="lg">
                {page.cta.label}
              </ButtonLink>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-14 lg:px-8">
        {page.legalDraft && (
          <Alert tone="warning">This document is a working draft and must be reviewed by a qualified Ghanaian lawyer before public launch.</Alert>
        )}
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-2xl font-semibold text-forest-900">{s.heading}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="mt-3 max-w-3xl leading-relaxed text-charcoal-700">
                {p}
              </p>
            ))}
            {s.items && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {s.items.map((i) => (
                  <Card key={i.title}>
                    <h3 className="font-semibold text-forest-900">{i.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-charcoal-500">{i.text}</p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
