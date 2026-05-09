export type HealthStatusActions = {
  loadHealthStatus: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
};
