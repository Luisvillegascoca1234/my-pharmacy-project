import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axiosApi } from "@/api";
import { ApiError } from "@/api/ApiError";
import { useAuthStore } from "@/modules/auth";
import { exportsApi } from "./api/exports-api";
import { exportsFacade } from "./facades/exportsFacade";
import { useExports } from "./hooks/use-exports";
import { selectExportsActions, selectExportsState } from "./store/ExportsSelectors";
import { resetExportsStore, useExportsStore } from "./store/ExportsStore";
import type { CsvExportFile } from "./types/exportsTypes";
import { createCsvExportDataError, getCsvExportStatusFromError } from "./utils/exportsErrors";

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

const salesCsvContent = "saleId;correlativeCode;totalAmount\nsale-1;VEN-001;120\n";
const movementsCsvContent = "movementId;productId;quantity\nmovement-1;product-1;2\n";

const salesFile: CsvExportFile = {
  content: salesCsvContent,
  contentType: "text/csv; charset=utf-8",
  fileName: "sales.csv",
  kind: "sales"
};

const movementsFile: CsvExportFile = {
  content: movementsCsvContent,
  contentType: "text/csv; charset=utf-8",
  fileName: "inventory-movements.csv",
  kind: "inventory-movements"
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

async function renderExportsHook(roleName: "admin" | "seller" | "superadmin") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let value: ReturnType<typeof useExports> | null = null;

  setAuthRole(roleName);

  function Probe() {
    value = useExports();
    return null;
  }

  await act(async () => {
    root.render(createElement(Probe));
  });

  return {
    get value() {
      if (!value) {
        throw new Error("Exports hook did not render.");
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

describe("exports api and facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes CSV export params through the transport client", async () => {
    mockedAxiosApi.get.mockResolvedValueOnce({ data: salesCsvContent });
    mockedAxiosApi.get.mockResolvedValueOnce({ data: movementsCsvContent });

    await exportsApi.downloadSalesCsv({ fromDate: "2026-06-24", separator: ";", toDate: "2026-06-25" });
    await exportsApi.downloadInventoryMovementsCsv({ fromDate: "2026-06-24", separator: ";", toDate: "2026-06-25" });

    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(1, "/exports/sales.csv", {
      params: { fromDate: "2026-06-24", separator: ";", toDate: "2026-06-25" },
      responseType: "text",
      signal: undefined
    });
    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(2, "/exports/inventory-movements.csv", {
      params: { fromDate: "2026-06-24", separator: ";", toDate: "2026-06-25" },
      responseType: "text",
      signal: undefined
    });
  });

  it("normalizes CSV export dates and returns file metadata", async () => {
    const salesSpy = vi.spyOn(exportsApi, "downloadSalesCsv").mockResolvedValue(salesCsvContent);
    const movementsSpy = vi.spyOn(exportsApi, "downloadInventoryMovementsCsv").mockResolvedValue(movementsCsvContent);

    const sales = await exportsFacade.downloadSalesCsv({ fromDate: " 2026-06-24 ", separator: ";", toDate: "   " });
    const movements = await exportsFacade.downloadInventoryMovementsCsv({
      fromDate: "   ",
      separator: ";",
      toDate: " 2026-06-25 "
    });

    expect(salesSpy).toHaveBeenCalledWith({ fromDate: "2026-06-24", separator: ";", toDate: undefined }, undefined);
    expect(movementsSpy).toHaveBeenCalledWith({ fromDate: undefined, separator: ";", toDate: "2026-06-25" }, undefined);
    expect(sales).toEqual(salesFile);
    expect(movements).toEqual(movementsFile);
  });
});

describe("exports store and selectors", () => {
  beforeEach(() => {
    resetExportsStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetExportsStore();
  });

  it("downloads sales and inventory movement CSV files with independent statuses", async () => {
    const salesSpy = vi.spyOn(exportsFacade, "downloadSalesCsv").mockResolvedValue(salesFile);
    const movementsSpy = vi.spyOn(exportsFacade, "downloadInventoryMovementsCsv").mockResolvedValue(movementsFile);

    useExportsStore.getState().setSalesFromDate("2026-06-24");
    useExportsStore.getState().setSalesToDate("2026-06-25");
    useExportsStore.getState().setInventoryMovementsFromDate("2026-06-24");
    useExportsStore.getState().setInventoryMovementsToDate("2026-06-25");

    const salesPromise = useExportsStore.getState().downloadSalesCsv();
    expect(useExportsStore.getState().salesExportStatus).toBe("loading");
    expect(useExportsStore.getState().inventoryMovementsExportStatus).toBe("idle");
    await salesPromise;

    const movementsPromise = useExportsStore.getState().downloadInventoryMovementsCsv();
    expect(useExportsStore.getState().inventoryMovementsExportStatus).toBe("loading");
    expect(useExportsStore.getState().salesExportStatus).toBe("success");
    await movementsPromise;

    expect(salesSpy).toHaveBeenCalledWith({ fromDate: "2026-06-24", separator: ";", toDate: "2026-06-25" }, undefined);
    expect(movementsSpy).toHaveBeenCalledWith({ fromDate: "2026-06-24", separator: ";", toDate: "2026-06-25" }, undefined);
    expect(useExportsStore.getState().salesExportFile).toEqual(salesFile);
    expect(useExportsStore.getState().inventoryMovementsExportFile).toEqual(movementsFile);
    expect(selectExportsState(useExportsStore.getState()).salesExportStatus).toBe("success");
    expect(selectExportsActions(useExportsStore.getState()).reset).toBe(useExportsStore.getState().reset);
  });

  it("handles empty and failed CSV downloads without clearing the other export state", async () => {
    const salesSpy = vi.spyOn(exportsFacade, "downloadSalesCsv").mockResolvedValue({
      ...salesFile,
      content: "saleId;correlativeCode;totalAmount\n"
    });
    vi.spyOn(exportsFacade, "downloadInventoryMovementsCsv").mockRejectedValue(
      new ApiError({
        code: "CSV_EXPORT_INVALID_DATE_RANGE",
        message: "Invalid export range.",
        statusCode: 400
      })
    );

    await useExportsStore.getState().downloadSalesCsv();
    await useExportsStore.getState().downloadInventoryMovementsCsv();

    expect(salesSpy).toHaveBeenCalled();
    expect(useExportsStore.getState().salesExportStatus).toBe("empty");
    expect(useExportsStore.getState().inventoryMovementsExportStatus).toBe("error");
    expect(useExportsStore.getState().error).toMatchObject({ code: "validation", statusCode: 400 });
    expect(useExportsStore.getState().salesExportFile?.kind).toBe("sales");
  });
});

describe("exports expected errors and permissions", () => {
  beforeEach(() => {
    resetExportsStore();
    useAuthStore.getState().reset();
    vi.restoreAllMocks();
  });

  it.each([
    ["validation", "CSV_EXPORT_INVALID_DATE_RANGE", 400],
    ["session-invalid", "UNAUTHORIZED", 401],
    ["forbidden", "FORBIDDEN", 403]
  ] as const)("maps expected CSV export error %s", (expectedCode, apiCode, statusCode) => {
    const error = createCsvExportDataError(
      new ApiError({
        code: apiCode,
        message: "Expected export error.",
        statusCode
      })
    );

    expect(error.code).toBe(expectedCode);
    expect(getCsvExportStatusFromError(error)).toBe(
      expectedCode === "forbidden" || expectedCode === "session-invalid" ? "forbidden" : "error"
    );
  });

  it.each(["admin", "superadmin"] as const)("allows %s users to use export hooks", async (roleName) => {
    const probe = await renderExportsHook(roleName);

    expect(probe.value.canDownloadExports).toBe(true);

    await probe.unmount();
  });

  it("blocks seller users and resets export state from the hook without calling endpoints", async () => {
    const salesSpy = vi.spyOn(exportsFacade, "downloadSalesCsv").mockResolvedValue(salesFile);

    useExportsStore.setState({
      salesExportFile: salesFile,
      salesExportStatus: "success"
    });
    const probe = await renderExportsHook("seller");

    await act(async () => {
      const result = await probe.value.downloadSalesCsv();
      expect(result).toBeNull();
    });

    expect(probe.value.canDownloadExports).toBe(false);
    expect(useExportsStore.getState().salesExportFile).toBeNull();
    expect(useExportsStore.getState().salesExportStatus).toBe("idle");
    expect(salesSpy).not.toHaveBeenCalled();

    await probe.unmount();
  });
});
