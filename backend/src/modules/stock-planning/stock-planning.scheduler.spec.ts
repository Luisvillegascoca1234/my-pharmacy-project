import { describe, expect, it, vi } from "vitest";
import { startStockPlanningScheduler } from "./stock-planning.scheduler.js";

describe("stock planning scheduler", () => {
  it("keeps a retryable tick when startup recovery fails", async () => {
    const callbacks: Array<() => void> = [];
    const errors: unknown[] = [];
    const service = {
      reconstructPreviousSnapshotIfMissing: vi.fn()
        .mockRejectedValueOnce(new Error("database unavailable"))
        .mockResolvedValue(undefined),
      captureDailySnapshot: vi.fn().mockResolvedValue(undefined),
      recoverOneMissedExecution: vi.fn().mockResolvedValue(undefined),
      runDueScheduledExecution: vi.fn().mockResolvedValue(undefined)
    };
    const timer = { unref: vi.fn() };

    await startStockPlanningScheduler(
      service,
      ((callback: () => void) => {
        callbacks.push(callback);
        return timer;
      }),
      (_message, error) => errors.push(error)
    );

    expect(errors).toHaveLength(1);
    expect(callbacks).toHaveLength(1);
    expect(timer.unref).toHaveBeenCalledOnce();

    callbacks[0]();
    await vi.waitFor(() => expect(service.recoverOneMissedExecution).toHaveBeenCalledOnce());
    expect(service.reconstructPreviousSnapshotIfMissing).toHaveBeenCalledTimes(2);
    expect(service.captureDailySnapshot).toHaveBeenCalledOnce();
  });

  it("rechecks snapshot reconstruction and prevents overlapping ticks", async () => {
    const callbacks: Array<() => void> = [];
    let releaseCapture: (() => void) | undefined;
    const captureBlocked = new Promise<void>((resolve) => {
      releaseCapture = resolve;
    });
    const service = {
      reconstructPreviousSnapshotIfMissing: vi.fn().mockResolvedValue(undefined),
      captureDailySnapshot: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockReturnValueOnce(captureBlocked),
      recoverOneMissedExecution: vi.fn().mockResolvedValue(undefined),
      runDueScheduledExecution: vi.fn().mockResolvedValue(undefined)
    };

    await startStockPlanningScheduler(
      service,
      ((callback: () => void) => {
        callbacks.push(callback);
        return { unref: vi.fn() };
      }),
      vi.fn()
    );

    callbacks[0]();
    await vi.waitFor(() => expect(service.captureDailySnapshot).toHaveBeenCalledTimes(2));
    callbacks[0]();
    expect(service.captureDailySnapshot).toHaveBeenCalledTimes(2);

    releaseCapture?.();
    await vi.waitFor(() => expect(service.runDueScheduledExecution).toHaveBeenCalledOnce());
    expect(service.reconstructPreviousSnapshotIfMissing).toHaveBeenCalledTimes(2);
  });
});
