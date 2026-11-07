import type { GHANA_REGIONS } from "@/lib/config/roles";

type Region = (typeof GHANA_REGIONS)[number];

// Regional capitals used as forecast points.
export const REGION_POINTS: Record<Region, { town: string; lat: number; lon: number }> = {
  Ahafo: { town: "Goaso", lat: 6.8, lon: -2.52 },
  Ashanti: { town: "Kumasi", lat: 6.69, lon: -1.62 },
  Bono: { town: "Sunyani", lat: 7.34, lon: -2.33 },
  "Bono East": { town: "Techiman", lat: 7.59, lon: -1.94 },
  Central: { town: "Cape Coast", lat: 5.11, lon: -1.25 },
  Eastern: { town: "Koforidua", lat: 6.09, lon: -0.26 },
  "Greater Accra": { town: "Accra", lat: 5.6, lon: -0.19 },
  "North East": { town: "Nalerigu", lat: 10.53, lon: -0.37 },
  Northern: { town: "Tamale", lat: 9.4, lon: -0.84 },
  Oti: { town: "Dambai", lat: 8.07, lon: 0.18 },
  Savannah: { town: "Damongo", lat: 9.08, lon: -1.82 },
  "Upper East": { town: "Bolgatanga", lat: 10.79, lon: -0.85 },
  "Upper West": { town: "Wa", lat: 10.06, lon: -2.5 },
  Volta: { town: "Ho", lat: 6.61, lon: 0.47 },
  Western: { town: "Sekondi-Takoradi", lat: 4.93, lon: -1.76 },
  "Western North": { town: "Sefwi Wiawso", lat: 6.2, lon: -2.49 },
};

export interface DayForecast {
  date: string;
  maxC: number;
  minC: number;
  rainMm: number;
  rainChance: number | null;
}
export interface RegionForecast {
  region: string;
  town: string;
  currentC: number | null;
  days: DayForecast[];
}

interface OpenMeteoPoint {
  current?: { temperature_2m?: number };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max?: (number | null)[];
  };
}

// Live forecasts from Open-Meteo (no API key). Returns null when the provider is unreachable.
export async function getForecasts(): Promise<RegionForecast[] | null> {
  const entries = Object.entries(REGION_POINTS);
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${entries.map(([, p]) => p.lat).join(",")}` +
    `&longitude=${entries.map(([, p]) => p.lon).join(",")}` +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max" +
    "&current=temperature_2m&timezone=Africa%2FAccra&forecast_days=5";
  try {
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as OpenMeteoPoint[];
    if (!Array.isArray(json) || json.length !== entries.length) return null;
    return entries.map(([region, p], i) => {
      const d = json[i].daily;
      return {
        region,
        town: p.town,
        currentC: json[i].current?.temperature_2m ?? null,
        days: (d?.time ?? []).map((date, k) => ({
          date,
          maxC: d!.temperature_2m_max[k],
          minC: d!.temperature_2m_min[k],
          rainMm: d!.precipitation_sum[k],
          rainChance: d!.precipitation_probability_max?.[k] ?? null,
        })),
      };
    });
  } catch {
    return null;
  }
}
