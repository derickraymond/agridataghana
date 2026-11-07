import { describe, expect, it } from "vitest";
import { buildAdminMetrics, sumNumeric } from "./metrics";

describe("analytics metrics", () => {
  it("sums numeric values from records", () => {
    expect(sumNumeric([{ quantity_kg: 10 }, { quantity_kg: "12.5" }, { quantity_kg: null }])).toBe(22.5);
  });

  it("builds a summary for the platform metrics page", () => {
    const metrics = buildAdminMetrics({
      accounts: 120,
      verified: 95,
      pending: 12,
      suspended: 3,
      farms: 40,
      listings: 28,
      orders: 50,
      harvests: [{ quantity_kg: 1000 }, { quantity_kg: "2000" }],
      roles: [{ role: "farmer" }, { role: "farmer" }, { role: "buyer" }],
      prices: 8,
      advisories: 15,
    });

    expect(metrics.totalAccounts).toBe(120);
    expect(metrics.verifiedUsers).toBe(95);
    expect(metrics.harvestKg).toBe(3000);
    expect(metrics.roleMix.get("farmer")).toBe(2);
    expect(metrics.roleMix.get("buyer")).toBe(1);
    expect(metrics.publishedPrices).toBe(8);
    expect(metrics.publishedAdvisories).toBe(15);
  });
});
