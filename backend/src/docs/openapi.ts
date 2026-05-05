import { env } from "../config/env.js";

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Pharmacy POS API",
    version: env.APP_VERSION,
    description: "API documentation for the pharmacy POS system."
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}/api`,
      description: "Local development API"
    }
  ],
  tags: [
    {
      name: "Health",
      description: "Service health checks"
    }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Get backend health status",
        responses: {
          "200": {
            description: "Backend is available",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthStatus"
                }
              }
            }
          },
          "500": {
            description: "Unexpected server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      HealthStatus: {
        type: "object",
        required: ["status", "version", "timestamp"],
        properties: {
          status: {
            type: "string",
            enum: ["ok"]
          },
          version: {
            type: "string",
            example: "0.1.0"
          },
          timestamp: {
            type: "string",
            format: "date-time"
          }
        }
      },
      ApiError: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string"
          },
          code: {
            type: "string"
          },
          details: {}
        }
      }
    }
  }
} as const;
