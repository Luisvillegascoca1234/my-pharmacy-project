import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axiosApi } from "@/api";
import { ApiError } from "@/api/ApiError";
import { useAuthStore } from "@/modules/auth";
import { reportsApi } from "./api/reports-api";
import { reportsFacade } from "./facades/reportsFacade";
import { useReports } from "./hooks/use-reports";
import { selectReportsActions, selectReportsState } from "./store/ReportsSelectors";
import { resetReportsStore, useReportsStore } from "./store/ReportsStore";
import type {
  DailySalesReportResponse,
  ExpiringProductsReportResponse,
  InventoryValuationReportResponse
} from "./types/reportsTypes";
import { createReportsDataError, getReportsStatusFromError } from "./utils/reportsErrors";

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");

  return {
    ...actual,
    axiosApi: {
      get: vi.fn()
    }
  };
});

const mockedAxiosApi = vi.mocked(axiosApi);

const dailySalesReport: DailySalesReportResponse = {
  audited: false,
  data: [
    {
      cancelledAmount: 0,
      cancelledCount: 0,
      date: "2026-06-24",
      grossSalesAmount: 150,
      netSalesAmount: 120,
      returnedAmount: 30,
      returnedCount: 1,
      saleCount: 3
    }
  ],
  generatedAt: "2026-06-24T12:00:00.000Z",
  range: {
    fromDate: "2026-06-24",
    timezone: "America/La_Paz",
    toDate: "2026-06-24"
  }
};

const inventoryValuationReport: InventoryValuationReportResponse = {
  audited: false,
  data: [
    {
      baseUnit: {
        abbreviation: "u",
        id: "unit-1",
        name: "Unidad"
      },
      commercialName: "Paracetamol",
      genericName: "Acetaminofen",
      internalCode: "PRD-001",
      lots: [],
      productId: "product-1",
      totalAvailableQuantity: 20,
      totalValue: 300
    }
  ],
  generatedAt: "2026-06-24T12:00:00.000Z",
  timezone: "America/La_Paz",
  totalValue: 300
};

const expiringProductsReport: ExpiringProductsReportResponse = {
  audited: false,
  data: [
    {
      availableQuantity: 5,
      batchId: "batch-1",
      batchNumber: "L-001",
      commercialName: "Paracetamol",
      daysUntilExpiration: 8,
      expirationDate: "2026-07-02",
      genericName: "Acetaminofen",
      internalCode: "PRD-001",
      productId: "product-1",
      totalValue: 75,
      unitCostBase: 15
    }
  ],
  generatedAt: "2026-06-24T12:00:00.000Z",
  range: {
    days: 10,
    productId: "product-1",
    search: "PRD",
    timezone: "America/La_Paz"
  }
};

function setAuthRole(roleName: "admin" | "seller" | "superadmin") {
  useAuthStore.setState({
    status: "authenticated",
    token: "token",
    user: {
      email: `${roleName}@example.com`,
      fullName: `${roleName} user`,
      id: `${roleName}-user`,
      permissions: [],
      role: {
        displayName: roleName,
        id: `${roleName}-role`,
        name: roleName
      },
      status: "active"
    }
  });
}

