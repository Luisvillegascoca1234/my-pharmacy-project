import type {
  Product,
  StockPlanningEngineState,
  StockPlanningExecution,
  StockPlanningProduct,
  StockPlanningProductDetailResponse,
  StockPlanningProductsResponse
} from "@pharmacy-pos/shared";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axiosApi } from "@/api";
import { ApiError } from "@/api/ApiError";
import { useAuthStore } from "@/modules/auth";
import { stockPlanningApi } from "./api/stock-planning-api";
import { stockPlanningFacade } from "./facades/stockPlanningFacade";
import { useStockPlanning } from "./hooks/use-stock-planning";
import { selectStockPlanningActions, selectStockPlanningState } from "./store/StockPlanningSelectors";
import { resetStockPlanningStore, useStockPlanningStore } from "./store/StockPlanningStore";
import { mapStockPlanningProductAnalytics } from "./utils/stockPlanningAnalytics";
import { mapStockPlanningDetailAnalytics } from "./utils/stockPlanningDetail";
import { createStockPlanningExecutionKey } from "./utils/stockPlanningIdempotency";

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");

  return {
    ...actual,
    axiosApi: {
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn(),
      put: vi.fn()
    }
  };
});

const mockedAxiosApi = vi.mocked(axiosApi);

describe("stock planning execution idempotency", () => {
  it("creates deterministic, request-safe keys", () => {
    const key = createStockPlanningExecutionKey(1_784_822_400_000, 0.25);

    expect(key).toBe(createStockPlanningExecutionKey(1_784_822_400_000, 0.25));
    expect(key).toMatch(/^[A-Za-z0-9][A-Za-z0-9:_-]{7,127}$/);
  });
});

const planningProduct: StockPlanningProduct = {
  baseUnitAbbreviation: "tab",
  categoryId: "category-1",
  categoryName: "Analgésicos",
  commercialName: "Analgésico prueba",
  coverage: {
    days: 30,
    source: "global"
  },
  criticality: "normal",
  internalCode: "MED-001",
  maturity: "no_history",
  minimumStock: 20,
  productId: "product-1",
  result: {
    kind: "configured_reference",
    quantityBase: 12,
    wasRounded: true
  },
  supplierId: "supplier-1",
  supplierName: "Proveedor prueba",
  usableStock: 9,
  warnings: ["missing_preferred_presentation"]
};

const planningResponse: StockPlanningProductsResponse = {
  alerts: [{
    executionId: "execution-1",
    id: "alert-1",
    message: "Requiere reabastecimiento.",
    priority: "high",
    productId: "product-1",
    type: "replenishment"
  }],
  configuration: {
    coverageDays: 30,
    timezone: "America/La_Paz"
  },
  data: [planningProduct],
  groups: [{
    productIds: ["product-1"],
    summary: {
      criticalRiskCount: 0,
      expiryRiskCount: 0,
      productCount: 1,
      replenishmentCount: 1,
      staleCount: 0
    },
    supplierId: "supplier-1",
    supplierName: "Proveedor prueba"
  }],
  summary: {
    criticalRiskCount: 0,
    expiryRiskCount: 0,
    productCount: 1,
    replenishmentCount: 1,
    staleCount: 0
  }
};

const planningDataSummary = planningResponse.summary!;

const globalConfiguration = {
  id: "configuration-1",
  version: 1,
  engineEnabled: true,
  frequency: "daily" as const,
  weekday: null,
  localTime: "02:00",
  coverageDays: 30,
  timezone: "America/La_Paz" as const,
  serviceLevels: { normal: 0.9, high: 0.95, critical: 0.99 },
  maturityThresholds: {
    minimumHistoryWeeks: 12,
    minimumDemandDays: 4,
    operationalDemandDays: 12
  },
  createdAt: "2026-07-23T00:00:00.000Z",
  createdByUserId: null
};

const engineState: StockPlanningEngineState = {
  configuration: globalConfiguration,
  executionInProgress: false,
  latestExecution: null,
  nextExpectedAt: "2026-07-24T06:00:00.000Z",
  stale: false,
  staleReasons: []
};

const completedExecution: StockPlanningExecution = {
  completedAt: "2026-07-23T07:02:00.000Z",
  configuration: globalConfiguration,
  configurationVersion: 1,
  demandCutoffDate: "2026-07-22",
  durationMs: 120000,
  engineVersion: "explainable-forecast-v1",
  fingerprint: "execution-fingerprint",
  globalError: null,
  id: "execution-current",
  scheduledFor: null,
  startedAt: "2026-07-23T07:00:00.000Z",
  status: "succeeded_with_warnings",
  stockCapturedAt: "2026-07-23T07:00:00.000Z",
  trigger: "scheduled",
  warnings: ["product:product-1:controlled_failure"]
};

