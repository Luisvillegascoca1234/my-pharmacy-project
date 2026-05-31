import { useCallback, useEffect, useMemo, useState } from "react";
import type { Alert } from "@pharmacy-pos/shared";
import { selectAuthToken, useAuthStore } from "@/modules/auth";
import { alertsFacade } from "../facades/alertsFacade";

type RequestStatus = "error" | "idle" | "loading" | "success";

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useAlerts() {
  const token = useAuthStore(selectAuthToken);
  const [items, setItems] = useState<Alert[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setItems([]);
        setGeneratedAt(null);
        setStatus("idle");
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const response = await alertsFacade.listAlerts(signal);

        setItems(response.data);
        setGeneratedAt(response.generatedAt);
        setStatus("success");
      } catch (requestError) {
        if (isAbortError(requestError)) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar las alertas.");
        setStatus("error");
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadAlerts(controller.signal);

    return () => controller.abort();
  }, [loadAlerts]);

  return useMemo(() => ({ error, generatedAt, items, reload: loadAlerts, status }), [error, generatedAt, items, loadAlerts, status]);
}
