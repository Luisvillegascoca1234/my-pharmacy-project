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
          error: error instanceof Error ? error.message : "Unable to reach backend"
        });
      });

    return () => {
      controller.abort();
    };
  }, []);

  return state;
}
