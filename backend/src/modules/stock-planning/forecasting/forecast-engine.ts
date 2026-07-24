import { createHash } from "node:crypto";

export const FORECAST_ENGINE_VERSION = "explainable-forecast-v1";
export const FORECAST_RULES_VERSION = "maturity-confidence-v1";
export const MAX_HISTORY_DAYS = 731;
const CENTRAL_INTERVAL_Z = 1.2815515655446004;

export type DemandPoint = {
  date: string;
  grossDemand: number;
  returnedQuantity: number;
  netDemand: number;
  censored: boolean;
};

export type ForecastModelName =
  | "recent_naive"
  | "seasonal_naive_weekly"
  | "moving_average"
  | "simple_exponential_smoothing"
  | "holt"
  | "croston_sba"
  | "tsb";

export type ForecastMetrics = {
  scaledError: number;
  meanAbsoluteError: number;
  bias: number;
  evaluatedPoints: number;
};

export type ForecastResult = {
  maturity: "no_history" | "low_confidence" | "operational" | "no_observed_demand";
  confidence: "none" | "low" | "medium" | "high";
  model: ForecastModelName | null;
  parameters: Record<string, number | string | boolean>;
  metrics: ForecastMetrics;
  fingerprint: string;
  warnings: string[];
  observed: DemandPoint[];
  forecast: Array<{ date: string; central: number; lower80: number; upper80: number }>;
};

type Candidate = {
  name: ForecastModelName;
  complexity: number;
  parameters: Record<string, number | string | boolean>;
  predict: (values: Array<number | null>, horizon?: number) => number;
};

export function buildDailyDemand(input: {
  historyStartDate: string;
  historyEndDate: string;
  sales: Array<{ date: string; quantity: number }>;
  returns: Array<{ date: string; quantity: number }>;
  unavailableDates: ReadonlySet<string>;
}): DemandPoint[] {
  const end = parseDate(input.historyEndDate);
  const earliestAllowed = addDays(end, -(MAX_HISTORY_DAYS - 1));
  const start = new Date(Math.max(parseDate(input.historyStartDate).getTime(), earliestAllowed.getTime()));
  const sales = sumByDate(input.sales);
  const returns = sumByDate(input.returns);
  const result: DemandPoint[] = [];
  for (let date = start; date.getTime() <= end.getTime(); date = addDays(date, 1)) {
    const key = formatDate(date);
    const grossDemand = nonNegative(sales.get(key) ?? 0);
    const returnedQuantity = nonNegative(returns.get(key) ?? 0);
    result.push({
      date: key,
      grossDemand,
      returnedQuantity,
      netDemand: nonNegative(grossDemand - returnedQuantity),
      censored: input.unavailableDates.has(key)
    });
  }
  return result;
}

