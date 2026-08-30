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

export type StockPlanningScheduler = {
  stop(): Promise<void>;
};

export async function startStockPlanningScheduler(
  service: StockPlanningSchedulerPort = new StockPlanningExecutionService(
    undefined,
    undefined,
    new ForecastService()
  ),
  setTimer: (callback: () => void, intervalMs: number) => SchedulerTimer =
    (callback, intervalMs) => setInterval(callback, intervalMs),
  reportError: (message: string, error: unknown) => void = console.error,
  clearTimer: (timer: SchedulerTimer) => void = (timer) => clearInterval(timer as NodeJS.Timeout)
): Promise<StockPlanningScheduler> {
  let startupRecoveryCompleted = false;
  let stopped = false;
  let activeTick: Promise<void> | undefined;

  const executeTick = async () => {
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
    }
  };

  const runTick = () => {
    if (stopped) {
      return Promise.resolve();
    }

    if (activeTick) {
      return activeTick;
    }

    const tickPromise = executeTick();
    activeTick = tickPromise;
    void tickPromise.finally(() => {
      if (activeTick === tickPromise) {
        activeTick = undefined;
      }
    });
    return tickPromise;
  };

  await runTick();
  const timer = setTimer(() => void runTick(), CHECK_INTERVAL_MS);
  timer.unref();

  return {
    async stop() {
      stopped = true;
      clearTimer(timer);
      await activeTick;
    }
  };
}
