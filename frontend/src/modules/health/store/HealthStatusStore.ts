import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { healthFacade } from "../facades/healthFacade";
import type { HealthStatusActions } from "./HealthStatusActions";
import { initialHealthStatusState, type HealthStatusState } from "./HealthStatusState";

export type HealthStatusStore = HealthStatusState & HealthStatusActions;

export const useHealthStatusStore = create<HealthStatusStore>()(
  devtools(
    (set) => ({
      ...initialHealthStatusState,

      async loadHealthStatus(signal) {
        set(
          {
            data: null,
            error: null,
            status: "loading"
          },
          false,
          "loadHealthStatus:start"
        );

        try {
          const data = await healthFacade.getHealthStatus(signal);

          set(
            {
              data,
              error: null,
              status: "success"
            },
            false,
            "loadHealthStatus:success"
          );
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          set(
            {
              data: null,
              error: error instanceof Error ? getHealthErrorMessage(error.message) : "No se pudo conectar con el servidor",
              status: "error"
            },
            false,
            "loadHealthStatus:error"
          );
        }
      },

      reset() {
        set(initialHealthStatusState, false, "reset");
      }
    }),
    { name: "HealthStatusStore" }
  )
);

export function resetHealthStatusStore() {
  useHealthStatusStore.getState().reset();
}

function getHealthErrorMessage(message: string) {
  if (!message.trim() || message.toLowerCase().includes("failed to fetch")) {
    return "No se pudo conectar con el servidor";
  }

  return message;
}
