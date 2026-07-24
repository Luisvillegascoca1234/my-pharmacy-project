import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startStockPlanningScheduler } from "./modules/stock-planning/stock-planning.scheduler.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
  console.log(`Swagger available on http://localhost:${env.PORT}/api/docs`);
});

startStockPlanningScheduler().catch((error) => {
  console.error("Stock planning scheduler failed to start.", error);
});