export function forecastDemand(
  points: DemandPoint[],
  horizonDays: number,
  thresholds = { minimumHistoryWeeks: 12, minimumDemandDays: 4, operationalDemandDays: 12 }
): ForecastResult {
  if (points.length === 0) {
    throw new Error("At least one daily demand point is required.");
  }
  if (!Number.isInteger(horizonDays) || horizonDays <= 0) {
    throw new Error("Forecast horizon must be a positive whole number of days.");
  }
  const observed = points.slice(-MAX_HISTORY_DAYS);
  const trainable = observed.filter((point) => !point.censored);
  const values = trainable.map((point) => point.netDemand);
  const calendarValues = observed.map((point) => point.censored ? null : point.netDemand);
  const demandDays = values.filter((value) => value > 0).length;
  const minimumHistoryDays = thresholds.minimumHistoryWeeks * 7;
  const warnings: string[] = [];
  const censoredRatio = observed.filter((point) => point.censored).length / observed.length;

  if (censoredRatio > 0) warnings.push("censored_days_excluded");
  if (censoredRatio > 0.3) warnings.push("high_censorship");

  let maturity: ForecastResult["maturity"];
  if (observed.length >= minimumHistoryDays && demandDays === 0) {
    maturity = "no_observed_demand";
    warnings.push("no_observed_demand");
  } else if (observed.length < minimumHistoryDays || demandDays < thresholds.minimumDemandDays) {
    maturity = "no_history";
    warnings.push("insufficient_history");
  } else if (demandDays < thresholds.operationalDemandDays || censoredRatio > 0.3) {
    maturity = "low_confidence";
    warnings.push("limited_evidence");
  } else {
    maturity = "operational";
  }

  if (maturity === "no_history" || maturity === "no_observed_demand") {
    return emptyResult(observed, horizonDays, maturity, warnings, thresholds);
  }

  const candidates = createCandidates();
  const evaluations = candidates
    .map((candidate) => ({ candidate, metrics: backtest(observed, candidate) }))
    .filter((entry) => entry.metrics.evaluatedPoints > 0);
  const baseline = evaluations.find((entry) => entry.candidate.name === "recent_naive");
  if (!baseline) {
    warnings.push("backtest_unavailable");
    return emptyResult(observed, horizonDays, "low_confidence", warnings, thresholds);
  }
  const winner = selectWinner(evaluations, baseline);
  const baselineRetained = winner.candidate.name === "recent_naive";
  if (baselineRetained) warnings.push("baseline_retained");

  const residualDeviation = Math.max(
    winner.metrics.meanAbsoluteError * 1.253314,
    standardDeviation(values.slice(-Math.min(values.length, 56)))
  );
  const start = parseDate(observed.at(-1)!.date);
  const forecast = Array.from({ length: horizonDays }, (_, index) => {
    const central = nonNegative(winner.candidate.predict(calendarValues, index + 1));
    const spread = CENTRAL_INTERVAL_Z * residualDeviation * Math.sqrt(index + 1);
    return {
      date: formatDate(addDays(start, index + 1)),
      central,
      lower80: nonNegative(central - spread),
      upper80: nonNegative(central + spread)
    };
  });
  const classifiedConfidence = classifyConfidence({
    historyDays: observed.length,
    demandDays,
    censoredRatio,
    scaledError: winner.metrics.scaledError,
    average: mean(values),
    intervalWidth: forecast[0] ? forecast[0].upper80 - forecast[0].lower80 : 0,
    maturity
  });
  const confidence = baselineRetained
    ? reduceConfidence(classifiedConfidence)
    : classifiedConfidence;
  const fingerprint = hashResult({
    observed,
    candidate: winner.candidate,
    metrics: winner.metrics,
    horizonDays,
    thresholds,
    maturity,
    confidence,
    warnings,
    forecast
  });
  return {
    maturity,
    confidence,
    model: winner.candidate.name,
    parameters: winner.candidate.parameters,
    metrics: winner.metrics,
    fingerprint,
    warnings,
    observed,
    forecast
  };
}

function createCandidates(): Candidate[] {
  return [
    {
      name: "recent_naive", complexity: 0, parameters: { lookbackDays: 7 },
      predict: (values) => mean(observedValues(values).slice(-7))
    },
    {
      name: "seasonal_naive_weekly", complexity: 1, parameters: { periodDays: 7 },
      predict: (values, horizon = 1) => {
        const seasonalIndex = values.length - 7 + ((horizon - 1) % 7);
        return values[seasonalIndex] ?? mean(observedValues(values).slice(-7));
      }
    },
    {
      name: "moving_average", complexity: 2, parameters: { windowDays: 28 },
      predict: (values) => mean(observedValues(values).slice(-28))
    },
    {
      name: "simple_exponential_smoothing", complexity: 3, parameters: { alpha: 0.3 },
      predict: (values) => ses(observedValues(values), 0.3)
    },
    {
      name: "holt", complexity: 4, parameters: { alpha: 0.3, beta: 0.1, damped: true, damping: 0.9 },
      predict: (values, horizon = 1) => holt(observedValues(values), horizon)
    },
    {
      name: "croston_sba", complexity: 5, parameters: { alpha: 0.2, biasCorrection: 0.9 },
      predict: (values) => crostonSba(observedValues(values), 0.2)
    },
    {
      name: "tsb", complexity: 6, parameters: { probabilityAlpha: 0.2, quantityAlpha: 0.2 },
      predict: (values) => tsb(observedValues(values), 0.2, 0.2)
    }
  ];
}

