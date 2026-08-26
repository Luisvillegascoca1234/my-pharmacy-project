import type {
  StockPlanningConfidence,
  StockPlanningForecastModel,
  StockPlanningMaturity
} from "@/modules/stock-planning";

export const stockPlanningMaturityLabels: Record<StockPlanningMaturity, string> = {
  low_confidence: "Baja confianza",
  no_history: "Sin historial",
  no_observed_demand: "Sin demanda observada",
  operational: "Datos suficientes"
};

export const stockPlanningConfidenceLabels: Record<StockPlanningConfidence, string> = {
  high: "Alta",
  low: "Baja",
  medium: "Media",
  none: "Sin calificar"
};

export const stockPlanningModelLabels: Record<StockPlanningForecastModel | "none", string> = {
  croston_sba: "Croston-SBA",
  holt: "Tendencia de Holt",
  moving_average: "Promedio móvil",
  none: "Sin modelo",
  recent_naive: "Ingenuo reciente",
  seasonal_naive_weekly: "Ingenuo estacional semanal",
  simple_exponential_smoothing: "Suavizado exponencial simple",
  tsb: "TSB"
};
