import { writeFile } from "node:fs/promises";
import { env } from "../config/env.js";
import { prisma } from "../infrastructure/prisma/prisma.client.js";
import {
  assertSyntheticGenerationAllowed,
  generateSyntheticForecastScenarios,
  type SyntheticProfile
} from "../modules/stock-planning/forecasting/synthetic-scenarios.js";

const argumentsSet = new Set(process.argv.slice(2));
const profileArgument = process.argv.find((value) => value.startsWith("--profile="))?.split("=")[1] ?? "standard";
const seedArgument = process.argv.find((value) => value.startsWith("--seed="))?.split("=")[1] ?? "20260723";
const outputArgument = process.argv.find((value) => value.startsWith("--output="))?.split("=")[1];
const seed = Number(seedArgument);

if (!["small", "standard", "stress"].includes(profileArgument)) {
  throw new Error("Profile must be small, standard, or stress.");
}
if (!Number.isSafeInteger(seed)) {
  throw new Error("Seed must be a safe integer.");
}
if (env.NODE_ENV === "production") {
  assertSyntheticGenerationAllowed({
    nodeEnv: env.NODE_ENV,
    databaseIsEmpty: false,
    destructiveReplace: false
  });
}
const operationalCounts = await Promise.all([
  prisma.product.count(),
  prisma.purchase.count(),
  prisma.sale.count(),
  prisma.inventoryBatch.count(),
  prisma.inventorySnapshot.count(),
  prisma.stockPlanningExecution.count(),
  prisma.stockPlanningForecast.count()
]);
assertSyntheticGenerationAllowed({
  nodeEnv: env.NODE_ENV,
  databaseIsEmpty: operationalCounts.every((count) => count === 0),
  destructiveReplace: argumentsSet.has("--replace")
});
const scenarios = generateSyntheticForecastScenarios({
  profile: profileArgument as SyntheticProfile,
  seed
});
if (outputArgument) {
  await writeFile(outputArgument, JSON.stringify({
    disclaimer: "Datos ficticios; no válidos para uso sanitario ni regulatorio.",
    scenarios
  }));
}
console.log(JSON.stringify({
  profile: profileArgument,
  seed,
  products: scenarios.length,
  historyDays: scenarios[0]?.knownTruth.length ?? 0,
  predictionsCreated: 0,
  output: outputArgument ?? null
}));
await prisma.$disconnect();