function backtest(points: DemandPoint[], candidate: Candidate): ForecastMetrics {
  const errors: number[] = [];
  const scaledAbsoluteErrors: number[] = [];
  const start = Math.min(Math.max(28, Math.floor(points.length / 2)), Math.max(0, points.length - 7));
  for (let index = start; index < points.length; index += 1) {
    const target = points[index]!;
    if (target.censored) continue;
    const calendarHistory = points
      .slice(0, index)
      .map((point) => point.censored ? null : point.netDemand);
    const trainingValues = observedValues(calendarHistory);
    if (trainingValues.length === 0) continue;
    const prediction = nonNegative(candidate.predict(calendarHistory, 1));
    const error = prediction - target.netDemand;
    const scaleSamples = trainingValues
      .slice(1)
      .map((value, sampleIndex) => Math.abs(value - trainingValues[sampleIndex]!));
    const scale = Math.max(mean(scaleSamples), 1e-9);
    errors.push(error);
    scaledAbsoluteErrors.push(Math.abs(error) / scale);
  }
  return {
    scaledError: round(mean(scaledAbsoluteErrors)),
    meanAbsoluteError: round(mean(errors.map(Math.abs))),
    bias: round(mean(errors)),
    evaluatedPoints: errors.length
  };
}

function selectWinner(
  evaluations: Array<{ candidate: Candidate; metrics: ForecastMetrics }>,
  baseline: { candidate: Candidate; metrics: ForecastMetrics }
) {
  const tolerance = 1e-6;
  const sorted = [...evaluations].sort((left, right) => {
    const difference = left.metrics.scaledError - right.metrics.scaledError;
    return Math.abs(difference) <= tolerance
      ? left.candidate.complexity - right.candidate.complexity
      : difference;
  });
  const best = sorted[0]!;
  return best.metrics.scaledError < baseline.metrics.scaledError - tolerance ? best : baseline;
}

function classifyConfidence(input: {
  historyDays: number; demandDays: number; censoredRatio: number; scaledError: number;
  average: number; intervalWidth: number; maturity: ForecastResult["maturity"];
}): ForecastResult["confidence"] {
  if (input.maturity === "no_history" || input.maturity === "no_observed_demand") return "none";
  let score = 0;
  if (input.historyDays >= 365) score += 2;
  else if (input.historyDays >= 168) score += 1;
  if (input.demandDays >= 52) score += 2;
  else if (input.demandDays >= 20) score += 1;
  if (input.scaledError <= 0.75) score += 2;
  else if (input.scaledError <= 1) score += 1;
  if (input.censoredRatio > 0.3) score -= 2;
  else if (input.censoredRatio > 0.1) score -= 1;
  if (input.average > 0 && input.intervalWidth / input.average > 2) score -= 1;
  if (input.maturity === "low_confidence") return "low";
  return score >= 5 ? "high" : score >= 3 ? "medium" : "low";
}

