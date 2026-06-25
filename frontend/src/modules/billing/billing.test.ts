import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axiosApi } from "@/api";
import { ApiError } from "@/api/ApiError";
import { useAuthStore } from "@/modules/auth";
import { billingApi } from "./api/billing-api";
import { billingFacade } from "./facades/billingFacade";
import { useBilling } from "./hooks/use-billing";
import { selectBillingActions, selectBillingState } from "./store/BillingSelectors";
import { initialBillingPagination } from "./store/BillingState";
import { resetBillingStore, useBillingStore } from "./store/BillingStore";
import type {
  InvoiceableSaleSummary,
  PreparedInvoice,
  PreparedInvoiceSummary
} from "./types/billingTypes";
import { createBillingDataError, getBillingStatusFromError } from "./utils/billingErrors";

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

const invoiceableSale: InvoiceableSaleSummary = {
  canPrepareInvoice: true,
  cashSessionCorrelativeCode: "CAJ-001",
  cashSessionId: "cash-1",
  confirmedAt: "2026-06-24T10:00:00.000Z",
  correlativeCode: "VEN-001",
  id: "sale-1",
  sellerUser,
  sellerUserId: sellerUser.id,
  status: "confirmed",
  totalAmount: 120
};

const preparedInvoiceSummary: PreparedInvoiceSummary = {
  cashSessionCode: "CAJ-001",
  cashSessionId: "cash-1",
  correlativeCode: "FAC-001",
  createdAt: "2026-06-24T10:00:00.000Z",
  customerBusinessName: "Consumidor final",
  customerNit: "0",
  id: "invoice-1",
  preparedAt: "2026-06-24T10:05:00.000Z",
  saleCorrelativeCode: "VEN-001",
  saleId: "sale-1",
  sellerEmail: "seller@example.com",
  sellerName: "Seller User",
  sellerUserId: "user-seller",
  status: "prepared",
  totalAmount: 120,
  updatedAt: "2026-06-24T10:05:00.000Z"
};

