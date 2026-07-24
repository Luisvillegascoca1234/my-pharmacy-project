export type SyntheticProfile = "small" | "standard" | "stress";
export type SyntheticScenarioKind =
  | "stable"
  | "weekly"
  | "intermittent"
  | "growing"
  | "no_demand"
  | "stockout"
  | "outbreak";

export type SyntheticScenario = {
  syntheticProductCode: string;
  commercialName: string;
  kind: SyntheticScenarioKind;
  knownTruth: Array<{ date: string; latentDemand: number; observedDemand: number; censored: boolean }>;
};

const PROFILE_SETTINGS = {
  small: { products: 25, months: 6 },
  standard: { products: 250, months: 24 },
  stress: { products: 2_500, months: 24 }
} as const;

export function generateSyntheticForecastScenarios(input: {
  profile: SyntheticProfile;
  seed: number;
  endDate?: string;
}): SyntheticScenario[] {
  if (!Number.isSafeInteger(input.seed)) {
    throw new Error("Synthetic scenario seed must be a safe integer.");
  }
  const settings = PROFILE_SETTINGS[input.profile];
  const random = mulberry32(input.seed >>> 0);
  const end = new Date(`${input.endDate ?? "2026-06-30"}T00:00:00.000Z`);
  if (Number.isNaN(end.getTime())) {
    throw new Error("Synthetic scenario end date must be a valid ISO calendar date.");
  }
  const days = Math.round(settings.months * 30.4375);
  const kinds: SyntheticScenarioKind[] = [
    "stable", "weekly", "intermittent", "growing", "no_demand", "stockout", "outbreak"
  ];
  return Array.from({ length: settings.products }, (_, productIndex) => {
    const kind = kinds[productIndex % kinds.length]!;
    const base = 1 + Math.floor(random() * 12);
    const truth = Array.from({ length: days }, (_, dayIndex) => {
      const date = addDays(end, dayIndex - days + 1);
      const weekday = date.getUTCDay();
      const latentDemand = generateDemand({ kind, base, dayIndex, weekday, random });
      const censored = kind === "stockout" && dayIndex % 29 >= 24;
      return {
        date: date.toISOString().slice(0, 10),
        latentDemand,
        observedDemand: censored ? 0 : latentDemand,
        censored
      };
    });
    return {
      syntheticProductCode: `SYN-${String(productIndex + 1).padStart(5, "0")}`,
      commercialName: `Producto farmacéutico ficticio ${String(productIndex + 1).padStart(5, "0")}`,
      kind,
      knownTruth: truth
    };
  });
}

export function assertSyntheticGenerationAllowed(input: {
  nodeEnv: string;
  databaseIsEmpty: boolean;
  destructiveReplace: boolean;
}) {
  if (input.nodeEnv === "production") {
    throw new Error("Synthetic stock-planning data is disabled in production.");
  }
  if (!input.databaseIsEmpty && !input.destructiveReplace) {
    throw new Error("Synthetic generation requires an empty database or the explicit --replace flag.");
  }
}

function generateDemand(input: {
  kind: SyntheticScenarioKind;
  base: number;
  dayIndex: number;
  weekday: number;
  random: () => number;
}) {
  if (input.kind === "no_demand") return 0;
  const weekly = input.kind === "weekly" && [1, 5].includes(input.weekday) ? 2.2 : 1;
  const trend = input.kind === "growing" ? 1 + input.dayIndex / 500 : 1;
  const outbreak = input.kind === "outbreak" && input.dayIndex % 181 < 12 ? 3.5 : 1;
  const occurrence = input.kind === "intermittent" ? input.random() < 0.18 : input.random() < 0.88;
  if (!occurrence) return 0;
  const overdispersed = negativeBinomial(input.base, input.random);
  return Math.max(0, Math.round(overdispersed * weekly * trend * outbreak));
}

function negativeBinomial(mean: number, random: () => number) {
  const dispersion = 2;
  const gammaRate =
    -Math.log(Math.max(1e-12, random() * random())) * (mean / dispersion);
  return poisson(gammaRate, random);
}

function poisson(rate: number, random: () => number) {
  const threshold = Math.exp(-rate);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > threshold);
  return count - 1;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4_294_967_296;
  };
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
