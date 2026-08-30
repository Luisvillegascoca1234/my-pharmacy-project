import type {
  ProductUnit,
  StockPlanningProductsQuery,
  UpdateProductStockConfiguration,
  UpdateStockPlanningGlobalConfiguration
} from "@pharmacy-pos/shared";
import { stockPlanningApi } from "../api/stock-planning-api";
import type { StockPlanningData, StockPlanningPresentationOption } from "../types/stockPlanningTypes";
import { mapStockPlanningAnalytics } from "../utils/stockPlanningAnalytics";
import { mapStockPlanningDetailAnalytics } from "../utils/stockPlanningDetail";

export const stockPlanningFacade = {
  async list(
    query: StockPlanningProductsQuery = {},
    signal?: AbortSignal
  ): Promise<StockPlanningData> {
    const [planningResponse, productCatalog, engineState, executions] = await Promise.all([
      stockPlanningApi.listProducts(query, signal),
      stockPlanningApi.listProductCatalog(signal),
      stockPlanningApi.getEngineState(signal),
      stockPlanningApi.listExecutions(signal)
    ]);
    const visibleProductIds = new Set(planningResponse.data.map((product) => product.productId));
    const presentationOptionsByProductId = Object.fromEntries(
      productCatalog
        .filter((product) => visibleProductIds.has(product.id))
        .map((product) => [product.id, product.units.map(toPresentationOption)])
    );

    return {
      alerts: planningResponse.alerts,
      analyticsByProductId: mapStockPlanningAnalytics(planningResponse.data, executions),
      configuration: engineState.configuration,
      engineState,
      executions,
      groups: planningResponse.groups ?? [],
      presentationOptionsByProductId,
      products: planningResponse.data,
      summary: planningResponse.summary
    };
  },

  updateProduct(
    productId: string,
    input: UpdateProductStockConfiguration
  ) {
    return stockPlanningApi.updateProductConfiguration(productId, input);
  },

  updateConfiguration(input: UpdateStockPlanningGlobalConfiguration) {
    return stockPlanningApi.updateConfiguration(input);
  },

  runManualExecution(idempotencyKey: string) {
    return stockPlanningApi.runManualExecution(idempotencyKey);
  },

  async getProductDetail(productId: string, executionId?: string, signal?: AbortSignal) {
    const detail = await stockPlanningApi.getProductDetail(productId, executionId, signal);
    return {
      analytics: mapStockPlanningDetailAnalytics(detail),
      detail
    };
  }
};

function toPresentationOption(unit: ProductUnit): StockPlanningPresentationOption {
  return {
    abbreviation: unit.unit.abbreviation,
    conversionFactor: unit.conversionFactor,
    id: unit.id,
    name: unit.unit.name
  };
}