const forecastProduct: StockPlanningProduct = {
  ...planningProduct,
  confidence: "low",
  maturity: "low_confidence",
  forecast: {
    centralDemand: 90,
    censoredDays: 34,
    demandDays: 18,
    engineVersion: "explainable-forecast-v1",
    executionId: "execution-previous",
    fingerprint: "forecast-fingerprint",
    historyDays: 120,
    lower80: 60,
    metrics: {
      bias: -0.25,
      evaluatedPoints: 28,
      meanAbsoluteError: 1.5,
      scaledError: 0.9
    },
    model: "recent_naive",
    parameters: { window: 28 },
    points: [],
    rulesVersion: "forecast-rules-v1",
    upper80: 130
  },
  warnings: ["baseline_retained", "high_censorship", "censored_days_excluded"]
};

const productDetail = {
  product: {
    id: "product-1",
    internalCode: "MED-001",
    commercialName: "Analgésico prueba",
    status: "active",
    baseUnitAbbreviation: "tab"
  },
  execution: { id: "execution-current" },
  result: {
    recommendation: { targetStock: 30 },
    observations: [
      { date: "2026-07-20", grossDemand: 5, returnedQuantity: 1, netDemand: 4, censored: false },
      { date: "2026-07-21", grossDemand: 0, returnedQuantity: 0, netDemand: 0, censored: true }
    ],
    forecast: [
      { date: "2026-07-21", central: 6, lower80: 3, upper80: 9 },
      { date: "2026-07-22", central: 7, lower80: 4, upper80: 10 }
    ]
  },
  snapshots: [
    { date: "2026-07-20", stock: 18 },
    { date: "2026-07-22", stock: 14 }
  ],
  history: [
    { executionId: "execution-current", startedAt: "2026-07-23T06:00:00.000Z", scaledError: 0.8, bias: -0.2 },
    { executionId: "execution-previous", startedAt: "2026-07-22T06:00:00.000Z", scaledError: 1.1, bias: 0.3 }
  ]
} as StockPlanningProductDetailResponse;

describe("stock planning analytics mapping", () => {
  it("maps reference, baseline, degradation and stale fallback states", () => {
    expect(mapStockPlanningProductAnalytics(planningProduct, [])).toMatchObject({
      available: false,
      evidenceLimited: true,
      freshness: "reference",
      intervalWidth80: null
    });

    expect(mapStockPlanningProductAnalytics(forecastProduct, [completedExecution])).toEqual({
      available: true,
      baselineRetained: true,
      degraded: true,
      evidenceLimited: true,
      freshness: "stale",
      intervalWidth80: 70,
      latestCompletedExecutionId: "execution-current"
    });
  });

  it("joins demand, forecast, 80% band, stock and target while ordering performance", () => {
    const analytics = mapStockPlanningDetailAnalytics(productDetail);

    expect(analytics.demand).toEqual([
      expect.objectContaining({ date: "2026-07-20", demand: 4 }),
      expect.objectContaining({ date: "2026-07-21", censored: true, censoredMarker: 0, demand: null, forecast: 6, band80: [3, 9] }),
      expect.objectContaining({ date: "2026-07-22", demand: null, forecast: 7, band80: [4, 10] })
    ]);
    expect(analytics.stock).toEqual([
      { date: "2026-07-20", stock: 18, target: 30 },
      { date: "2026-07-22", stock: 14, target: 30 }
    ]);
    expect(analytics.performance.map((point) => point.executionId)).toEqual([
      "execution-previous",
      "execution-current"
    ]);
  });
});

const catalogProduct = {
  id: "product-1",
  units: [
    {
      conversionFactor: 10,
      id: "presentation-1",
      unit: {
        abbreviation: "blíster",
        name: "Blíster"
      },
      unitId: "unit-1"
    }
  ]
} as Product;

function setAuthRole(roleName: "admin" | "seller" | "superadmin") {
  useAuthStore.setState({
    status: "authenticated",
    token: "token",
    user: {
      email: `${roleName}@example.com`,
      fullName: `${roleName} user`,
      id: `${roleName}-user`,
      role: {
        displayName: roleName,
        id: `${roleName}-role`,
        name: roleName
      },
      status: "active"
    }
  });
}

