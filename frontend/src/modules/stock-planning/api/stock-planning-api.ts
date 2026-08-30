import type {
  Product,
  StockPlanningEngineState,
  StockPlanningExecution,
  StockPlanningGlobalConfiguration,
  StockPlanningProduct,
  StockPlanningProductDetailResponse,
  StockPlanningProductsQuery,
  StockPlanningProductsResponse,
  UpdateProductStockConfiguration,
  UpdateStockPlanningGlobalConfiguration
} from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const stockPlanningApi = {
  async getConfiguration(signal?: AbortSignal): Promise<StockPlanningGlobalConfiguration> {
    const response = await axiosApi.get<StockPlanningGlobalConfiguration>("/stock-planning/configuration", { signal });
    return response.data;
  },

  async getEngineState(signal?: AbortSignal): Promise<StockPlanningEngineState> {
    const response = await axiosApi.get<StockPlanningEngineState>("/stock-planning/engine-state", { signal });
    return response.data;
  },

  async listExecutions(signal?: AbortSignal): Promise<StockPlanningExecution[]> {
    const response = await axiosApi.get<{ data: StockPlanningExecution[] }>("/stock-planning/executions", { signal });
    return response.data.data;
  },

  async updateConfiguration(input: UpdateStockPlanningGlobalConfiguration): Promise<StockPlanningGlobalConfiguration> {
    const response = await axiosApi.put<StockPlanningGlobalConfiguration>("/stock-planning/configuration", input);
    return response.data;
  },

  async runManualExecution(idempotencyKey: string): Promise<StockPlanningExecution> {
    const response = await axiosApi.post<StockPlanningExecution>(
      "/stock-planning/executions/manual",
      undefined,
      { headers: { "Idempotency-Key": idempotencyKey } }
    );
    return response.data;
  },

  async listProductCatalog(signal?: AbortSignal): Promise<Product[]> {
    const response = await axiosApi.get<Product[]>("/products", { signal });

    return response.data;
  },

  async listProducts(
    query: StockPlanningProductsQuery,
    signal?: AbortSignal
  ): Promise<StockPlanningProductsResponse> {
    const response = await axiosApi.get<StockPlanningProductsResponse>("/stock-planning/products", {
      params: query,
      signal
    });

    return response.data;
  },

  async getProductDetail(
    productId: string,
    executionId?: string,
    signal?: AbortSignal
  ): Promise<StockPlanningProductDetailResponse> {
    const response = await axiosApi.get<StockPlanningProductDetailResponse>(
      `/stock-planning/products/${productId}/detail`,
      { params: executionId ? { executionId } : {}, signal }
    );
    return response.data;
  },

  async updateProductConfiguration(
    productId: string,
    input: UpdateProductStockConfiguration
  ): Promise<StockPlanningProduct> {
    const response = await axiosApi.patch<StockPlanningProduct>(
      `/stock-planning/products/${productId}/configuration`,
      input
    );

    return response.data;
  }
};
