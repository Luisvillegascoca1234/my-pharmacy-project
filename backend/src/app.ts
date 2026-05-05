import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { openApiDocument } from "./docs/openapi.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { apiRoutes } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL
    })
  );
  app.use(express.json());

  app.get("/api/docs.json", (_request, response) => {
    response.json(openApiDocument);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/api", apiRoutes);
  app.use(errorHandler);

  return app;
}
