import type {
  StockPlanningConfidence,
  StockPlanningForecastModel,
  StockPlanningMaturity
} from "@/modules/stock-planning";

export const stockPlanningMaturityLabels: Record<StockPlanningMaturity, string> = {
  low_confidence: "Pocos datos disponibles",
  no_history: "No hay suficientes ventas",
  no_observed_demand: "No hubo ventas recientes",
  operational: "Historial suficiente"
};

export const stockPlanningConfidenceLabels: Record<StockPlanningConfidence, string> = {
  high: "Buena",
  low: "Limitada",
  medium: "Moderada",
  none: "No disponible"
};

export const stockPlanningModelLabels: Record<StockPlanningForecastModel | "none", string> = {
  croston_sba: "Ventas ocasionales",
  holt: "Tendencia de ventas",
  moving_average: "Promedio de ventas recientes",
  none: "Sin cálculo predictivo",
  recent_naive: "Comportamiento de las últimas ventas",
  seasonal_naive_weekly: "Patrón semanal de ventas",
  simple_exponential_smoothing: "Promedio con mayor peso a ventas recientes",
  tsb: "Ventas esporádicas"
};
