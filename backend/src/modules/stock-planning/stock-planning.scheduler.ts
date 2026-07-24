import { StockPlanningExecutionService } from "./stock-planning-execution.service.js";
import { ForecastService } from "./forecasting/forecast.service.js";

const CHECK_INTERVAL_MS = 60_000;

type StockPlanningSchedulerPort = Pick<
  StockPlanningExecutionService,
  | "reconstructPreviousSnapshotIfMissing"
  | "captureDailySnapshot"
  | "recoverOneMissedExecution"
  | "runDueScheduledExecution"
>;

type SchedulerTimer = {
  unref(): unknown;
};

export async function startStockPlanningScheduler(
  service: StockPlanningSchedulerPort = new StockPlanningExecutionService(
    undefined,
    undefined,
    new ForecastService()
  ),
  setTimer: (callback: () => void, intervalMs: number) => SchedulerTimer =
    (callback, intervalMs) => setInterval(callback, intervalMs),
  reportError: (message: string, error: unknown) => void = console.error
) {
  let startupRecoveryCompleted = false;
  let tickInProgress = false;

  const tick = async () => {
    if (tickInProgress) {
      return;
    }
    tickInProgress = true;
    try {
      await service.reconstructPreviousSnapshotIfMissing();
      await service.captureDailySnapshot();
      if (startupRecoveryCompleted) {
        await service.runDueScheduledExecution();
      } else {
        await service.recoverOneMissedExecution();
        startupRecoveryCompleted = true;
      }
    } catch (error) {
      reportError("Stock planning scheduler tick failed.", error);
    } finally {
      tickInProgress = false;
    }
  };

  await tick();
  const timer = setTimer(() => void tick(), CHECK_INTERVAL_MS);
  timer.unref();
  return timer;
}
