import { useEffect, useState } from "react";
import type { HealthStatus } from "@pharmacy-pos/shared";
import { getHealthStatus } from "../api/get-health-status";

type HealthState =
  | {
      status: "loading";
      data: null;
      error: null;
    }
  | {
      status: "success";
      data: HealthStatus;
      error: null;
    }
  | {
      status: "error";
      data: null;
      error: string;
    };

export function useHealthStatus(): HealthState {
  const [state, setState] = useState<HealthState>({
    status: "loading",
    data: null,
    error: null
  });

  useEffect(() => {
    const controller = new AbortController();

    getHealthStatus(controller.signal)
      .then((data) => {
        setState({
          status: "success",
          data,
          error: null
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          data: null,
          error: error instanceof Error ? getHealthErrorMessage(error.message) : "No se pudo conectar con el servidor"
        });
      });

    return () => {
      controller.abort();
    };
  }, []);

  return state;
}

function getHealthErrorMessage(message: string) {
  if (!message.trim() || message.toLowerCase().includes("failed to fetch")) {
    return "No se pudo conectar con el servidor";
  }

  return message;
}
