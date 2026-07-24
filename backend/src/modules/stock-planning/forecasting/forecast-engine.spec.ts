import { describe, expect, it } from "vitest";
import {
  buildDailyDemand,
  forecastDemand,
  MAX_HISTORY_DAYS,
  type DemandPoint
} from "./forecast-engine.js";

describe("explainable forecast engine", () => {
  it("builds net base-unit demand, fills available zero days, censors stockouts and preserves peaks", () => {
    const points = buildDailyDemand({
      historyStartDate: "2026-01-01",
      historyEndDate: "2026-01-05",
      sales: [
        { date: "2026-01-01", quantity: 10 },
        { date: "2026-01-03", quantity: 100 },
        { date: "2026-01-05", quantity: 2 }
      ],
      returns: [
        { date: "2026-01-01", quantity: 3 },
        { date: "2026-01-05", quantity: 9 }
      ],
      unavailableDates: new Set(["2026-01-02"])
    });

    expect(points).toEqual([
      { date: "2026-01-01", grossDemand: 10, returnedQuantity: 3, netDemand: 7, censored: false },
      { date: "2026-01-02", grossDemand: 0, returnedQuantity: 0, netDemand: 0, censored: true },
      { date: "2026-01-03", grossDemand: 100, returnedQuantity: 0, netDemand: 100, censored: false },
      { date: "2026-01-04", grossDemand: 0, returnedQuantity: 0, netDemand: 0, censored: false },
      { date: "2026-01-05", grossDemand: 2, returnedQuantity: 9, netDemand: 0, censored: false }
    ]);
  });

  it("keeps only the most recent 24 months", () => {
    const points = buildDailyDemand({
      historyStartDate: "2020-01-01",
      historyEndDate: "2026-01-01",
      sales: [],
      returns: [],
      unavailableDates: new Set()
    });
    expect(points).toHaveLength(MAX_HISTORY_DAYS);
    expect(points.at(-1)?.date).toBe("2026-01-01");
  });

  it.each([
    { days: 83, demandDays: 20, maturity: "no_history", confidence: "none" },
    { days: 84, demandDays: 8, maturity: "low_confidence", confidence: "low" },
    { days: 84, demandDays: 20, maturity: "operational", confidence: expect.stringMatching(/low|medium|high/) },
    { days: 84, demandDays: 0, maturity: "no_observed_demand", confidence: "none" }
  ])("classifies maturity using versioned evidence rules: $maturity", ({ days, demandDays, maturity, confidence }) => {
    const points = series(days, (index) => index < demandDays ? 2 : 0);
    const result = forecastDemand(points, 30);
    expect(result.maturity).toBe(maturity);
    expect(result.confidence).toEqual(confidence);
  });

  it("excludes censored zeroes, retains the baseline unless a candidate improves it, and is deterministic", () => {
    const points = series(180, (index) => index % 7 === 0 ? 20 : 2)
      .map((point, index) => index % 23 === 0 ? { ...point, netDemand: 0, censored: true } : point);
    const first = forecastDemand(points, 30);
    const second = forecastDemand(points, 30);

    expect(first).toEqual(second);
    expect(first.model).not.toBeNull();
    expect(first.metrics.evaluatedPoints).toBeGreaterThan(0);
    expect(first.fingerprint).toHaveLength(64);
    expect(first.warnings).toContain("censored_days_excluded");
  });

  it("uses the simple baseline when candidates tie", () => {
    const result = forecastDemand(series(120, () => 4), 30);
    expect(result.model).toBe("recent_naive");
    expect(result.warnings).toContain("baseline_retained");
    expect(result.confidence).toBe("low");
  });

  it("keeps censored dates in the calendar without scoring their unknown demand", () => {
    const points = series(140, (index) => index % 7 === 0 ? 18 : 1)
      .map((point, index) => index % 19 === 0 ? { ...point, netDemand: 0, censored: true } : point);
    const result = forecastDemand(points, 14);

    expect(result.metrics.evaluatedPoints).toBeLessThan(70);
    expect(result.metrics.evaluatedPoints).toBeGreaterThan(0);
    expect(result.forecast).toHaveLength(14);
    expect(result.warnings).toContain("censored_days_excluded");
  });

  it("includes maturity thresholds and published output in the reproducibility fingerprint", () => {
    const points = series(120, (index) => index < 10 ? 2 : 0);
    const defaultRules = forecastDemand(points, 30);
    const stricterRules = forecastDemand(points, 30, {
      minimumHistoryWeeks: 12,
      minimumDemandDays: 4,
      operationalDemandDays: 8
    });

    expect(defaultRules.maturity).toBe("low_confidence");
    expect(stricterRules.maturity).toBe("operational");
    expect(defaultRules.fingerprint).not.toBe(stricterRules.fingerprint);
  });

  it("publishes no negative demand or interval bound for intermittent and trending histories", () => {
    for (const points of [
      series(240, (index) => index % 17 === 0 ? 30 : 0),
      series(240, (index) => index % 5 === 0 ? index / 20 : 1)
    ]) {
      const result = forecastDemand(points, 90);
      expect(result.forecast).toHaveLength(90);
      for (const point of result.forecast) {
        expect(point.central).toBeGreaterThanOrEqual(0);
        expect(point.lower80).toBeGreaterThanOrEqual(0);
        expect(point.upper80).toBeGreaterThanOrEqual(point.lower80);
      }
    }
  });

  it("degrades operational maturity when censorship makes quality insufficient", () => {
    const points = series(120, () => 4).map((point, index) => ({ ...point, censored: index % 2 === 0 }));
    const result = forecastDemand(points, 30);
    expect(result.maturity).toBe("low_confidence");
    expect(result.confidence).toBe("low");
    expect(result.warnings).toContain("high_censorship");
  });
});

function series(days: number, demand: (index: number) => number): DemandPoint[] {
  const start = new Date("2025-01-01T00:00:00.000Z");
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    const value = demand(index);
    return {
      date: date.toISOString().slice(0, 10),
      grossDemand: value,
      returnedQuantity: 0,
      netDemand: value,
      censored: false
    };
  });
}
