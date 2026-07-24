import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { StockPlanningDetailData } from "@/modules/stock-planning";
import { StockPlanningDetail } from "./stock-planning-detail";

let cleanup: (() => Promise<void>) | undefined;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
  document.body.innerHTML = "";
});

const detailData = {
  analytics: {
    demand: [{
      band80: [6, 12],
      censored: false,
      censoredMarker: null,
      date: "2026-07-22",
      demand: 8,
      forecast: 9
    }],
    stock: [{
      date: "2026-07-22",
      stock: 14,
      target: 20
    }],
    performance: [{
      bias: -0.2,
      date: "2026-07-23T06:00:00.000Z",
      executionId: "execution-2",
      scaledError: 0.8
    }]
  },
  detail: {
    product: {
      id: "product-1",
      internalCode: "MED-001",
      commercialName: "Paracetamol 500 mg",
      status: "inactive",
      baseUnitAbbreviation: "tab"
    },
    execution: {
      id: "execution-2",
      configurationVersion: 2,
      engineVersion: "forecast-v1",
      fingerprint: "fingerprint-2"
    },
    result: {
      maturity: "operational",
      confidence: "medium",
      model: "holt",
      historyDays: 120,
      demandDays: 25,
      censoredDays: 3,
      formula: "max(stock_minimo, cuantil_demanda) - stock_utilizable",
      parameters: { alpha: 0.3 },
      recommendation: { targetStock: 20 },
      observations: [],
      forecast: []
    },
    snapshots: [{
      date: "2026-07-23",
      lots: [{
        batchId: "batch-1",
        batchNumber: "LT-001",
        expirationDate: "2027-01-31",
        status: "active",
        availableQuantity: 14
      }]
    }],
    history: [
      {
        executionId: "execution-2",
        startedAt: "2026-07-23T06:00:00.000Z",
        confidence: "medium"
      },
      {
        executionId: "execution-1",
        startedAt: "2026-07-22T06:00:00.000Z",
        confidence: "low"
      }
    ],
    comparison: {
      demand: { current: 12, delta: 2, previous: 10 },
      targetStock: { current: 20, delta: 1, previous: 19 },
      suggestedQuantity: { current: 7, delta: -3, previous: 10 },
      model: { current: "holt", previous: "moving_average" },
      confidence: { current: "medium", previous: "low" }
    },
    laterFailedExecutions: [{
      executionId: "execution-3",
      startedAt: "2026-07-24T06:00:00.000Z",
      completedAt: "2026-07-24T06:01:00.000Z",
      globalError: "controlled"
    }],
    recommendationAvailable: false,
    timezone: "America/La_Paz"
  }
} as unknown as StockPlanningDetailData;

describe("stock planning temporal detail", () => {
  it("renders the three analytical charts, history selector and protected inactive state", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onExecutionChange = vi.fn();

    await act(async () => {
      root.render(
        <StockPlanningDetail
          data={detailData}
          open
          status="success"
          onExecutionChange={onExecutionChange}
          onOpenChange={vi.fn()}
          onRetry={vi.fn()}
        />
      );
    });
    cleanup = async () => act(async () => root.unmount());

    expect(document.body.textContent).toContain("Demanda real frente a pronóstico");
    expect(document.body.textContent).toContain("Stock frente a meta");
    expect(document.body.textContent).toContain("Error y sesgo históricos");
    expect(document.body.querySelectorAll("[data-chart]")).toHaveLength(3);
    expect(document.body.textContent).toContain("Se conserva la última ejecución exitosa");
    expect(document.body.textContent).toContain("Historia conservada sin recomendación vigente");
    expect(document.body.textContent).toContain("LT-001");
    expect(document.body.textContent).toContain("10 → 12 tab");
    expect(document.body.textContent).toContain("Promedio móvil → Tendencia de Holt");
    expect(document.body.querySelectorAll("select option")).toHaveLength(2);

    const select = document.body.querySelector("select")!;
    await act(async () => {
      select.value = "execution-1";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onExecutionChange).toHaveBeenCalledWith("product-1", "execution-1");
  });

  it("communicates empty analytical series and absent model parameters", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const emptyData = {
      ...detailData,
      analytics: { demand: [], performance: [], stock: [] },
      detail: {
        ...detailData.detail,
        result: { ...detailData.detail.result, parameters: {} },
        snapshots: []
      }
    } as StockPlanningDetailData;

    await act(async () => {
      root.render(
        <StockPlanningDetail
          data={emptyData}
          open
          status="success"
          onExecutionChange={vi.fn()}
          onOpenChange={vi.fn()}
          onRetry={vi.fn()}
        />
      );
    });
    cleanup = async () => act(async () => root.unmount());

    expect(document.body.textContent).toContain("No hay observaciones ni trayectoria");
    expect(document.body.textContent).toContain("No hay snapshots de inventario");
    expect(document.body.textContent).toContain("No hay métricas históricas comparables");
    expect(document.body.textContent).toContain("no utilizó parámetros de modelo");
  });
});
