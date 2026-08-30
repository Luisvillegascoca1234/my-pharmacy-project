import { describe, expect, it } from "vitest";
import {
  assertSyntheticGenerationAllowed,
  generateSyntheticForecastScenarios
} from "./synthetic-scenarios.js";

describe("synthetic stock-planning scenarios", () => {
  it("is deterministic by seed and keeps known latent truth without predictions", () => {
    const first = generateSyntheticForecastScenarios({ profile: "small", seed: 42 });
    const second = generateSyntheticForecastScenarios({ profile: "small", seed: 42 });
    expect(first).toEqual(second);
    expect(first).toHaveLength(25);
    expect(first[0]?.knownTruth[0]).toEqual(expect.objectContaining({
      latentDemand: expect.any(Number),
      observedDemand: expect.any(Number),
      censored: expect.any(Boolean)
    }));
    expect(first[0]).not.toHaveProperty("prediction");
  });

  it("provides the standard 250-product, 24-month profile and all agreed scenario families", () => {
    const scenarios = generateSyntheticForecastScenarios({ profile: "standard", seed: 7 });
    expect(scenarios).toHaveLength(250);
    expect(scenarios[0]?.knownTruth).toHaveLength(731);
    expect(new Set(scenarios.map((scenario) => scenario.kind))).toEqual(new Set([
      "stable", "weekly", "intermittent", "growing", "no_demand", "stockout", "outbreak"
    ]));
  });

  it("refuses production and requires an empty database unless replacement is explicit", () => {
    expect(() => assertSyntheticGenerationAllowed({
      nodeEnv: "production", databaseIsEmpty: true, destructiveReplace: false
    })).toThrow(/disabled in production/);
    expect(() => assertSyntheticGenerationAllowed({
      nodeEnv: "development", databaseIsEmpty: false, destructiveReplace: false
    })).toThrow(/empty database/);
    expect(() => assertSyntheticGenerationAllowed({
      nodeEnv: "development", databaseIsEmpty: false, destructiveReplace: true
    })).not.toThrow();
  });

  it("rejects ambiguous seeds and invalid end dates", () => {
    expect(() => generateSyntheticForecastScenarios({
      profile: "small",
      seed: Number.NaN
    })).toThrow(/safe integer/);
    expect(() => generateSyntheticForecastScenarios({
      profile: "small",
      seed: 42,
      endDate: "not-a-date"
    })).toThrow(/valid ISO calendar date/);
  });
});
