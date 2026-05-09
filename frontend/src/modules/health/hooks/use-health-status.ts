import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectHealthStatusActions, selectHealthStatusState } from "../store/HealthStatusSelectors";
import { useHealthStatusStore } from "../store/HealthStatusStore";

export function useHealthStatus() {
  const { data, error, status } = useHealthStatusStore(useShallow(selectHealthStatusState));
  const { loadHealthStatus } = useHealthStatusStore(useShallow(selectHealthStatusActions));

  useEffect(() => {
    const controller = new AbortController();

    void loadHealthStatus(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadHealthStatus]);

  return {
    status,
    data,
    error
  };
}
