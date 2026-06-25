import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axiosApi } from "@/api";
import { ApiError } from "@/api/ApiError";
import { useAuthStore } from "@/modules/auth";
import { auditApi } from "./api/audit-api";
import { auditFacade } from "./facades/auditFacade";
import { useAudit } from "./hooks/use-audit";
import { selectAuditActions, selectAuditState } from "./store/AuditSelectors";
import { resetAuditStore, useAuditStore } from "./store/AuditStore";
import type { AuditLog, AuditLogsListResponse } from "./types/auditTypes";
import { createAuditDataError, getAuditStatusFromError } from "./utils/auditErrors";

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

const auditLog: AuditLog = {
  action: "sale.cancelled",
  actorUser: {
    email: "superadmin@example.com",
    fullName: "Superadmin User",
    id: "superadmin-user"
  },
  actorUserId: "superadmin-user",
  createdAt: "2026-06-24T12:00:00.000Z",
  entityId: "sale-1",
  entityType: "sale",
  id: "audit-1",
  ipAddress: "127.0.0.1",
  metadata: {
    result: "success"
  },
  userAgent: "Vitest"
};

const pagination = {
  page: 2,
  pageSize: 10,
  total: 1,
  totalPages: 1
};

const auditLogsResponse: AuditLogsListResponse = {
  data: [auditLog],
  pagination
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

async function renderAuditHook(roleName: "admin" | "seller" | "superadmin") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let value: ReturnType<typeof useAudit> | null = null;

  setAuthRole(roleName);

  function Probe() {
    value = useAudit({ autoLoad: false });
    return null;
  }

  await act(async () => {
    root.render(createElement(Probe));
  });

  return {
    get value() {
      if (!value) {
        throw new Error("Audit hook did not render.");
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

describe("audit api and facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes audit filters and pagination through the transport client", async () => {
    mockedAxiosApi.get.mockResolvedValueOnce({ data: auditLogsResponse });

    await auditApi.listAuditLogs({
      action: "sale.cancelled",
      actorUserId: "superadmin-user",
      entityId: "sale-1",
      entityType: "sale",
      fromDate: "2026-06-24",
      page: 2,
      pageSize: 10,
      toDate: "2026-06-25"
    });

    expect(mockedAxiosApi.get).toHaveBeenCalledWith("/audit/logs", {
      params: {
        action: "sale.cancelled",
        actorUserId: "superadmin-user",
        entityId: "sale-1",
        entityType: "sale",
        fromDate: "2026-06-24",
        page: 2,
        pageSize: 10,
        toDate: "2026-06-25"
      },
      signal: undefined
    });
  });

  it("normalizes audit filters before delegating to the api", async () => {
    const listSpy = vi.spyOn(auditApi, "listAuditLogs").mockResolvedValue(auditLogsResponse);

    await auditFacade.listAuditLogs({
      action: " sale.cancelled ",
      actorUserId: "   ",
      entityId: " sale-1 ",
      entityType: " sale ",
      fromDate: " 2026-06-24 ",
      page: 2,
      pageSize: 10,
      toDate: " 2026-06-25 "
    });

    expect(listSpy).toHaveBeenCalledWith(
      {
        action: "sale.cancelled",
        actorUserId: undefined,
        entityId: "sale-1",
        entityType: "sale",
        fromDate: "2026-06-24",
        page: 2,
        pageSize: 10,
        toDate: "2026-06-25"
      },
      undefined
    );
  });
});

describe("audit store and selectors", () => {
  beforeEach(() => {
    resetAuditStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetAuditStore();
  });

  it("loads audit logs with loading, empty, success, selection and pagination states", async () => {
    const listSpy = vi.spyOn(auditFacade, "listAuditLogs").mockResolvedValueOnce({
      data: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      }
    });

    const emptyPromise = useAuditStore.getState().loadAuditLogs();
    expect(useAuditStore.getState().auditLogsStatus).toBe("loading");
    await emptyPromise;
    expect(useAuditStore.getState().auditLogsStatus).toBe("empty");

    listSpy.mockResolvedValueOnce(auditLogsResponse);
    useAuditStore.getState().setAction("sale.cancelled");
    useAuditStore.getState().setActorUserId("superadmin-user");
    useAuditStore.getState().setEntityType("sale");
    useAuditStore.getState().setEntityId("sale-1");
    useAuditStore.getState().setFromDate("2026-06-24");
    useAuditStore.getState().setToDate("2026-06-25");
    useAuditStore.getState().setPageSize(10);
    useAuditStore.getState().setPage(2);

    await useAuditStore.getState().loadAuditLogs();
    useAuditStore.getState().selectAuditLog("audit-1");

    expect(listSpy).toHaveBeenLastCalledWith(
      {
        action: "sale.cancelled",
        actorUserId: "superadmin-user",
        entityId: "sale-1",
        entityType: "sale",
        fromDate: "2026-06-24",
        page: 2,
        pageSize: 10,
        toDate: "2026-06-25"
      },
      undefined
    );
    expect(useAuditStore.getState().auditLogsStatus).toBe("success");
    expect(useAuditStore.getState().pagination).toEqual(pagination);
    expect(useAuditStore.getState().selectedAuditLog).toEqual(auditLog);
    expect(selectAuditState(useAuditStore.getState()).selectedAuditLogId).toBe("audit-1");
    expect(selectAuditActions(useAuditStore.getState()).reset).toBe(useAuditStore.getState().reset);
  });

  it("maps failed audit loads to error state", async () => {
    vi.spyOn(auditFacade, "listAuditLogs").mockRejectedValue(
      new ApiError({
        code: "VALIDATION_ERROR",
        message: "Invalid audit filters.",
        statusCode: 400
      })
    );

    await useAuditStore.getState().loadAuditLogs();

    expect(useAuditStore.getState().auditLogsStatus).toBe("error");
    expect(useAuditStore.getState().error).toMatchObject({ code: "validation", statusCode: 400 });
  });
});

describe("audit expected errors and permissions", () => {
  beforeEach(() => {
    resetAuditStore();
    useAuthStore.getState().reset();
    vi.restoreAllMocks();
  });

  it.each([
    ["validation", "VALIDATION_ERROR", 400],
    ["session-invalid", "UNAUTHORIZED", 401],
    ["forbidden", "FORBIDDEN", 403]
  ] as const)("maps expected audit error %s", (expectedCode, apiCode, statusCode) => {
    const error = createAuditDataError(
      new ApiError({
        code: apiCode,
        message: "Expected audit error.",
        statusCode
      })
    );

    expect(error.code).toBe(expectedCode);
    expect(getAuditStatusFromError(error)).toBe(
      expectedCode === "forbidden" || expectedCode === "session-invalid" ? "forbidden" : "error"
    );
  });

  it("allows superadmin users to use audit hooks", async () => {
    const probe = await renderAuditHook("superadmin");

    expect(probe.value.canReadAudit).toBe(true);

    await probe.unmount();
  });

  it.each(["admin", "seller"] as const)("blocks %s users and resets audit state without calling endpoints", async (roleName) => {
    const listSpy = vi.spyOn(auditFacade, "listAuditLogs").mockResolvedValue(auditLogsResponse);

    useAuditStore.setState({
      auditLogs: [auditLog],
      auditLogsStatus: "success"
    });
    const probe = await renderAuditHook(roleName);

    await act(async () => {
      await probe.value.loadAuditLogs();
    });

    expect(probe.value.canReadAudit).toBe(false);
    expect(useAuditStore.getState().auditLogs).toEqual([]);
    expect(useAuditStore.getState().auditLogsStatus).toBe("idle");
    expect(listSpy).not.toHaveBeenCalled();

    await probe.unmount();
  });
});
