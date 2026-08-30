import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./infrastructure/prisma/prisma.client.js";
import { startStockPlanningScheduler } from "./modules/stock-planning/stock-planning.scheduler.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
  console.log(`Swagger available on http://localhost:${env.PORT}/api/docs`);
});

const schedulerPromise = env.STOCK_PLANNING_SCHEDULER_ENABLED
  ? startStockPlanningScheduler().catch((error) => {
      console.error("Stock planning scheduler failed to start.", error);
      return undefined;
    })
  : Promise.resolve(undefined);

if (!env.STOCK_PLANNING_SCHEDULER_ENABLED) {
  console.log("Stock planning scheduler is disabled.");
}

let shutdownInProgress = false;

async function shutdown(signal: NodeJS.Signals) {
  if (shutdownInProgress) {
    return;
  }

  shutdownInProgress = true;
  console.log(`Received ${signal}. Shutting down gracefully.`);

  const cleanupResults = await Promise.allSettled([
    closeServer(),
    schedulerPromise.then((scheduler) => scheduler?.stop())
  ]);

  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Prisma shutdown failed.", error);
    process.exitCode = 1;
  }

  for (const result of cleanupResults) {
    if (result.status === "rejected") {
      console.error("Backend shutdown step failed.", result.reason);
      process.exitCode = 1;
    }
  }

  console.log("Backend shutdown completed.");
}

function closeServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
