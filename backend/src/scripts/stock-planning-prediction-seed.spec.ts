import { describe, expect, it } from "vitest";
import {
  buildPredictionSeedPlan,
  parsePredictionSeedArguments
} from "./stock-planning-prediction-seed.js";

describe("stock-planning prediction seed", () => {
  it("builds the seven deterministic scenarios ending the day before as-of", () => {
    const first = buildPredictionSeedPlan({ asOf: "2026-07-23", seed: 42 });
    const second = buildPredictionSeedPlan({ asOf: "2026-07-23", seed: 42 });

    expect(first).toEqual(second);
    expect(first.historyEnd).toBe("2026-07-22");
    expect(first.scenarios.map((scenario) => scenario.kind)).toEqual([
      "stable",
      "weekly",
      "intermittent",
      "growing",
      "no_demand",
      "stockout",
      "outbreak"
    ]);
    expect(new Set(first.scenarios.map((scenario) => scenario.internalCode)).size).toBe(7);
  });

  it("keeps FEFO consumptions and final inventory reconcilable", () => {
    const plan = buildPredictionSeedPlan({ asOf: "2026-07-23", seed: 20260723 });

    for (const scenario of plan.scenarios) {
      const consumedByBatch = new Map<string, number>();
      for (const day of scenario.days) {
        expect(day.consumptions.reduce((sum, value) => sum + value.quantity, 0))
          .toBe(day.observedDemand);
        for (const consumption of day.consumptions) {
          consumedByBatch.set(
            consumption.batchId,
            (consumedByBatch.get(consumption.batchId) ?? 0) + consumption.quantity
          );
        }
      }
      for (const batch of scenario.batches) {
        expect(batch.originalQuantity - (consumedByBatch.get(batch.id) ?? 0))
          .toBe(batch.availableQuantity);
      }
    }
  });

  it("represents stockout censorship with zero snapshots and later restorations", () => {
    const plan = buildPredictionSeedPlan({ asOf: "2026-07-23", seed: 7 });
    const stockout = plan.scenarios.find((scenario) => scenario.kind === "stockout")!;
    const censoredDays = stockout.days.filter((day) => day.censored);

    expect(censoredDays.length).toBeGreaterThan(0);
    expect(stockout.batches.length).toBeGreaterThan(1);
    expect(censoredDays.every((day) =>
      day.snapshots.reduce((sum, snapshot) => sum + snapshot.availableQuantity, 0) === 0
    )).toBe(true);
  });

  it("requires explicit valid arguments", () => {
    expect(parsePredictionSeedArguments([
      "--as-of=2026-07-23",
      "--seed=42"
    ])).toEqual({ asOf: "2026-07-23", seed: 42 });
    expect(() => parsePredictionSeedArguments(["--seed=42"])).toThrow(/--as-of/);
    expect(() => parsePredictionSeedArguments([
      "--as-of=2026-02-30",
      "--seed=42"
    ])).toThrow(/calendar date/);
  });
});
