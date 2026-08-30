import type { StockPlanningProductDetailResponse } from "@pharmacy-pos/shared";
import type {
  StockPlanningDetailAnalytics,
  StockPlanningTemporalPoint
} from "../types/stockPlanningTypes";

export function mapStockPlanningDetailAnalytics(
  detail: StockPlanningProductDetailResponse
): StockPlanningDetailAnalytics {
  const points = new Map<string, StockPlanningTemporalPoint>();
  const target = detail.result.recommendation?.targetStock ?? null;

  for (const observation of detail.result.observations) {
    points.set(observation.date, {
      band80: null,
      censored: observation.censored,
      censoredMarker: observation.censored ? 0 : null,
      date: observation.date,
      demand: observation.censored ? null : observation.netDemand,
      forecast: null,
    });
  }

  for (const forecast of detail.result.forecast) {
    const point = getOrCreatePoint(points, forecast.date);
    point.forecast = forecast.central;
    point.band80 = [forecast.lower80, forecast.upper80];
  }

  return {
    demand: [...points.values()].sort((first, second) => first.date.localeCompare(second.date)),
    performance: detail.history
      .map((execution) => ({
        bias: execution.bias,
        date: execution.startedAt,
        executionId: execution.executionId,
        scaledError: execution.scaledError
      }))
      .sort((first, second) => first.date.localeCompare(second.date)),
    stock: detail.snapshots.map((snapshot) => ({
      date: snapshot.date,
      stock: snapshot.stock,
      target
    }))
  };
}

function getOrCreatePoint(
  points: Map<string, StockPlanningTemporalPoint>,
  date: string
) {
  const existing = points.get(date);
  if (existing) return existing;

  const point: StockPlanningTemporalPoint = {
    band80: null,
    censored: false,
    censoredMarker: null,
    date,
    demand: null,
    forecast: null
  };
  points.set(date, point);
  return point;
}
