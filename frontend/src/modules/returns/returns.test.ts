import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axiosApi } from "@/api";
import { ApiError } from "@/api/ApiError";
import { useAuthStore } from "@/modules/auth";
import { returnsApi } from "./api/returns-api";
import { returnsFacade } from "./facades/returnsFacade";
import { useReturns } from "./hooks/use-returns";
import { selectReturnsActions, selectReturnsState } from "./store/ReturnsSelectors";
import { initialReturnsPagination } from "./store/ReturnsState";
import { resetReturnsStore, useReturnsStore } from "./store/ReturnsStore";
import type { ReturnableSaleSummary, SaleReturn, SaleReturnSummary } from "./types/returnsTypes";
import { createReturnsDataError, getReturnsStatusFromError } from "./utils/returnsErrors";

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");

  return {
    ...actual,
    axiosApi: {
      get: vi.fn(),
      post: vi.fn()
    }
  };
});

const mockedAxiosApi = vi.mocked(axiosApi);

const pagination = {
  page: 2,
  pageSize: 10,
  total: 1,
  totalPages: 1
};

const sellerUser = {
  email: "seller@example.com",
  fullName: "Seller User",
  id: "user-seller"
};

const returnableSale: ReturnableSaleSummary = {
  canReturn: true,
  cashSessionCorrelativeCode: "CAJ-001",
  cashSessionId: "cash-1",
  confirmedAt: "2026-06-24T10:00:00.000Z",
  correlativeCode: "VEN-001",
  id: "sale-1",
  paymentStatus: "paid",
  sellerUser,
  sellerUserId: sellerUser.id,
  status: "confirmed",
  totalAmount: 120
};

const saleReturnSummary: SaleReturnSummary = {
  actorUser: {
    email: "admin@example.com",
    fullName: "Admin User",
    id: "admin-user"
  },
  actorUserId: "admin-user",
  createdAt: "2026-06-24T11:00:00.000Z",
  id: "return-1",
  paymentId: "payment-1",
  reason: "Motivo operativo valido",
  refundAmount: 120,
  returnedAt: "2026-06-24T11:00:00.000Z",
  saleCorrelativeCode: "VEN-001",
  saleId: "sale-1",
  updatedAt: "2026-06-24T11:00:00.000Z"
};

