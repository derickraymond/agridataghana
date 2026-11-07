import { describe, expect, it } from "vitest";
import { ANALYTICS_ROLES } from "./roles";

describe("ANALYTICS_ROLES", () => {
  it("covers the business roles that should see a shared analytics dashboard", () => {
    expect(ANALYTICS_ROLES).toEqual(
      expect.arrayContaining(["administrator", "farmer", "buyer", "exporter"]),
    );
  });
});
