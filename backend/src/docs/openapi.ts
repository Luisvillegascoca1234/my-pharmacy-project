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
      name: "Auth",
      description: "Authentication and current user session"
    },
    {
      name: "Health",
      description: "Service health checks"
    }
  ],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Authenticated session",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthSession"
                }
              }
            }
          },
          "400": {
            description: "Invalid request payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiError"
                }
              }
            }
          },
          "401": {
            description: "Invalid credentials",
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
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "End the current stateless session",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": {
            description: "Logged out"
          },
          "401": {
            description: "Authentication is required",
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
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Authenticated user",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthenticatedUser"
                }
              }
            }
          },
          "401": {
            description: "Authentication is required",
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
    },
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
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "admin@admin.com"
          },
          password: {
            type: "string",
            format: "password",
            minLength: 1,
            example: "admin"
          }
        }
      },
      AuthRole: {
        type: "object",
        required: ["id", "name", "displayName"],
        properties: {
          id: {
            type: "string"
          },
          name: {
            type: "string",
            example: "superadmin"
          },
          displayName: {
            type: "string",
            example: "Superadmin"
          }
        }
      },
      AuthenticatedUser: {
        type: "object",
        required: ["id", "email", "fullName", "status", "role", "permissions"],
        properties: {
          id: {
            type: "string"
          },
          email: {
            type: "string",
            format: "email"
          },
          fullName: {
            type: "string"
          },
          status: {
            type: "string",
            enum: ["active", "inactive"]
          },
          role: {
            $ref: "#/components/schemas/AuthRole"
          },
          permissions: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      },
      AuthSession: {
        type: "object",
        required: ["token", "user"],
        properties: {
          token: {
            type: "string"
          },
          user: {
            $ref: "#/components/schemas/AuthenticatedUser"
          }
        }
      },
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
