import type {
  StockPlanningExecution,
  StockPlanningProduct
} from "@pharmacy-pos/shared";
import type { StockPlanningProductAnalytics } from "../types/stockPlanningTypes";

const DEGRADATION_WARNINGS = new Set([
  "backtest_unavailable",
  "high_censorship",
  "insufficient_history",
  "limited_evidence"
]);

export function mapStockPlanningProductAnalytics(
  product: StockPlanningProduct,
  executions: StockPlanningExecution[]
): StockPlanningProductAnalytics {
  const latestCompletedExecution = executions.reduce<StockPlanningExecution | null>(
    (latest, execution) => {
      if (execution.status === "running") return latest;
      if (!latest) return execution;
      return new Date(execution.startedAt).getTime() > new Date(latest.startedAt).getTime()
        ? execution
        : latest;
    },
    null
  );
  const forecast = product.forecast;
  const stale = Boolean(
    forecast &&
    latestCompletedExecution &&
    forecast.executionId !== latestCompletedExecution.id
  );

  return {
    available: Boolean(forecast),
    baselineRetained: product.warnings.includes("baseline_retained"),
    degraded: product.warnings.some((warning) => DEGRADATION_WARNINGS.has(warning)),
    evidenceLimited:
      !forecast ||
      product.maturity === "no_history" ||
      product.maturity === "low_confidence" ||
      product.confidence === "none",
    freshness: stale ? "stale" : forecast ? "current" : "reference",
    intervalWidth80: forecast ? Math.max(0, forecast.upper80 - forecast.lower80) : null,
    latestCompletedExecutionId: latestCompletedExecution?.id ?? null
  };
}

export function mapStockPlanningAnalytics(
  products: StockPlanningProduct[],
  executions: StockPlanningExecution[]
): Record<string, StockPlanningProductAnalytics> {
  return Object.fromEntries(
    products.map((product) => [
      product.productId,
      mapStockPlanningProductAnalytics(product, executions)
    ])
  );
}