async function renderStockPlanningHook(roleName: "admin" | "seller" | "superadmin") {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let value: ReturnType<typeof useStockPlanning> | null = null;

  setAuthRole(roleName);

  function Probe() {
    value = useStockPlanning();
    return null;
  }

  await act(async () => {
    root.render(createElement(Probe));
  });

  return {
    get value() {
      if (!value) {
        throw new Error("Stock planning hook did not render.");
      }

      return value;
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  };
}

describe("stock planning api and facade", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("uses the cold-start endpoints and passes transport values unchanged", async () => {
    mockedAxiosApi.get.mockResolvedValueOnce({ data: planningResponse });
    mockedAxiosApi.get.mockResolvedValueOnce({ data: [catalogProduct] });
    mockedAxiosApi.patch.mockResolvedValueOnce({ data: planningProduct });

    await stockPlanningApi.listProducts({ criticality: "high", search: "analgésico" });
    await stockPlanningApi.listProductCatalog();
    await stockPlanningApi.updateProductConfiguration("product-1", {
      coverageDays: 45,
      criticality: "high",
      preferredPresentationId: "presentation-1"
    });

    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(1, "/stock-planning/products", {
      params: { criticality: "high", search: "analgésico" },
      signal: undefined
    });
    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(2, "/products", { signal: undefined });
    expect(mockedAxiosApi.patch).toHaveBeenCalledWith(
      "/stock-planning/products/product-1/configuration",
      {
        coverageDays: 45,
        criticality: "high",
        preferredPresentationId: "presentation-1"
      }
    );
  });

  it("requests the selected detail execution without inventing comparison data", async () => {
    mockedAxiosApi.get.mockResolvedValueOnce({ data: productDetail });

    await stockPlanningApi.getProductDetail("product-1", "execution-previous");

    expect(mockedAxiosApi.get).toHaveBeenCalledWith(
      "/stock-planning/products/product-1/detail",
      { params: { executionId: "execution-previous" }, signal: undefined }
    );
  });

  it("combines planning rows with portable presentation options", async () => {
    vi.spyOn(stockPlanningApi, "listProducts").mockResolvedValue(planningResponse);
    vi.spyOn(stockPlanningApi, "listProductCatalog").mockResolvedValue([catalogProduct]);
    vi.spyOn(stockPlanningApi, "getEngineState").mockResolvedValue(engineState);
    vi.spyOn(stockPlanningApi, "listExecutions").mockResolvedValue([]);

    const data = await stockPlanningFacade.list();

    expect(data.configuration.coverageDays).toBe(30);
    expect(data.engineState).toEqual(engineState);
    expect(data.executions).toEqual([]);
    expect(data.alerts).toEqual(planningResponse.alerts);
    expect(data.groups).toEqual(planningResponse.groups);
    expect(data.summary).toEqual(planningResponse.summary);
    expect(data.products).toEqual([planningProduct]);
    expect(data.analyticsByProductId["product-1"]).toMatchObject({
      available: false,
      evidenceLimited: true,
      freshness: "reference"
    });
    expect(data.presentationOptionsByProductId["product-1"]).toEqual([
      {
        abbreviation: "blíster",
        conversionFactor: 10,
        id: "presentation-1",
        name: "Blíster"
      }
    ]);
  });

  it("uses governance endpoints without leaking scheduling internals", async () => {
    const execution = {
      id: "execution-1",
      status: "succeeded"
    } as StockPlanningExecution;
    mockedAxiosApi.get.mockResolvedValueOnce({ data: engineState });
    mockedAxiosApi.get.mockResolvedValueOnce({ data: { data: [execution] } });
    mockedAxiosApi.put.mockResolvedValueOnce({ data: globalConfiguration });
    mockedAxiosApi.post.mockResolvedValueOnce({ data: execution });

    await stockPlanningApi.getEngineState();
    await stockPlanningApi.listExecutions();
    await stockPlanningApi.updateConfiguration({
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
    await stockPlanningApi.runManualExecution("stock-planning-request-1");

    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(1, "/stock-planning/engine-state", { signal: undefined });
    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(2, "/stock-planning/executions", { signal: undefined });
    expect(mockedAxiosApi.put).toHaveBeenCalledWith(
      "/stock-planning/configuration",
      expect.not.objectContaining({ cron: expect.anything() })
    );
    expect(mockedAxiosApi.post).toHaveBeenCalledWith(
      "/stock-planning/executions/manual",
      undefined,
      { headers: { "Idempotency-Key": "stock-planning-request-1" } }
    );
  });
});

describe("stock planning store and selectors", () => {
  beforeEach(() => {
    resetStockPlanningStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetStockPlanningStore();
  });

  it("represents loading, success and empty catalog states", async () => {
    let resolveList: ((value: Awaited<ReturnType<typeof stockPlanningFacade.list>>) => void) | undefined;
    const pendingList = new Promise<Awaited<ReturnType<typeof stockPlanningFacade.list>>>((resolve) => {
      resolveList = resolve;
    });
    vi.spyOn(stockPlanningFacade, "list").mockReturnValueOnce(pendingList);

    const loadingPromise = useStockPlanningStore.getState().load();
    expect(useStockPlanningStore.getState().status).toBe("loading");

    resolveList?.({
      alerts: [],
      analyticsByProductId: {},
      configuration: globalConfiguration,
      engineState,
      executions: [],
      groups: [],
      presentationOptionsByProductId: {},
      products: [planningProduct],
      summary: planningDataSummary
    });
    await loadingPromise;

    expect(useStockPlanningStore.getState().status).toBe("success");
    expect(selectStockPlanningState(useStockPlanningStore.getState()).products).toEqual([planningProduct]);
    expect(selectStockPlanningActions(useStockPlanningStore.getState()).load).toBe(
      useStockPlanningStore.getState().load
    );

    vi.spyOn(stockPlanningFacade, "list").mockResolvedValueOnce({
      alerts: [],
      analyticsByProductId: {},
      configuration: globalConfiguration,
      engineState,
      executions: [],
      groups: [],
      presentationOptionsByProductId: {},
      products: [],
      summary: { ...planningDataSummary, productCount: 0, replenishmentCount: 0 }
    });
    await useStockPlanningStore.getState().load();

    expect(useStockPlanningStore.getState().status).toBe("empty");
  });

  it("loads and replaces product detail when another execution is selected", async () => {
    const firstDetail = { analytics: mapStockPlanningDetailAnalytics(productDetail), detail: productDetail };
    const previousDetail = {
      analytics: firstDetail.analytics,
      detail: { ...productDetail, execution: { ...productDetail.execution, id: "execution-previous" } }
    };
    const detailSpy = vi.spyOn(stockPlanningFacade, "getProductDetail")
      .mockResolvedValueOnce(firstDetail)
      .mockResolvedValueOnce(previousDetail);

    await useStockPlanningStore.getState().loadDetail("product-1");
    expect(useStockPlanningStore.getState()).toMatchObject({
      detailStatus: "success",
      detailData: { detail: { execution: { id: "execution-current" } } }
    });

    await useStockPlanningStore.getState().loadDetail("product-1", "execution-previous");
    expect(detailSpy).toHaveBeenLastCalledWith("product-1", "execution-previous", undefined);
    expect(useStockPlanningStore.getState().detailData?.detail.execution.id).toBe("execution-previous");
  });

  it("keeps a recoverable load error and maps forbidden access", async () => {
    vi.spyOn(stockPlanningFacade, "list").mockRejectedValueOnce(
      new ApiError({ code: "UPSTREAM_FAILURE", message: "Failure", statusCode: 500 })
    );
    await useStockPlanningStore.getState().load();

    expect(useStockPlanningStore.getState()).toMatchObject({
      error: { code: "unknown", statusCode: 500 },
      status: "error"
    });

    vi.spyOn(stockPlanningFacade, "list").mockRejectedValueOnce(
      new ApiError({ code: "FORBIDDEN", message: "Forbidden", statusCode: 403 })
    );
    await useStockPlanningStore.getState().load();

    expect(useStockPlanningStore.getState()).toMatchObject({
      error: { code: "forbidden", statusCode: 403 },
      status: "forbidden"
    });
  });

  it("updates one product and preserves rows when the mutation fails", async () => {
    useStockPlanningStore.setState({
      configuration: globalConfiguration,
      products: [planningProduct],
      status: "success"
    });
    const updatedProduct: StockPlanningProduct = {
      ...planningProduct,
      coverage: { days: 45, source: "product" },
      criticality: "critical"
    };
    vi.spyOn(stockPlanningFacade, "updateProduct").mockResolvedValueOnce(updatedProduct);
    vi.spyOn(stockPlanningFacade, "list").mockResolvedValueOnce({
      alerts: updatedProduct.alerts ?? [],
      analyticsByProductId: {},
      configuration: globalConfiguration,
      engineState,
      executions: [],
      groups: [],
      presentationOptionsByProductId: {},
      products: [updatedProduct],
      summary: planningDataSummary
    });

    const saved = await useStockPlanningStore.getState().updateProduct("product-1", {
      coverageDays: 45,
      criticality: "critical"
    });

    expect(saved).toBe(true);
    expect(useStockPlanningStore.getState().products[0]).toEqual(updatedProduct);

    vi.spyOn(stockPlanningFacade, "updateProduct").mockRejectedValueOnce(
      new ApiError({ code: "INVALID_PREFERRED_PRESENTATION", message: "Invalid", statusCode: 400 })
    );
    const failed = await useStockPlanningStore.getState().updateProduct("product-1", {
      preferredPresentationId: "foreign-presentation"
    });

    expect(failed).toBe(false);
    expect(useStockPlanningStore.getState().products[0]).toEqual(updatedProduct);
    expect(useStockPlanningStore.getState().updateError).toEqual({
      code: "validation",
      statusCode: 400
    });

    useStockPlanningStore.getState().clearUpdateError();

    expect(useStockPlanningStore.getState().updateError).toBeNull();
  });

  it("refreshes governance after saving and reports concurrent recalculation conflicts", async () => {
    useStockPlanningStore.setState({
      configuration: globalConfiguration,
      engineState,
      products: [planningProduct],
      status: "success"
    });
    const updatedConfiguration = {
      ...globalConfiguration,
      coverageDays: 45,
      version: 2
    };
    vi.spyOn(stockPlanningFacade, "updateConfiguration").mockResolvedValueOnce(updatedConfiguration);
    vi.spyOn(stockPlanningFacade, "list").mockResolvedValueOnce({
      alerts: [],
      analyticsByProductId: {},
      configuration: updatedConfiguration,
      engineState: {
        ...engineState,
        configuration: updatedConfiguration,
        stale: true,
        staleReasons: ["configuration_changed"]
      },
      executions: [],
      groups: [],
      presentationOptionsByProductId: {},
      products: [planningProduct],
      summary: planningDataSummary
    });

    const saved = await useStockPlanningStore.getState().updateConfiguration({
      coverageDays: 45,
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

    expect(saved).toBe(true);
    expect(useStockPlanningStore.getState().configuration?.coverageDays).toBe(45);
    expect(useStockPlanningStore.getState().engineState?.staleReasons).toContain("configuration_changed");

    const runSpy = vi.spyOn(stockPlanningFacade, "runManualExecution").mockRejectedValue(
      new ApiError({
        code: "STOCK_PLANNING_EXECUTION_CONFLICT",
        message: "Conflict",
        statusCode: 409
      })
    );

    const recalculated = await useStockPlanningStore.getState().runManualExecution();

    expect(recalculated).toBe(false);
    expect(useStockPlanningStore.getState()).toMatchObject({
      governanceError: { code: "conflict", statusCode: 409 },
      governanceStatus: "idle"
    });

    const firstAttemptKey = runSpy.mock.calls[0][0];
    await useStockPlanningStore.getState().runManualExecution();
    expect(runSpy.mock.calls[1][0]).toBe(firstAttemptKey);
  });
});

describe("stock planning role access", () => {
  beforeEach(() => {
    resetStockPlanningStore();
    useAuthStore.getState().reset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetStockPlanningStore();
    useAuthStore.getState().reset();
  });

  it.each(["admin", "superadmin"] as const)("loads stock planning for %s", async (roleName) => {
    const listSpy = vi.spyOn(stockPlanningFacade, "list").mockResolvedValue({
      alerts: [],
      analyticsByProductId: {
        "product-1": mapStockPlanningProductAnalytics(planningProduct, [])
      },
      configuration: globalConfiguration,
      engineState,
      executions: [],
      groups: [],
      presentationOptionsByProductId: {},
      products: [planningProduct],
      summary: planningDataSummary
    });
    const probe = await renderStockPlanningHook(roleName);

    expect(probe.value.canAccess).toBe(true);
    await vi.waitFor(() => {
      expect(probe.value.analyticsByProductId["product-1"]?.freshness).toBe("reference");
    });
    expect(listSpy).toHaveBeenCalled();

    await probe.unmount();
  });

  it("blocks seller data access and resets stale planning data", async () => {
    const listSpy = vi.spyOn(stockPlanningFacade, "list");
    useStockPlanningStore.setState({
      configuration: globalConfiguration,
      products: [planningProduct],
      status: "success"
    });
    const probe = await renderStockPlanningHook("seller");

    expect(probe.value.canAccess).toBe(false);
    expect(useStockPlanningStore.getState().products).toEqual([]);
    expect(useStockPlanningStore.getState().status).toBe("idle");
    expect(listSpy).not.toHaveBeenCalled();

    await probe.unmount();
  });
});
