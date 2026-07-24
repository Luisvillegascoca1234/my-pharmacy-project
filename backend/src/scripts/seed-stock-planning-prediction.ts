import { fileURLToPath } from "node:url";
import { prisma } from "../infrastructure/prisma/prisma.client.js";
import {
  parsePredictionSeedArguments,
  seedStockPlanningPrediction
} from "./stock-planning-prediction-seed.js";

export async function main(argumentsList = process.argv.slice(2)) {
  const options = parsePredictionSeedArguments(argumentsList);
  const result = await seedStockPlanningPrediction(prisma, options);
  console.log(JSON.stringify({
    disclaimer: "Datos ficticios; no válidos para uso sanitario ni regulatorio.",
    ...result.summary
  }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
