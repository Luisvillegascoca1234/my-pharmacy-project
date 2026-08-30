import { describe, expect, it } from "vitest";
import {
  calculateAccumulatedQuantile,
  calculateReplenishment,
  simulateFefo
} from "./replenishment-engine.js";

describe("replenishment engine", () => {
  it("uses the greater of minimum stock and the accumulated demand quantile", () => {
    const result = calculateReplenishment({
      businessDate: "2026-07-23",
      minimumStock: 20,
      serviceLevel: 0.9,
      forecast: [
        { date: "2026-07-24", central: 2, lower80: 1, upper80: 3 },
        { date: "2026-07-25", central: 2, lower80: 1, upper80: 3 }
      ],
      batches: []
    });

    expect(result.demandQuantile).toBeLessThan(20);
    expect(result.targetStock).toBe(20);
    expect(result.suggestedQuantity).toBe(20);
  });

  it("applies increasing protection at 90, 95 and 99 percent without changing central demand", () => {
    const forecast = [
      { date: "2026-07-24", central: 10, lower80: 5, upper80: 15 },
      { date: "2026-07-25", central: 10, lower80: 5, upper80: 15 }
    ];
    const normal = calculateAccumulatedQuantile(forecast, 0.9);
    const high = calculateAccumulatedQuantile(forecast, 0.95);
    const critical = calculateAccumulatedQuantile(forecast, 0.99);

    expect(normal).toBeLessThan(high);
    expect(high).toBeLessThan(critical);
    expect(forecast.reduce((sum, point) => sum + point.central, 0)).toBe(20);
  });

  it("simulates FEFO and separates consumable, expiry-risk and unusable stock", () => {
    const result = simulateFefo(
      "2026-07-23",
      [
        { date: "2026-07-24", central: 3, lower80: 2, upper80: 4 },
        { date: "2026-07-25", central: 3, lower80: 2, upper80: 4 }
      ],
      [
        { id: "expired", expirationDate: "2026-07-22", status: "active", availableQuantity: 2 },
        { id: "blocked", expirationDate: "2026-08-20", status: "blocked", availableQuantity: 4 },
        { id: "near", expirationDate: "2026-07-24", status: "active", availableQuantity: 5 },
        { id: "later", expirationDate: "2026-08-20", status: "active", availableQuantity: 10 }
      ]
    );

    expect(result).toEqual({
      usableStock: 13,
      expiryRiskStock: 2,
      unusableStock: 6
    });
  });

  it("marks the remainder of a partially consumable lot as expiry risk and rounds upward", () => {
    const result = calculateReplenishment({
      businessDate: "2026-07-23",
      minimumStock: 20,
      serviceLevel: 0.9,
      forecast: [
        { date: "2026-07-24", central: 2, lower80: 2, upper80: 2 },
        { date: "2026-07-25", central: 2, lower80: 2, upper80: 2 }
      ],
      batches: [
        { id: "near", expirationDate: "2026-07-24", status: "active", availableQuantity: 10 }
      ],
      presentationFactor: 6
    });

    expect(result.expiryRiskStock).toBe(8);
    expect(result.usableStock).toBe(2);
    expect(result.unroundedSuggestion).toBe(18);
    expect(result.suggestedQuantity).toBe(18);
  });

  it("never emits a negative suggestion", () => {
    const result = calculateReplenishment({
      businessDate: "2026-07-23",
      minimumStock: 5,
      serviceLevel: 0.99,
      forecast: [{ date: "2026-07-24", central: 1, lower80: 1, upper80: 1 }],
      batches: [
        { id: "long-dated", expirationDate: "2027-07-24", status: "active", availableQuantity: 20 }
      ],
      presentationFactor: 6
    });

    expect(result.suggestedQuantity).toBe(0);
    expect(result.wasRounded).toBe(false);
  });

  it("uses the real coverage end when FEFO receives unsorted forecast points", () => {
    const result = simulateFefo(
      "2026-07-23",
      [
        { date: "2026-07-25", central: 1, lower80: 1, upper80: 1 },
        { date: "2026-07-24", central: 1, lower80: 1, upper80: 1 }
      ],
      [
        { id: "near", expirationDate: "2026-07-25", status: "active", availableQuantity: 5 }
      ]
    );

    expect(result).toEqual({
      usableStock: 2,
      expiryRiskStock: 3,
      unusableStock: 0
    });
  });

  it("rejects non-finite numeric inputs instead of publishing invalid quantities", () => {
    expect(() => calculateReplenishment({
      businessDate: "2026-07-23",
      minimumStock: Number.NaN,
      serviceLevel: 0.9,
      forecast: [],
      batches: []
    })).toThrow("Minimum stock must be a finite non-negative number.");
  });
});