const preparedInvoice: PreparedInvoice = {
  ...preparedInvoiceSummary,
  items: [
    {
      baseUnit: {
        abbreviation: "u",
        id: "unit-1",
        name: "Unidad"
      },
      commercialName: "Paracetamol",
      createdAt: "2026-06-24T10:05:00.000Z",
      id: "invoice-item-1",
      internalCode: "PRD-001",
      preparedInvoiceId: "invoice-1",
      productId: "product-1",
      quantity: 2,
      saleItemId: "sale-item-1",
      subtotal: 120,
      unitPrice: 60,
      updatedAt: "2026-06-24T10:05:00.000Z"
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

async function renderBillingHook(roleName: "admin" | "seller" | "superadmin") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let value: ReturnType<typeof useBilling> | null = null;

  setAuthRole(roleName);

  function Probe() {
    value = useBilling({ autoLoadInvoiceableSales: false, autoLoadPreparedInvoices: false });
    return null;
  }

  await act(async () => {
    root.render(createElement(Probe));
  });

  return {
    get value() {
      if (!value) {
        throw new Error("Billing hook did not render.");
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

describe("billing api and facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes invoiceable and prepared invoice query params through the transport client", async () => {
    mockedAxiosApi.get.mockResolvedValueOnce({ data: { data: [invoiceableSale], pagination } });
    mockedAxiosApi.get.mockResolvedValueOnce({ data: { data: [preparedInvoiceSummary], pagination } });

    await billingApi.listInvoiceableSales({ page: 2, pageSize: 10, search: "VEN", sellerUserId: "user-seller" });
    await billingApi.listPreparedInvoices({ page: 2, pageSize: 10, saleId: "sale-1", status: "prepared" });

    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(1, "/billing/invoiceable-sales", {
      params: { page: 2, pageSize: 10, search: "VEN", sellerUserId: "user-seller" },
      signal: undefined
    });
    expect(mockedAxiosApi.get).toHaveBeenNthCalledWith(2, "/billing/prepared-invoices", {
      params: { page: 2, pageSize: 10, saleId: "sale-1", status: "prepared" },
      signal: undefined
    });
  });

  it("normalizes prepare and cancel payloads before delegating to the api", async () => {
    const prepareSpy = vi.spyOn(billingApi, "prepareInvoice").mockResolvedValue(preparedInvoice);
    const cancelSpy = vi.spyOn(billingApi, "cancelPreparedInvoice").mockResolvedValue({
      ...preparedInvoice,
      cancelReason: "Motivo operativo valido",
      status: "cancelled"
    });

    await billingFacade.prepareInvoice({
      customerBusinessName: "   ",
      customerNit: "   ",
      fiscalNotes: "",
      saleId: "sale-1"
    });
    await billingFacade.cancelPreparedInvoice("invoice-1", { cancelReason: "  Motivo operativo valido  " });

    expect(prepareSpy).toHaveBeenCalledWith({
      customerBusinessName: "Consumidor final",
      customerNit: "0",
      fiscalNotes: undefined,
      saleId: "sale-1"
    });
    expect(cancelSpy).toHaveBeenCalledWith("invoice-1", { cancelReason: "Motivo operativo valido" });
  });
});

describe("billing store and selectors", () => {
  beforeEach(() => {
    resetBillingStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetBillingStore();
  });

  it("loads invoiceable sales with loading, empty, error and success states", async () => {
    const listSpy = vi.spyOn(billingFacade, "listInvoiceableSales").mockResolvedValueOnce({
      data: [],
      pagination: initialBillingPagination
    });

    const loadingPromise = useBillingStore.getState().loadInvoiceableSales();
    expect(useBillingStore.getState().invoiceableSalesStatus).toBe("loading");
    await loadingPromise;
    expect(useBillingStore.getState().invoiceableSalesStatus).toBe("empty");

    listSpy.mockRejectedValueOnce(
      new ApiError({
        code: "SALE_NOT_INVOICEABLE",
        details: { invoiceBlockedReason: "sale-returned", saleId: "sale-1" },
        message: "Sale cannot be invoiced.",
        statusCode: 409
      })
    );

    await useBillingStore.getState().loadInvoiceableSales();
    expect(useBillingStore.getState().invoiceableSalesStatus).toBe("error");
    expect(useBillingStore.getState().error).toMatchObject({
      code: "sale-returned",
      invoiceBlockedReason: "sale-returned",
      saleId: "sale-1"
    });

    listSpy.mockResolvedValueOnce({ data: [invoiceableSale], pagination });

    await useBillingStore.getState().loadInvoiceableSales();
    expect(useBillingStore.getState().invoiceableSalesStatus).toBe("success");
    expect(useBillingStore.getState().invoiceablePagination).toEqual(pagination);
    expect(useBillingStore.getState().invoiceableSales).toEqual([invoiceableSale]);
  });

  it("loads prepared invoices, selected detail and reset state", async () => {
    vi.spyOn(billingFacade, "listPreparedInvoices").mockResolvedValue({
      data: [preparedInvoiceSummary],
      pagination
    });
    vi.spyOn(billingFacade, "getPreparedInvoiceById").mockResolvedValue(preparedInvoice);

    useBillingStore.getState().setPreparedInvoiceSearch("FAC");
    useBillingStore.getState().setPreparedInvoicePage(3);
    await useBillingStore.getState().loadPreparedInvoices();
    const selected = await useBillingStore.getState().loadPreparedInvoice("invoice-1");

    expect(selected).toEqual(preparedInvoice);
    expect(useBillingStore.getState().preparedInvoicesStatus).toBe("success");
    expect(useBillingStore.getState().detailStatus).toBe("success");
    expect(selectBillingState(useBillingStore.getState()).selectedPreparedInvoiceId).toBe("invoice-1");
    expect(selectBillingActions(useBillingStore.getState()).reset).toBe(useBillingStore.getState().reset);

    useBillingStore.getState().reset();

    expect(useBillingStore.getState().preparedInvoices).toEqual([]);
    expect(useBillingStore.getState().preparedInvoicesStatus).toBe("idle");
    expect(useBillingStore.getState().selectedPreparedInvoice).toBeNull();
    expect(useBillingStore.getState().selectedPreparedInvoiceId).toBeNull();
  });

  it("prepares and cancels invoices while updating mutation status", async () => {
    vi.spyOn(billingFacade, "prepareInvoice").mockResolvedValue(preparedInvoice);
    vi.spyOn(billingFacade, "cancelPreparedInvoice").mockResolvedValue({
      ...preparedInvoice,
      cancelReason: "Motivo operativo valido",
      status: "cancelled"
    });

    const created = await useBillingStore.getState().prepareInvoice({
      customerBusinessName: "Consumidor final",
      customerNit: "0",
      saleId: "sale-1"
    });
    expect(created).toEqual(preparedInvoice);
    expect(useBillingStore.getState().prepareStatus).toBe("success");
    expect(useBillingStore.getState().selectedPreparedInvoiceId).toBe("invoice-1");

    useBillingStore.getState().setCancelReason("Motivo operativo valido");
    const cancelled = await useBillingStore.getState().cancelSelectedPreparedInvoice();

    expect(cancelled?.status).toBe("cancelled");
    expect(useBillingStore.getState().cancelStatus).toBe("success");
    expect(useBillingStore.getState().cancelReason).toBe("");
  });
});

describe("billing expected errors and permissions", () => {
  beforeEach(() => {
    resetBillingStore();
    useAuthStore.getState().reset();
    vi.restoreAllMocks();
  });

  it.each([
    ["sale-not-invoiceable", "SALE_NOT_INVOICEABLE", undefined],
    ["active-invoice-exists", "SALE_NOT_INVOICEABLE", "active-invoice-exists"],
    ["sale-returned", "SALE_NOT_INVOICEABLE", "sale-returned"],
    ["validation", "VALIDATION_ERROR", undefined],
    ["forbidden", "AUTHENTICATED_USER_NOT_ACTIVE", undefined]
  ] as const)("maps expected billing error %s", (expectedCode, apiCode, invoiceBlockedReason) => {
    const error = createBillingDataError(
      new ApiError({
        code: apiCode,
        details: invoiceBlockedReason ? { invoiceBlockedReason, saleId: "sale-1" } : undefined,
        message: "Expected billing error.",
        statusCode: expectedCode === "forbidden" ? 403 : 409
      })
    );

    expect(error.code).toBe(expectedCode);
    expect(getBillingStatusFromError(error)).toBe(expectedCode === "forbidden" ? "forbidden" : "error");
  });

  it.each(["admin", "superadmin"] as const)("allows %s users to use billing hooks", async (roleName) => {
    const probe = await renderBillingHook(roleName);

    expect(probe.value.canUseBilling).toBe(true);

    await probe.unmount();
  });

  it("blocks seller users and resets billing state from the hook", async () => {
    useBillingStore.setState({
      preparedInvoices: [preparedInvoiceSummary],
      preparedInvoicesStatus: "success"
    });
    const probe = await renderBillingHook("seller");

    expect(probe.value.canUseBilling).toBe(false);
    expect(useBillingStore.getState().preparedInvoices).toEqual([]);
    expect(useBillingStore.getState().preparedInvoicesStatus).toBe("idle");

    await probe.unmount();
  });
});