async function renderReportsHook(roleName: "admin" | "seller" | "superadmin") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let value: ReturnType<typeof useReports> | null = null;

  setAuthRole(roleName);

  function Probe() {
    value = useReports({
      autoLoadDailySales: false,
      autoLoadExpiringProducts: false,
      autoLoadInventoryValuation: false
    });
    return null;
  }

  await act(async () => {
    root.render(createElement(Probe));
  });

  return {
    get value() {
      if (!value) {
        throw new Error("Reports hook did not render.");
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

describe("reports api and facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes report query params through the transport client", async () => {
    mockedAxiosApi.get.mockResolvedValueOnce({ data: dailySalesReport });
    mockedAxiosApi.get.mockResolvedValueOnce({ data: inventoryValuationReport });
    mockedAxiosApi.get.mockResolvedValueOnce({ data: expiringProductsReport });

    await reportsApi.getDailySalesReport({
      fromDate: "2026-06-24",
      timezone: "America/La_Paz",
      toDate: "2026-06-25"
    });
    await reportsApi.getInventoryValuationReport({
      productId: "product-1",
      search: "PRD",
      timezone: "America/La_Paz"
    });
    await reportsApi.getExpiringProductsReport({
      days: 10,
      productId: "product-1",
      search: "PRD",
      timezone: "America/La_Paz"
    });

    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(1, "/reports/daily-sales", {
      params: { fromDate: "2026-06-24", timezone: "America/La_Paz", toDate: "2026-06-25" },
      signal: undefined
    });
    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(2, "/reports/inventory-valuation", {
      params: { productId: "product-1", search: "PRD", timezone: "America/La_Paz" },
      signal: undefined
    });
    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(3, "/reports/expiring-products", {
      params: { days: 10, productId: "product-1", search: "PRD", timezone: "America/La_Paz" },
      signal: undefined
    });
  });

  it("normalizes report filters and defaults before delegating to the api", async () => {
    const dailySalesSpy = vi.spyOn(reportsApi, "getDailySalesReport").mockResolvedValue(dailySalesReport);
    const inventorySpy = vi.spyOn(reportsApi, "getInventoryValuationReport").mockResolvedValue(inventoryValuationReport);
    const expiringSpy = vi.spyOn(reportsApi, "getExpiringProductsReport").mockResolvedValue(expiringProductsReport);

    await reportsFacade.getDailySalesReport({
      fromDate: "2026-06-24",
      timezone: "America/La_Paz",
      toDate: "2026-06-25"
    });
    await reportsFacade.getInventoryValuationReport({
      productId: " product-1 ",
      search: "   ",
      timezone: "America/La_Paz"
    });
    await reportsFacade.getExpiringProductsReport({
      days: 0,
      productId: "   ",
      search: " PRD ",
      timezone: "America/La_Paz"
    });

    expect(dailySalesSpy).toHaveBeenCalledWith(
      { fromDate: "2026-06-24", timezone: "America/La_Paz", toDate: "2026-06-25" },
      undefined
    );
    expect(inventorySpy).toHaveBeenCalledWith(
      { productId: "product-1", search: undefined, timezone: "America/La_Paz" },
      undefined
    );
    expect(expiringSpy).toHaveBeenCalledWith(
      { days: 30, productId: undefined, search: "PRD", timezone: "America/La_Paz" },
      undefined
    );
  });
});

describe("reports store and selectors", () => {
  beforeEach(() => {
    resetReportsStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetReportsStore();
  });

  it("loads daily sales with loading, validation, empty and success states", async () => {
    const dailySalesSpy = vi.spyOn(reportsFacade, "getDailySalesReport").mockResolvedValueOnce({
      ...dailySalesReport,
      data: []
    });

    await useReportsStore.getState().loadDailySalesReport();
    expect(useReportsStore.getState().dailySalesStatus).toBe("error");
    expect(useReportsStore.getState().error).toMatchObject({ code: "validation" });
    expect(dailySalesSpy).not.toHaveBeenCalled();

    useReportsStore.getState().setDailySalesFromDate("2026-06-24");
    useReportsStore.getState().setDailySalesToDate("2026-06-25");
    const emptyPromise = useReportsStore.getState().loadDailySalesReport();
    expect(useReportsStore.getState().dailySalesStatus).toBe("loading");
    await emptyPromise;
    expect(useReportsStore.getState().dailySalesStatus).toBe("empty");

    dailySalesSpy.mockResolvedValueOnce(dailySalesReport);
    await useReportsStore.getState().loadDailySalesReport();

    expect(useReportsStore.getState().dailySalesStatus).toBe("success");
    expect(useReportsStore.getState().dailySalesReport).toEqual(dailySalesReport);
  });

  it("loads inventory valuation and expiring products with filters and independent states", async () => {
    const inventorySpy = vi.spyOn(reportsFacade, "getInventoryValuationReport").mockResolvedValue(inventoryValuationReport);
    const expiringSpy = vi.spyOn(reportsFacade, "getExpiringProductsReport").mockResolvedValue(expiringProductsReport);

    useReportsStore.getState().setInventoryValuationProductId("product-1");
    useReportsStore.getState().setInventoryValuationSearch("PRD");
    useReportsStore.getState().setExpiringDays(10);
    useReportsStore.getState().setExpiringProductId("product-1");
    useReportsStore.getState().setExpiringSearch("PRD");

    await useReportsStore.getState().loadInventoryValuationReport();
    await useReportsStore.getState().loadExpiringProductsReport();

    expect(inventorySpy).toHaveBeenCalledWith(
      { productId: "product-1", search: "PRD", timezone: "America/La_Paz" },
      undefined
    );
    expect(expiringSpy).toHaveBeenCalledWith(
      { days: 10, productId: "product-1", search: "PRD", timezone: "America/La_Paz" },
      undefined
    );
    expect(useReportsStore.getState().inventoryValuationStatus).toBe("success");
    expect(useReportsStore.getState().expiringProductsStatus).toBe("success");
    expect(selectReportsState(useReportsStore.getState()).expiringDays).toBe(10);
    expect(selectReportsActions(useReportsStore.getState()).reset).toBe(useReportsStore.getState().reset);
  });
});

describe("reports expected errors and permissions", () => {
  beforeEach(() => {
    resetReportsStore();
    useAuthStore.getState().reset();
    vi.restoreAllMocks();
  });

  it.each([
    ["validation", "REPORT_INVALID_DATE_RANGE", 400],
    ["validation", "REPORT_INVALID_TIMEZONE", 400],
    ["session-invalid", "UNAUTHORIZED", 401],
    ["forbidden", "FORBIDDEN", 403]
  ] as const)("maps expected reports error %s", (expectedCode, apiCode, statusCode) => {
    const error = createReportsDataError(
      new ApiError({
        code: apiCode,
        message: "Expected reports error.",
        statusCode
      })
    );

    expect(error.code).toBe(expectedCode);
    expect(getReportsStatusFromError(error)).toBe(
      expectedCode === "forbidden" || expectedCode === "session-invalid" ? "forbidden" : "error"
    );
  });

  it.each(["admin", "superadmin"] as const)("allows %s users to use reports hooks", async (roleName) => {
    const probe = await renderReportsHook(roleName);

    expect(probe.value.canReadReports).toBe(true);

    await probe.unmount();
  });

  it("blocks seller users and resets reports state from the hook without calling endpoints", async () => {
    const dailySalesSpy = vi.spyOn(reportsFacade, "getDailySalesReport").mockResolvedValue(dailySalesReport);

    useReportsStore.setState({
      dailySalesReport,
      dailySalesStatus: "success"
    });
    const probe = await renderReportsHook("seller");

    await act(async () => {
      await probe.value.loadDailySalesReport();
    });

    expect(probe.value.canReadReports).toBe(false);
    expect(useReportsStore.getState().dailySalesReport).toBeNull();
    expect(useReportsStore.getState().dailySalesStatus).toBe("idle");
    expect(dailySalesSpy).not.toHaveBeenCalled();

    await probe.unmount();
  });
});