function emptyResult(
  observed: DemandPoint[],
  horizonDays: number,
  maturity: "no_history" | "low_confidence" | "no_observed_demand",
  warnings: string[],
  thresholds: { minimumHistoryWeeks: number; minimumDemandDays: number; operationalDemandDays: number }
): ForecastResult {
  const start = parseDate(observed.at(-1)!.date);
  const forecast = Array.from({ length: horizonDays }, (_, index) => ({
    date: formatDate(addDays(start, index + 1)), central: 0, lower80: 0, upper80: 0
  }));
  const metrics = { scaledError: 0, meanAbsoluteError: 0, bias: 0, evaluatedPoints: 0 };
  const confidence = "none";
  return {
    maturity, confidence, model: null, parameters: {}, metrics,
    fingerprint: hashResult({
      observed,
      candidate: null,
      metrics,
      horizonDays,
      thresholds,
      maturity,
      confidence,
      warnings,
      forecast
    }),
    warnings, observed, forecast
  };
}

function ses(values: number[], alpha: number) {
  return values.slice(1).reduce((level, value) => alpha * value + (1 - alpha) * level, values[0] ?? 0);
}

function holt(values: number[], horizon: number) {
  if (values.length < 2) return values[0] ?? 0;
  let level = values[0]!;
  let trend = values[1]! - values[0]!;
  for (const value of values.slice(1)) {
    const previous = level;
    level = 0.3 * value + 0.7 * (level + trend);
    trend = 0.1 * (level - previous) + 0.9 * trend;
  }
  const damped = Array.from({ length: horizon }, (_, index) => 0.9 ** (index + 1))
    .reduce((sum, factor) => sum + factor, 0);
  return level + trend * damped;
}

function crostonSba(values: number[], alpha: number) {
  const first = values.findIndex((value) => value > 0);
  if (first < 0) return 0;
  let quantity = values[first]!;
  let interval = first + 1;
  let elapsed = 1;
  for (const value of values.slice(first + 1)) {
    if (value > 0) {
      quantity += alpha * (value - quantity);
      interval += alpha * (elapsed - interval);
      elapsed = 1;
    } else elapsed += 1;
  }
  return (1 - alpha / 2) * quantity / Math.max(interval, 1);
}

function tsb(values: number[], probabilityAlpha: number, quantityAlpha: number) {
  const firstPositive = values.find((value) => value > 0) ?? 0;
  let probability = firstPositive > 0 ? 1 : 0;
  let quantity = firstPositive;
  for (const value of values) {
    const occurred = value > 0 ? 1 : 0;
    probability += probabilityAlpha * (occurred - probability);
    if (occurred) quantity += quantityAlpha * (value - quantity);
  }
  return probability * quantity;
}

function hashResult(input: {
  observed: DemandPoint[];
  candidate: Candidate | null;
  metrics: ForecastMetrics;
  horizonDays: number;
  thresholds: { minimumHistoryWeeks: number; minimumDemandDays: number; operationalDemandDays: number };
  maturity: ForecastResult["maturity"];
  confidence: ForecastResult["confidence"];
  warnings: string[];
  forecast: ForecastResult["forecast"];
}) {
  return createHash("sha256").update(JSON.stringify({
    engineVersion: FORECAST_ENGINE_VERSION,
    rulesVersion: FORECAST_RULES_VERSION,
    observed: input.observed,
    model: input.candidate?.name ?? null,
    parameters: input.candidate?.parameters ?? {},
    metrics: input.metrics,
    horizonDays: input.horizonDays,
    thresholds: input.thresholds,
    maturity: input.maturity,
    confidence: input.confidence,
    warnings: input.warnings,
    forecast: input.forecast
  })).digest("hex");
}

function observedValues(values: Array<number | null>) {
  return values.filter((value): value is number => value !== null);
}

function reduceConfidence(confidence: ForecastResult["confidence"]): ForecastResult["confidence"] {
  if (confidence === "high") return "medium";
  if (confidence === "medium") return "low";
  return confidence;
}

function sumByDate(entries: Array<{ date: string; quantity: number }>) {
  const result = new Map<string, number>();
  for (const entry of entries) result.set(entry.date, (result.get(entry.date) ?? 0) + entry.quantity);
  return result;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function mean(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function nonNegative(value: number) {
  return round(Math.max(0, Number.isFinite(value) ? value : 0));
}

function round(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
