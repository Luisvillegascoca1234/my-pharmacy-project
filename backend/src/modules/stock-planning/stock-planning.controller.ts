import type { NextFunction, Request, Response } from "express";
import {
  StockPlanningGlobalConfigurationSchema,
  StockPlanningDetailQuerySchema,
  StockPlanningEngineStateSchema,
  StockPlanningExecutionSchema,
  StockPlanningExecutionsResponseSchema,
  StockPlanningProductSchema,
  StockPlanningProductsQuerySchema,
  StockPlanningProductsResponseSchema,
  StockPlanningProductDetailResponseSchema,
  UpdateProductStockConfigurationSchema,
  UpdateStockPlanningGlobalConfigurationSchema
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { StockPlanningService } from "./stock-planning.service.js";
import { StockPlanningExecutionService } from "./stock-planning-execution.service.js";
import { ForecastService } from "./forecasting/forecast.service.js";
import { StockPlanningExecutionRepository } from "./stock-planning-execution.repository.js";
import { StockPlanningDetailService } from "./stock-planning-detail.service.js";

const stockPlanningExecutionRepository = new StockPlanningExecutionRepository();
const stockPlanningExecutionService = new StockPlanningExecutionService(
  stockPlanningExecutionRepository,
  undefined,
  new ForecastService()
);
const stockPlanningService = new StockPlanningService(
  undefined,
  undefined,
  {
    getCurrentConfiguration: () => stockPlanningExecutionRepository.getCurrentConfiguration(),
    getEngineState: () => stockPlanningExecutionService.getEngineState()
  }
);
const stockPlanningDetailService = new StockPlanningDetailService();

export async function getStockPlanningConfiguration(_request: Request, response: Response, next: NextFunction) {
  try {
    const configuration = await stockPlanningExecutionService.getConfiguration();
    response.json(StockPlanningGlobalConfigurationSchema.parse(configuration));
  } catch (error) {
    next(error);
  }
}

export async function updateStockPlanningConfiguration(request: Request, response: Response, next: NextFunction) {
  try {
    const input = UpdateStockPlanningGlobalConfigurationSchema.parse(request.body);
    const configuration = await stockPlanningExecutionService.updateConfiguration(input, getAuditContext(request));
    response.json(StockPlanningGlobalConfigurationSchema.parse(configuration));
  } catch (error) {
    next(error);
  }
}

export async function getStockPlanningEngineState(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(StockPlanningEngineStateSchema.parse(await stockPlanningExecutionService.getEngineState()));
  } catch (error) {
    next(error);
  }
}

export async function listStockPlanningExecutions(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(StockPlanningExecutionsResponseSchema.parse({
      data: await stockPlanningExecutionService.listExecutions()
    }));
  } catch (error) {
    next(error);
  }
}

export async function runManualStockPlanningExecution(request: Request, response: Response, next: NextFunction) {
  try {
    const execution = await stockPlanningExecutionService.runManual(
      getAuditContext(request),
      getRequiredIdempotencyKey(request)
    );
    response.status(201).json(StockPlanningExecutionSchema.parse(execution));
  } catch (error) {
    next(error);
  }
}

export async function listStockPlanningProducts(request: Request, response: Response, next: NextFunction) {
  try {
    const query = StockPlanningProductsQuerySchema.parse(request.query);
    const result = await stockPlanningService.listProducts(query);

    response.json(StockPlanningProductsResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function getStockPlanningProductDetail(request: Request, response: Response, next: NextFunction) {
  try {
    const query = StockPlanningDetailQuerySchema.parse(request.query);
    const result = await stockPlanningDetailService.getProductDetail(
      request.params.productId,
      query.executionId
    );
    response.json(StockPlanningProductDetailResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function updateProductStockConfiguration(request: Request, response: Response, next: NextFunction) {
  try {
    const input = UpdateProductStockConfigurationSchema.parse(request.body);
    const result = await stockPlanningService.updateProductConfiguration(
      request.params.productId,
      input,
      getAuditContext(request)
    );

    response.json(StockPlanningProductSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

function getRequiredIdempotencyKey(request: Request) {
  const idempotencyKey = request.get("Idempotency-Key")?.trim();

  if (!idempotencyKey || !/^[A-Za-z0-9][A-Za-z0-9:_-]{7,127}$/.test(idempotencyKey)) {
    throw new HttpError(
      400,
      "A valid Idempotency-Key header is required to request a stock planning recalculation.",
      "STOCK_PLANNING_IDEMPOTENCY_KEY_REQUIRED"
    );
  }

  return idempotencyKey;
}

function getAuditContext(request: Request) {
  return {
    actorUserId: request.authenticatedUser?.id,
    ipAddress: request.ip,
    userAgent: request.get("user-agent")
  };
}
