import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CreateInventoryAdjustment,
  FefoPreview,
  InventoryAdjustment,
  InventoryBatch,
  InventoryMovement,
  InventoryMovementType,
  InventoryStockItem,
  InventoryStockStatus,
  PaginationMeta
} from "@pharmacy-pos/shared";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { inventoryFacade } from "../facades/inventoryFacade";

type RequestStatus = "error" | "idle" | "loading" | "success";

const DEFAULT_PAGE_SIZE = 20;

const initialPagination: PaginationMeta = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

export function useInventoryStock() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const canRead = Boolean(token && user);
  const [items, setItems] = useState<InventoryStockItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [search, setSearchValue] = useState("");
  const [statusFilter, setStatusFilterValue] = useState<InventoryStockStatus | "all">("all");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadStock = useCallback(
    async (signal?: AbortSignal) => {
      if (!canRead) {
        setItems([]);
        setPagination(initialPagination);
        setStatus("idle");
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const response = await inventoryFacade.listStock(
          {
            page: pagination.page,
            pageSize: pagination.pageSize,
            search: search || undefined,
            status: statusFilter === "all" ? undefined : statusFilter
          },
          signal
        );

        setItems(response.data);
        setPagination(response.pagination);
        setStatus("success");
      } catch (requestError) {
        if (isAbortError(requestError)) {
          return;
        }

        setError(getErrorMessage(requestError));
        setStatus("error");
      }
    },
    [canRead, pagination.page, pagination.pageSize, search, statusFilter]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadStock(controller.signal);

    return () => controller.abort();
  }, [loadStock]);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }, []);

  const setStatusFilter = useCallback((value: InventoryStockStatus | "all") => {
    setStatusFilterValue(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((current) => ({ ...current, page }));
  }, []);

  return useMemo(
    () => ({
      canRead,
      error,
      items,
      pagination,
      reload: loadStock,
      search,
      setPage,
      setSearch,
      setStatusFilter,
      status,
      statusFilter
    }),
    [canRead, error, items, loadStock, pagination, search, setPage, setSearch, setStatusFilter, status, statusFilter]
  );
}

export function useInventoryMovements() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const canRead = Boolean(token && user);
  const [items, setItems] = useState<InventoryMovement[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [search, setSearchValue] = useState("");
  const [type, setTypeValue] = useState<InventoryMovementType | "all">("all");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadMovements = useCallback(
    async (signal?: AbortSignal) => {
      if (!canRead) {
        setItems([]);
        setPagination(initialPagination);
        setStatus("idle");
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const response = await inventoryFacade.listMovements(
          {
            page: pagination.page,
            pageSize: pagination.pageSize,
            search: search || undefined,
            type: type === "all" ? undefined : type
          },
          signal
        );

        setItems(response.data);
        setPagination(response.pagination);
        setStatus("success");
      } catch (requestError) {
        if (isAbortError(requestError)) {
          return;
        }

        setError(getErrorMessage(requestError));
        setStatus("error");
      }
    },
    [canRead, pagination.page, pagination.pageSize, search, type]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadMovements(controller.signal);

    return () => controller.abort();
  }, [loadMovements]);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }, []);

  const setType = useCallback((value: InventoryMovementType | "all") => {
    setTypeValue(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((current) => ({ ...current, page }));
  }, []);

  return useMemo(
    () => ({ canRead, error, items, pagination, reload: loadMovements, search, setPage, setSearch, setType, status, type }),
    [canRead, error, items, loadMovements, pagination, search, setPage, setSearch, setType, status, type]
  );
}

export function useInventoryBatches(productId: string | null) {
  const token = useAuthStore(selectAuthToken);
  const [items, setItems] = useState<InventoryBatch[]>([]);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadBatches = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !productId) {
        setItems([]);
        setStatus("idle");
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const response = await inventoryFacade.listProductBatches(productId, signal);

        setItems(response);
        setStatus("success");
      } catch (requestError) {
        if (isAbortError(requestError)) {
          return;
        }

        setError(getErrorMessage(requestError));
        setStatus("error");
      }
    },
    [productId, token]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadBatches(controller.signal);

    return () => controller.abort();
  }, [loadBatches]);

  return useMemo(() => ({ error, items, reload: loadBatches, status }), [error, items, loadBatches, status]);
}

export function useInventoryAdjustment() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const canAdjust = user?.role.name === "superadmin" || user?.role.name === "admin";
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState<InventoryAdjustment | null>(null);

  const saveAdjustment = useCallback(
    async (input: CreateInventoryAdjustment) => {
      if (!token || !canAdjust) {
        return null;
      }

      setStatus("loading");
      setError(null);

      try {
        const response = await inventoryFacade.createAdjustment(input);

        setAdjustment(response);
        setStatus("success");

        return response;
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        setStatus("error");

        return null;
      }
    },
    [canAdjust, token]
  );

  return useMemo(() => ({ adjustment, canAdjust, error, saveAdjustment, status }), [adjustment, canAdjust, error, saveAdjustment, status]);
}

export function useFefoPreview(productId: string | null, quantity?: number) {
  const token = useAuthStore(selectAuthToken);
  const [data, setData] = useState<FefoPreview | null>(null);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !productId) {
      setData(null);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    const currentProductId = productId;

    async function loadPreview() {
      setStatus("loading");
      setError(null);

      try {
        const response = await inventoryFacade.getFefoPreview(currentProductId, quantity, controller.signal);

        setData(response);
        setStatus("success");
      } catch (requestError) {
        if (isAbortError(requestError)) {
          return;
        }

        setError(getErrorMessage(requestError));
        setStatus("error");
      }
    }

    void loadPreview();

    return () => controller.abort();
  }, [productId, quantity, token]);

  return useMemo(() => ({ data, error, status }), [data, error, status]);
}
