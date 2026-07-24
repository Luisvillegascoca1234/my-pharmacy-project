export type ReplenishmentForecastPoint = {
  date: string;
  central: number;
  lower80: number;
  upper80: number;
};

export type ReplenishmentBatch = {
  id: string;
  expirationDate: string | null;
  status: "active" | "depleted" | "blocked" | "cancelled";
  availableQuantity: number;
};

export type ReplenishmentInput = {
  businessDate: string;
  minimumStock: number;
  serviceLevel: number;
  forecast: ReplenishmentForecastPoint[];
  batches: ReplenishmentBatch[];
  presentationFactor?: number;
};

export type ReplenishmentResult = {
  centralDemand: number;
  demandQuantile: number;
  safetyStock: number;
  targetStock: number;
  usableStock: number;
  expiryRiskStock: number;
  unusableStock: number;
  unroundedSuggestion: number;
  suggestedQuantity: number;
  wasRounded: boolean;
};

const CENTRAL_80_Z = 1.2815515655446004;

export function calculateReplenishment(input: ReplenishmentInput): ReplenishmentResult {
  assertInput(input);

  const forecast = [...input.forecast].sort((first, second) => first.date.localeCompare(second.date));
  const centralDemand = sum(forecast.map((point) => point.central));
  const demandQuantile = calculateAccumulatedQuantile(forecast, input.serviceLevel);
  const safetyStock = Math.max(0, demandQuantile - centralDemand);
  const targetStock = Math.max(input.minimumStock, demandQuantile);
  const stock = simulateFefo(input.businessDate, forecast, input.batches);
  const unroundedSuggestion = Math.max(0, targetStock - stock.usableStock);
  const suggestedQuantity = input.presentationFactor
    ? roundUpToMultiple(unroundedSuggestion, input.presentationFactor)
    : unroundedSuggestion;

  return {
    centralDemand,
    demandQuantile,
    safetyStock,
    targetStock,
    ...stock,
    unroundedSuggestion,
    suggestedQuantity,
    wasRounded: suggestedQuantity > unroundedSuggestion
  };
}

export function calculateAccumulatedQuantile(
  forecast: ReplenishmentForecastPoint[],
  serviceLevel: number
) {
  if (forecast.length === 0) return 0;

  const central = sum(forecast.map((point) => point.central));
  const variance = sum(forecast.map((point) => {
    const standardDeviation = Math.max(0, point.upper80 - point.lower80) / (2 * CENTRAL_80_Z);
    return standardDeviation ** 2;
  }));
  const quantile = central + inverseStandardNormal(serviceLevel) * Math.sqrt(variance);
  return Math.max(0, quantile);
}

export function simulateFefo(
  businessDate: string,
  forecast: ReplenishmentForecastPoint[],
  batches: ReplenishmentBatch[]
) {
  const orderedForecast = [...forecast].sort((first, second) => first.date.localeCompare(second.date));
  const eligible = batches
    .filter((batch) =>
      batch.status === "active" &&
      batch.availableQuantity > 0 &&
      (!batch.expirationDate || batch.expirationDate >= businessDate)
    )
    .map((batch) => ({ ...batch, remaining: batch.availableQuantity }))
    .sort(compareBatchesFefo);
  const unusableStock = sum(
    batches
      .filter((batch) =>
        batch.availableQuantity > 0 &&
        (batch.status !== "active" || Boolean(batch.expirationDate && batch.expirationDate < businessDate))
      )
      .map((batch) => batch.availableQuantity)
  );

  for (const point of orderedForecast) {
    let demand = point.central;

    for (const batch of eligible) {
      if (demand <= 0) break;
      if (batch.remaining <= 0 || (batch.expirationDate && batch.expirationDate < point.date)) continue;
      const consumed = Math.min(batch.remaining, demand);
      batch.remaining -= consumed;
      demand -= consumed;
    }
  }

  const coverageEnd = orderedForecast.at(-1)?.date ?? businessDate;
  const expiryRiskStock = sum(
    eligible
      .filter((batch) =>
        batch.remaining > 0 &&
        Boolean(batch.expirationDate && batch.expirationDate <= coverageEnd)
      )
      .map((batch) => batch.remaining)
  );
  const eligibleStock = sum(eligible.map((batch) => batch.availableQuantity));

  return {
    usableStock: Math.max(0, eligibleStock - expiryRiskStock),
    expiryRiskStock,
    unusableStock
  };
}

function compareBatchesFefo(first: ReplenishmentBatch, second: ReplenishmentBatch) {
  if (!first.expirationDate && !second.expirationDate) return first.id.localeCompare(second.id);
  if (!first.expirationDate) return 1;
  if (!second.expirationDate) return -1;
  return first.expirationDate.localeCompare(second.expirationDate) || first.id.localeCompare(second.id);
}

function roundUpToMultiple(quantity: number, multiple: number) {
  if (quantity === 0) return 0;
  return Math.ceil((quantity - Number.EPSILON) / multiple) * multiple;
}

function assertInput(input: ReplenishmentInput) {
  if (!Number.isFinite(input.minimumStock) || input.minimumStock < 0) {
    throw new Error("Minimum stock must be a finite non-negative number.");
  }
  if (!Number.isFinite(input.serviceLevel) || !(input.serviceLevel > 0 && input.serviceLevel < 1)) {
    throw new Error("Service level must be between zero and one.");
  }
  if (
    input.presentationFactor !== undefined &&
    (!Number.isFinite(input.presentationFactor) || input.presentationFactor <= 0)
  ) {
    throw new Error("Presentation factor must be a finite positive number.");
  }
  for (const point of input.forecast) {
    if (
      !Number.isFinite(point.central) ||
      !Number.isFinite(point.lower80) ||
      !Number.isFinite(point.upper80) ||
      point.central < 0 ||
      point.lower80 < 0 ||
      point.upper80 < point.lower80
    ) {
      throw new Error("Forecast values must be non-negative and ordered.");
    }
  }
  for (const batch of input.batches) {
    if (!Number.isFinite(batch.availableQuantity) || batch.availableQuantity < 0) {
      throw new Error("Batch quantities must be finite and non-negative.");
    }
  }
}

// Acklam's rational approximation; deterministic and sufficiently precise for business quantiles.
function inverseStandardNormal(probability: number) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269,
    -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972,
    -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  const high = 1 - low;

  if (probability < low) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (probability > high) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  const q = probability - 0.5;
  const r = q * q;
  return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
