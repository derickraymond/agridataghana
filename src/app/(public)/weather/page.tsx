import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config/env";
import { Alert, Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { GHANA_REGIONS } from "@/lib/config/roles";
import { getForecasts } from "@/lib/weather";

export const metadata = { title: "Weather & Advisory" };
export const dynamic = "force-dynamic";

const CATEGORY: Record<string, string> = {
  planting: "Planting & harvesting",
  pest_disease: "Pest & disease",
  weather_alert: "Weather alert",
  market: "Market",
  general: "General",
};

type Advisory = {
  id: string;
  title: string;
  body: string;
  category: string;
  region: string | null;
  published_at: string | null;
  crops: { name: string } | null;
};

const day = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });

export default async function Page({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region = "" } = await searchParams;
  const selected = (GHANA_REGIONS as readonly string[]).includes(region) ? region : "Greater Accra";
  const forecasts = await getForecasts();
  const forecast = forecasts?.find((f) => f.region === selected);

  let advisories: Advisory[] = [];
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("advisories")
      .select("id, title, body, category, region, published_at, crops(name)")
      .eq("status", "published")
      .or(`region.is.null,region.eq.${selected}`)
      .order("published_at", { ascending: false })
      .limit(30);
    advisories = (data as unknown as Advisory[] | null) ?? [];
  }

  return (
    <>
      <section className="field-pattern text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-fresh-400">Agricultural information</p>
          <h1 className="mt-3 text-4xl font-semibold lg:text-5xl">Weather and advisory</h1>
          <p className="mt-4 max-w-3xl text-lg text-forest-100">Five-day forecasts for each region and advice published by administrators and extension agents.</p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 lg:px-8">
        <form className="flex flex-wrap gap-3 rounded-xl border border-charcoal-200 bg-white p-4" role="search">
          <Select name="region" defaultValue={selected} aria-label="Region" className="sm:w-64">
            {GHANA_REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          <Button>Show region</Button>
        </form>

        <section aria-label="Forecast" className="space-y-3">
          <h2 className="text-2xl font-semibold text-forest-900">
            Forecast — {selected}
            {forecast ? ` (${forecast.town})` : ""}
          </h2>
          {!forecast ? (
            <Alert tone="warning">The weather service could not be reached just now. No forecast figures are shown. Please try again shortly.</Alert>
          ) : (
            <>
              {forecast.currentC !== null && <p className="text-charcoal-700">Currently {Math.round(forecast.currentC)}°C.</p>}
              <div className="grid gap-3 sm:grid-cols-5">
                {forecast.days.map((d) => (
                  <Card key={d.date} className="space-y-1 p-4 text-center">
                    <p className="text-sm font-semibold text-forest-900">{day(d.date)}</p>
                    <p className="text-lg font-semibold text-forest-800">
                      {Math.round(d.maxC)}° <span className="text-sm font-normal text-charcoal-500">/ {Math.round(d.minC)}°</span>
                    </p>
                    <p className="text-sm text-charcoal-700">{d.rainMm.toFixed(1)} mm rain</p>
                    {d.rainChance !== null && <p className="text-xs text-charcoal-500">{d.rainChance}% chance</p>}
                  </Card>
                ))}
              </div>
              <p className="text-xs text-charcoal-500">Forecast data from Open-Meteo for the regional capital; conditions can differ across the region.</p>
            </>
          )}
        </section>

        <section aria-label="Advisories" className="space-y-3">
          <h2 className="text-2xl font-semibold text-forest-900">Advisories</h2>
          {advisories.length === 0 ? (
            <Card className="border-dashed text-center text-sm text-charcoal-500">No advisories have been published for this region yet.</Card>
          ) : (
            advisories.map((a) => (
              <Card key={a.id} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={a.category === "weather_alert" || a.category === "pest_disease" ? "earth" : "green"}>{CATEGORY[a.category]}</Badge>
                  {a.crops?.name && <Badge tone="grey">{a.crops.name}</Badge>}
                  <Badge tone="grey">{a.region ?? "All regions"}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-forest-900">{a.title}</h3>
                <p className="whitespace-pre-wrap text-sm text-charcoal-700">{a.body}</p>
              </Card>
            ))
          )}
        </section>
      </div>
    </>
  );
}
