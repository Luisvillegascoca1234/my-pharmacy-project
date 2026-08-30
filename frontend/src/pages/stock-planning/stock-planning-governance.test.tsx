import { act } from "react";
import { createRoot } from "react-dom/client";
import type { StockPlanningEngineState, StockPlanningExecution, StockPlanningGlobalConfiguration } from "@/modules/stock-planning";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { StockPlanningGovernance } from "./stock-planning-governance";

const configuration: StockPlanningGlobalConfiguration = {
  id: "configuration-2",
  coverageDays: 30,
  engineEnabled: true,
  frequency: "daily",
  localTime: "02:00",
  maturityThresholds: {
    minimumDemandDays: 7,
    minimumHistoryWeeks: 4,
    operationalDemandDays: 21
  },
  serviceLevels: { critical: 0.99, high: 0.95, normal: 0.9 },
  timezone: "America/La_Paz",
  version: 2,
  weekday: null,
  createdAt: "2026-07-23T00:00:00.000Z",
  createdByUserId: "superadmin-1"
};

const executions: StockPlanningExecution[] = [
  makeExecution("succeeded"),
  makeExecution("succeeded_with_warnings"),
  makeExecution("failed")
];

function makeExecution(status: StockPlanningExecution["status"]): StockPlanningExecution {
  return {
    completedAt: "2026-07-23T07:02:00.000Z",
    configuration,
    configurationVersion: 2,
    demandCutoffDate: "2026-07-22",
    durationMs: 120000,
    engineVersion: "1.0.0",
    fingerprint: `fingerprint-${status}`,
    globalError: status === "failed" ? "internal" : null,
    id: status,
    scheduledFor: null,
    startedAt: "2026-07-23T07:00:00.000Z",
    status,
    stockCapturedAt: "2026-07-23T07:00:00.000Z",
    trigger: "manual",
    warnings: status === "succeeded_with_warnings" ? ["product warning"] : []
  };
}

function makeState(overrides: Partial<StockPlanningEngineState> = {}): StockPlanningEngineState {
  return {
    configuration,
    executionInProgress: false,
    latestExecution: executions[0],
    nextExpectedAt: "2026-07-24T06:00:00.000Z",
    stale: false,
    staleReasons: [],
    ...overrides
  };
}

let cleanup: (() => Promise<void>) | undefined;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  globalThis.ResizeObserver = class ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  };
});

afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

async function renderGovernance(canGovern: boolean, state = makeState(), operation: "idle" | "running" | "saving" = "idle") {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const onRun = vi.fn().mockResolvedValue(true);
  const onSave = vi.fn().mockResolvedValue(true);

  await act(async () => {
    root.render(
      <StockPlanningGovernance
        canGovern={canGovern}
        configuration={configuration}
        engineState={state}
        error={null}
        executions={executions}
        operation={operation}
        onRun={onRun}
        onSave={onSave}
      />
    );
  });
  cleanup = async () => {
    await act(async () => root.unmount());
    container.remove();
  };
  return { container, onRun, onSave };
}

describe("stock planning governance UI", () => {
  it("gives admin execution visibility without governance controls", async () => {
    const { container } = await renderGovernance(false);

    expect(container.textContent).toContain("Consulta administrativa sin facultades de gobierno global");
    expect(container.textContent).toContain("Exitosa");
    expect(container.textContent).toContain("Con advertencias");
    expect(container.textContent).toContain("Fallida");
    expect(findButton(container, "Recalcular ahora")).toBeUndefined();
    expect(findButton(container, "Guardar política")).toBeUndefined();
  });

  it("shows stale communication and disables recalculation while an execution is running", async () => {
    const { container } = await renderGovernance(
      true,
      makeState({
        executionInProgress: true,
        stale: true,
        staleReasons: ["configuration_changed"]
      })
    );

    expect(container.textContent).toContain("El resultado vigente está pendiente de actualización");
    const button = findButton(container, "Cálculo en curso");
    expect(button?.disabled).toBe(true);
  });

  it("submits business-facing schedule, coverage, levels and maturity thresholds", async () => {
    const { container, onSave } = await renderGovernance(true);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onSave).toHaveBeenCalledWith({
      coverageDays: 30,
      engineEnabled: true,
      frequency: "daily",
      localTime: "02:00",
      maturityThresholds: {
        minimumDemandDays: 7,
        minimumHistoryWeeks: 4,
        operationalDemandDays: 21
      },
      serviceLevels: { critical: 0.99, high: 0.95, normal: 0.9 },
      weekday: null
    });
    expect(container.textContent).not.toMatch(/cron|hiperparámetro/i);
  });
});

function findButton(container: HTMLElement, label: string) {
  return Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes(label));
}
