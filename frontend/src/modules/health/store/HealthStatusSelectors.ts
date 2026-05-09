import type { HealthStatusActions } from "./HealthStatusActions";
import type { HealthStatusState } from "./HealthStatusState";

export type HealthStatusStore = HealthStatusState & HealthStatusActions;

export const selectHealthStatusActions = (state: HealthStatusStore) => ({
  loadHealthStatus: state.loadHealthStatus,
  reset: state.reset
});

export const selectHealthStatusState = (state: HealthStatusStore) => ({
  data: state.data,
  error: state.error,
  status: state.status
});