const saleReturn: SaleReturn = {
  ...saleReturnSummary,
  items: [
    {
      batchId: "batch-1",
      commercialName: "Paracetamol",
      createdAt: "2026-06-24T11:00:00.000Z",
      id: "return-item-1",
      internalCode: "PRD-001",
      productId: "product-1",
      quantity: 2,
      refundSubtotal: 120,
      refundUnitPrice: 60,
      saleItemBatchId: "sale-item-batch-1",
      saleItemId: "sale-item-1",
      saleReturnId: "return-1",
      unitCostBase: 40,
      updatedAt: "2026-06-24T11:00:00.000Z"
    }
  ]
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

async function renderReturnsHook(roleName: "admin" | "seller" | "superadmin") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let value: ReturnType<typeof useReturns> | null = null;

  setAuthRole(roleName);

  function Probe() {
    value = useReturns({ autoLoadReturnableSales: false, autoLoadSaleReturns: false });
    return null;
  }

  await act(async () => {
    root.render(createElement(Probe));
  });

  return {
    get value() {
      if (!value) {
        throw new Error("Returns hook did not render.");
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

describe("returns api and facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes returnable sales and sale return query params through the transport client", async () => {
    mockedAxiosApi.get.mockResolvedValueOnce({ data: { data: [returnableSale], pagination } });
    mockedAxiosApi.get.mockResolvedValueOnce({ data: { data: [saleReturnSummary], pagination } });

    await returnsApi.listReturnableSales({ page: 2, pageSize: 10, search: "VEN", sellerUserId: "user-seller" });
    await returnsApi.listSaleReturns({ actorUserId: "admin-user", page: 2, pageSize: 10, saleId: "sale-1" });

    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(1, "/returns/returnable-sales", {
      params: { page: 2, pageSize: 10, search: "VEN", sellerUserId: "user-seller" },
      signal: undefined
    });
    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(2, "/returns/sale-returns", {
      params: { actorUserId: "admin-user", page: 2, pageSize: 10, saleId: "sale-1" },
      signal: undefined
    });
  });

  it("normalizes total return payloads before delegating to the api", async () => {
    const createSpy = vi.spyOn(returnsApi, "createTotalSaleReturn").mockResolvedValue(saleReturn);

    await returnsFacade.createTotalSaleReturn({
      reason: "  Motivo operativo valido  ",
      saleId: "sale-1"
    });

    expect(createSpy).toHaveBeenCalledWith({
      reason: "Motivo operativo valido",
      saleId: "sale-1"
    });
  });
});

describe("returns store and selectors", () => {
  beforeEach(() => {
    resetReturnsStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetReturnsStore();
  });

  it("loads returnable sales with loading, empty, error and success states", async () => {
    const listSpy = vi.spyOn(returnsFacade, "listReturnableSales").mockResolvedValueOnce({
      data: [],
      pagination: initialReturnsPagination
    });

    const loadingPromise = useReturnsStore.getState().loadReturnableSales();
    expect(useReturnsStore.getState().returnableSalesStatus).toBe("loading");
    await loadingPromise;
    expect(useReturnsStore.getState().returnableSalesStatus).toBe("empty");

    listSpy.mockRejectedValueOnce(
      new ApiError({
        code: "SALE_RETURN_CONFLICT",
        details: { returnBlockedReason: "already-returned", saleId: "sale-1" },
        message: "Sale already returned.",
        statusCode: 409
      })
    );

    await useReturnsStore.getState().loadReturnableSales();
    expect(useReturnsStore.getState().returnableSalesStatus).toBe("error");
    expect(useReturnsStore.getState().error).toMatchObject({
      code: "already-returned",
      returnBlockedReason: "already-returned",
      saleId: "sale-1"
    });

    listSpy.mockResolvedValueOnce({ data: [returnableSale], pagination });

    await useReturnsStore.getState().loadReturnableSales();
    expect(useReturnsStore.getState().returnableSalesStatus).toBe("success");
    expect(useReturnsStore.getState().returnablePagination).toEqual(pagination);
    expect(useReturnsStore.getState().returnableSales).toEqual([returnableSale]);
  });

  it("loads sale returns, selected detail and reset state", async () => {
    vi.spyOn(returnsFacade, "listSaleReturns").mockResolvedValue({
      data: [saleReturnSummary],
      pagination
    });
    vi.spyOn(returnsFacade, "getSaleReturnById").mockResolvedValue(saleReturn);

    useReturnsStore.getState().setSaleReturnSearch("VEN");
    useReturnsStore.getState().setSaleReturnPage(3);
    await useReturnsStore.getState().loadSaleReturns();
    const selected = await useReturnsStore.getState().loadSaleReturn("return-1");

    expect(selected).toEqual(saleReturn);
    expect(useReturnsStore.getState().saleReturnsStatus).toBe("success");
    expect(useReturnsStore.getState().detailStatus).toBe("success");
    expect(selectReturnsState(useReturnsStore.getState()).selectedSaleReturnId).toBe("return-1");
    expect(selectReturnsActions(useReturnsStore.getState()).reset).toBe(useReturnsStore.getState().reset);

    useReturnsStore.getState().reset();

    expect(useReturnsStore.getState().saleReturns).toEqual([]);
    expect(useReturnsStore.getState().saleReturnsStatus).toBe("idle");
    expect(useReturnsStore.getState().selectedSaleReturn).toBeNull();
    expect(useReturnsStore.getState().selectedSaleReturnId).toBeNull();
  });

  it("creates total returns while updating mutation status and affected returnable sales", async () => {
    vi.spyOn(returnsFacade, "createTotalSaleReturn").mockResolvedValue(saleReturn);

    useReturnsStore.setState({ returnableSales: [returnableSale] });
    const created = await useReturnsStore.getState().createTotalSaleReturn({
      reason: "Motivo operativo valido",
      saleId: "sale-1"
    });

    expect(created).toEqual(saleReturn);
    expect(useReturnsStore.getState().createStatus).toBe("success");
    expect(useReturnsStore.getState().selectedSaleReturnId).toBe("return-1");
    expect(useReturnsStore.getState().returnableSales[0]).toMatchObject({
      canReturn: false,
      returnBlockedReason: "already-returned",
      status: "returned"
    });
  });
});

describe("returns expected errors and permissions", () => {
  beforeEach(() => {
    resetReturnsStore();
    useAuthStore.getState().reset();
    vi.restoreAllMocks();
  });

  it.each([
    ["sale-not-returnable", "SALE_NOT_RETURNABLE", undefined],
    ["active-invoice-exists", "SALE_NOT_RETURNABLE", "active-invoice-exists"],
    ["already-returned", "SALE_RETURN_CONFLICT", "already-returned"],
    ["validation", "VALIDATION_ERROR", undefined],
    ["forbidden", "AUTHENTICATED_USER_NOT_ACTIVE", undefined]
  ] as const)("maps expected returns error %s", (expectedCode, apiCode, returnBlockedReason) => {
    const error = createReturnsDataError(
      new ApiError({
        code: apiCode,
        details: returnBlockedReason ? { returnBlockedReason, saleId: "sale-1" } : undefined,
        message: "Expected returns error.",
        statusCode: expectedCode === "forbidden" ? 403 : 409
      })
    );

    expect(error.code).toBe(expectedCode);
    expect(getReturnsStatusFromError(error)).toBe(expectedCode === "forbidden" ? "forbidden" : "error");
  });

  it.each(["admin", "superadmin"] as const)("allows %s users to use returns hooks", async (roleName) => {
    const probe = await renderReturnsHook(roleName);

    expect(probe.value.canUseReturns).toBe(true);

    await probe.unmount();
  });

  it("blocks seller users and resets returns state from the hook", async () => {
    useReturnsStore.setState({
      saleReturns: [saleReturnSummary],
      saleReturnsStatus: "success"
    });
    const probe = await renderReturnsHook("seller");

    expect(probe.value.canUseReturns).toBe(false);
    expect(useReturnsStore.getState().saleReturns).toEqual([]);
    expect(useReturnsStore.getState().saleReturnsStatus).toBe("idle");

    await probe.unmount();
  });
});
