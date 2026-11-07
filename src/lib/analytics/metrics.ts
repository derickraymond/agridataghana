export type NumericMetricRow = Record<string, unknown>;

export function sumNumeric<T extends NumericMetricRow>(rows: T[], key: keyof T = "quantity_kg" as keyof T): number {
  return rows.reduce((sum, row) => {
    const raw = row[key];
    const number = typeof raw === "number" ? raw : Number(String(raw ?? "0"));
    return sum + (Number.isFinite(number) ? number : 0);
  }, 0);
}

export type AdminMetricsInput = {
  accounts?: number;
  verified?: number;
  pending?: number;
  suspended?: number;
  farms?: number;
  listings?: number;
  orders?: number;
  harvests?: NumericMetricRow[];
  roles?: NumericMetricRow[];
  prices?: number;
  advisories?: number;
};

export type AdminMetricsSummary = {
  totalAccounts: number;
  verifiedUsers: number;
  awaitingApproval: number;
  suspendedUsers: number;
  totalFarms: number;
  activeListings: number;
  totalOrders: number;
  harvestKg: number;
  publishedPrices: number;
  publishedAdvisories: number;
  roleMix: Map<string, number>;
};

export function buildAdminMetrics(input: AdminMetricsInput): AdminMetricsSummary {
  const roleMix = new Map<string, number>();
  for (const row of input.roles ?? []) {
    const role = String(row.role ?? "unknown");
    roleMix.set(role, (roleMix.get(role) ?? 0) + 1);
  }

  return {
    totalAccounts: input.accounts ?? 0,
    verifiedUsers: input.verified ?? 0,
    awaitingApproval: input.pending ?? 0,
    suspendedUsers: input.suspended ?? 0,
    totalFarms: input.farms ?? 0,
    activeListings: input.listings ?? 0,
    totalOrders: input.orders ?? 0,
    harvestKg: sumNumeric(input.harvests ?? [], "quantity_kg"),
    publishedPrices: input.prices ?? 0,
    publishedAdvisories: input.advisories ?? 0,
    roleMix,
  };
}
