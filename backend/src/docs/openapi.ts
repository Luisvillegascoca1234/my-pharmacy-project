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
    },
    {
      name: "Catalogs",
      description: "Product categories, units, products, and product unit conversions"
    },
    {
      name: "Roles",
      description: "Role selection for administrative user management"
    },
    {
      name: "Users",
      description: "Superadmin user management and current user profile"
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
            $ref: "#/components/responses/BadRequest"
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
            $ref: "#/components/responses/Unauthorized"
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
            $ref: "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/roles": {
      get: {
        tags: ["Roles"],
        summary: "List roles available for user assignment",
        description: "Available to superadmin users.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Roles ordered by display name",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/UserRole"
                  }
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          }
        }
      }
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get the authenticated user from the users module",
        description: "Returns the current authenticated user without passwordHash.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current safe user profile",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        description: "Available to superadmin users. Supports basic search and role/status filters.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "search",
            in: "query",
            required: false,
            schema: {
              type: "string"
            }
          },
          {
            name: "roleId",
            in: "query",
            required: false,
            schema: {
              type: "string"
            }
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              $ref: "#/components/schemas/UserStatus"
            }
          }
        ],
        responses: {
          "200": {
            description: "Users ordered by full name",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/User"
                  }
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Create a user",
        description: "Available to superadmin users. Duplicate emails return USER_EMAIL_IN_USE and creation writes USER_CREATED audit.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateUserRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "409": {
            description: "User email is already in use",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiError"
                },
                example: {
                  message: "User email is already in use.",
                  code: "USER_EMAIL_IN_USE"
                }
              }
            }
          }
        }
      }
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a user",
        description: "Available to superadmin users.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UserId" }],
        responses: {
          "200": {
            description: "Safe user detail",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/UserNotFound"
          }
        }
      },
      patch: {
        tags: ["Users"],
        summary: "Update a user",
        description: "Available to superadmin users. Role changes write USER_ROLE_CHANGED audit and cannot remove the last active superadmin.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UserId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateUserRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "User updated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/UserNotFound"
          },
          "409": {
            description: "User email is already in use"
          }
        }
      }
    },
    "/users/{id}/status": {
      patch: {
        tags: ["Users"],
        summary: "Update user status",
        description: "Available to superadmin users. Cannot deactivate or block the last active superadmin.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UserId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateUserStatusRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "User status updated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/UserNotFound"
          }
        }
      }
    },
    "/users/{id}/reset-password": {
      post: {
        tags: ["Users"],
        summary: "Reset user password",
        description: "Available to superadmin users. The superadmin defines the new password and USER_PASSWORD_RESET audit is written.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UserId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ResetUserPasswordRequest"
              }
            }
          }
        },
        responses: {
          "204": {
            description: "Password reset"
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/UserNotFound"
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
            $ref: "#/components/responses/UnexpectedError"
          }
        }
      }
    },
    "/product-categories": {
      get: {
        tags: ["Catalogs"],
        summary: "List product categories",
        description: "Available to superadmin, admin, and seller users.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Product categories ordered by name",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/ProductCategory"
                  }
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          }
        }
      },
      post: {
        tags: ["Catalogs"],
        summary: "Create a product category",
        description: "Available to superadmin and admin users. Duplicate names return PRODUCT_CATEGORY_NAME_IN_USE.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateProductCategoryRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Product category created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ProductCategory"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "409": {
            description: "Product category name is already in use",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiError"
                },
                example: {
                  message: "Product category name is already in use.",
                  code: "PRODUCT_CATEGORY_NAME_IN_USE"
                }
              }
            }
          }
        }
      }
    },
    "/units": {
      get: {
        tags: ["Catalogs"],
        summary: "List units",
        description: "Available to superadmin, admin, and seller users.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Units ordered by name",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Unit"
                  }
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          }
        }
      },
      post: {
        tags: ["Catalogs"],
        summary: "Create a unit",
        description: "Available to superadmin and admin users. Duplicate names or abbreviations return UNIT_NAME_IN_USE or UNIT_ABBREVIATION_IN_USE.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateUnitRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Unit created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Unit"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "409": {
            description: "Unit name or abbreviation is already in use",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiError"
                },
                examples: {
                  unitNameInUse: {
                    value: {
                      message: "Unit name is already in use.",
                      code: "UNIT_NAME_IN_USE"
                    }
                  },
                  unitAbbreviationInUse: {
                    value: {
                      message: "Unit abbreviation is already in use.",
                      code: "UNIT_ABBREVIATION_IN_USE"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/products": {
      get: {
        tags: ["Catalogs"],
        summary: "List products",
        description: "Available to superadmin, admin, and seller users.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "search",
            in: "query",
            required: false,
            schema: {
              type: "string"
            },
            description: "Search by commercial name, generic name, internal code, or barcode"
          }
        ],
        responses: {
          "200": {
            description: "Products ordered by commercial name",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Product"
                  }
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          }
        }
      },
      post: {
        tags: ["Catalogs"],
        summary: "Create a product",
        description: "Available to superadmin and admin users. Creates a PRODUCT_CREATED audit log.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateProductRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Product created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Product"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "409": {
            $ref: "#/components/responses/ProductCodeConflict"
          }
        }
      }
    },
    "/products/{id}": {
      get: {
        tags: ["Catalogs"],
        summary: "Get a product",
        description: "Available to superadmin, admin, and seller users.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            $ref: "#/components/parameters/ProductId"
          }
        ],
        responses: {
          "200": {
            description: "Product detail with category, base unit, and conversions",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Product"
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/ProductNotFound"
          }
        }
      },
      patch: {
        tags: ["Catalogs"],
        summary: "Update a product",
        description: "Available to superadmin and admin users. Creates a PRODUCT_UPDATED audit log.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            $ref: "#/components/parameters/ProductId"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateProductRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Product updated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Product"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/ProductNotFound"
          },
          "409": {
            $ref: "#/components/responses/ProductCodeConflict"
          }
        }
      }
    },
    "/products/{id}/units": {
      put: {
        tags: ["Catalogs"],
        summary: "Replace product unit conversions",
        description: "Available to superadmin and admin users. The base unit is required and is normalized to a conversion factor of 1. Creates a PRODUCT_UNITS_UPDATED audit log.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            $ref: "#/components/parameters/ProductId"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateProductUnitsRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Product unit conversions replaced",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Product"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/ProductNotFound"
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
    parameters: {
      ProductId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string"
        },
        description: "Product identifier"
      },
      UserId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string"
        },
        description: "User identifier"
      }
    },
    responses: {
      BadRequest: {
        description: "Invalid request payload or business rule violation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            }
          }
        }
      },
      Unauthorized: {
        description: "Authentication is required",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Authentication is required.",
              code: "AUTHENTICATION_REQUIRED"
            }
          }
        }
      },
      Forbidden: {
        description: "The authenticated user does not have permission",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "You do not have permission to perform this action.",
              code: "FORBIDDEN"
            }
          }
        }
      },
      ProductNotFound: {
        description: "Product was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Product was not found.",
              code: "PRODUCT_NOT_FOUND"
            }
          }
        }
      },
      UserNotFound: {
        description: "User was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "User was not found.",
              code: "USER_NOT_FOUND"
            }
          }
        }
      },
      ProductCodeConflict: {
        description: "Product internal code or barcode is already in use",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              internalCodeInUse: {
                value: {
                  message: "Product internal code is already in use.",
                  code: "PRODUCT_INTERNAL_CODE_IN_USE"
                }
              },
              barcodeInUse: {
                value: {
                  message: "Product barcode is already in use.",
                  code: "PRODUCT_BARCODE_IN_USE"
                }
              }
            }
          }
        }
      },
      UnexpectedError: {
        description: "Unexpected server error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            }
          }
        }
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
      UserStatus: {
        type: "string",
        enum: ["active", "inactive", "blocked"]
      },
      UserRole: {
        type: "object",
        required: ["id", "name", "displayName"],
        properties: {
          id: {
            type: "string"
          },
          name: {
            type: "string",
            example: "admin"
          },
          displayName: {
            type: "string",
            example: "Admin"
          }
        }
      },
      User: {
        type: "object",
        required: ["id", "email", "fullName", "roleId", "role", "permissions", "status", "createdAt", "updatedAt"],
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
          roleId: {
            type: "string"
          },
          role: {
            $ref: "#/components/schemas/UserRole"
          },
          permissions: {
            type: "array",
            items: {
              type: "string"
            }
          },
          status: {
            $ref: "#/components/schemas/UserStatus"
          },
          lastLoginAt: {
            type: "string",
            format: "date-time"
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      CreateUserRequest: {
        type: "object",
        required: ["email", "fullName", "roleId", "password"],
        properties: {
          email: {
            type: "string",
            format: "email"
          },
          fullName: {
            type: "string",
            minLength: 2,
            maxLength: 160
          },
          roleId: {
            type: "string"
          },
          password: {
            type: "string",
            format: "password",
            minLength: 6,
            maxLength: 128
          }
        }
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email"
          },
          fullName: {
            type: "string",
            minLength: 2,
            maxLength: 160
          },
          roleId: {
            type: "string"
          }
        }
      },
      UpdateUserStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            $ref: "#/components/schemas/UserStatus"
          }
        }
      },
      ResetUserPasswordRequest: {
        type: "object",
        required: ["password", "confirmPassword"],
        properties: {
          password: {
            type: "string",
            format: "password",
            minLength: 6,
            maxLength: 128
          },
          confirmPassword: {
            type: "string",
            format: "password",
            minLength: 6,
            maxLength: 128
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
            enum: ["active", "inactive", "blocked"]
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
      ProductStatus: {
        type: "string",
        enum: ["active", "inactive"]
      },
      ProductType: {
        type: "string",
        enum: ["medicine", "otc", "medical_supply", "hygiene_disinfection", "related_misc"]
      },
      ProductCategory: {
        type: "object",
        required: ["id", "name", "status", "createdAt", "updatedAt"],
        properties: {
          id: {
            type: "string"
          },
          name: {
            type: "string",
            example: "Medicamentos"
          },
          description: {
            type: "string",
            example: "Productos farmaceuticos con control sanitario"
          },
          status: {
            $ref: "#/components/schemas/ProductStatus"
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      CreateProductCategoryRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
            minLength: 2,
            maxLength: 120,
            example: "Medicamentos"
          },
          description: {
            type: "string",
            nullable: true,
            example: "Productos farmaceuticos con control sanitario"
          }
        }
      },
      Unit: {
        type: "object",
        required: ["id", "name", "abbreviation", "status", "createdAt", "updatedAt"],
        properties: {
          id: {
            type: "string"
          },
          name: {
            type: "string",
            example: "Tableta"
          },
          abbreviation: {
            type: "string",
            example: "tab"
          },
          description: {
            type: "string",
            example: "Unidad base para tabletas"
          },
          status: {
            $ref: "#/components/schemas/ProductStatus"
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      CreateUnitRequest: {
        type: "object",
        required: ["name", "abbreviation"],
        properties: {
          name: {
            type: "string",
            minLength: 2,
            maxLength: 80,
            example: "Caja"
          },
          abbreviation: {
            type: "string",
            minLength: 1,
            maxLength: 16,
            example: "cj"
          },
          description: {
            type: "string",
            nullable: true,
            example: "Presentacion comercial"
          }
        }
      },
      ProductUnit: {
        type: "object",
        required: ["id", "productId", "unitId", "unit", "conversionFactor", "createdAt", "updatedAt"],
        properties: {
          id: {
            type: "string"
          },
          productId: {
            type: "string"
          },
          unitId: {
            type: "string"
          },
          unit: {
            $ref: "#/components/schemas/Unit"
          },
          conversionFactor: {
            type: "number",
            minimum: 0.0001,
            example: 10
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      Product: {
        type: "object",
        required: [
          "id",
          "internalCode",
          "commercialName",
          "type",
          "categoryId",
          "category",
          "baseUnitId",
          "baseUnit",
          "isMedicine",
          "isOverTheCounter",
          "requiresPrescription",
          "isInventoryTracked",
          "requiresBatch",
          "requiresExpiration",
          "minimumStock",
          "salePrice",
          "status",
          "units",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: {
            type: "string"
          },
          internalCode: {
            type: "string",
            example: "MED-001"
          },
          barcode: {
            type: "string",
            example: "7790000000012"
          },
          commercialName: {
            type: "string",
            example: "Paracetamol 500 mg"
          },
          genericName: {
            type: "string",
            example: "Paracetamol"
          },
          description: {
            type: "string"
          },
          type: {
            $ref: "#/components/schemas/ProductType"
          },
          categoryId: {
            type: "string"
          },
          category: {
            $ref: "#/components/schemas/ProductCategory"
          },
          baseUnitId: {
            type: "string"
          },
          baseUnit: {
            $ref: "#/components/schemas/Unit"
          },
          laboratoryName: {
            type: "string",
            example: "Laboratorio local"
          },
          sanitaryRegistration: {
            type: "string",
            example: "RS-12345"
          },
          isMedicine: {
            type: "boolean"
          },
          isOverTheCounter: {
            type: "boolean"
          },
          requiresPrescription: {
            type: "boolean"
          },
          isInventoryTracked: {
            type: "boolean"
          },
          requiresBatch: {
            type: "boolean"
          },
          requiresExpiration: {
            type: "boolean"
          },
          minimumStock: {
            type: "number",
            minimum: 0,
            example: 20
          },
          salePrice: {
            type: "number",
            minimum: 0,
            example: 1.5
          },
          status: {
            $ref: "#/components/schemas/ProductStatus"
          },
          units: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ProductUnit"
            }
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      CreateProductRequest: {
        type: "object",
        required: ["internalCode", "commercialName", "type", "categoryId", "baseUnitId", "salePrice"],
        properties: {
          internalCode: {
            type: "string",
            minLength: 2,
            maxLength: 40,
            example: "MED-001"
          },
          barcode: {
            type: "string",
            nullable: true,
            example: "7790000000012"
          },
          commercialName: {
            type: "string",
            minLength: 2,
            maxLength: 160,
            example: "Paracetamol 500 mg"
          },
          genericName: {
            type: "string",
            nullable: true,
            example: "Paracetamol"
          },
          description: {
            type: "string",
            nullable: true
          },
          type: {
            $ref: "#/components/schemas/ProductType"
          },
          categoryId: {
            type: "string"
          },
          baseUnitId: {
            type: "string"
          },
          laboratoryName: {
            type: "string",
            nullable: true
          },
          sanitaryRegistration: {
            type: "string",
            nullable: true
          },
          isMedicine: {
            type: "boolean",
            default: false
          },
          isOverTheCounter: {
            type: "boolean",
            default: false
          },
          requiresPrescription: {
            type: "boolean",
            default: false
          },
          isInventoryTracked: {
            type: "boolean",
            default: true
          },
          requiresBatch: {
            type: "boolean",
            default: true
          },
          requiresExpiration: {
            type: "boolean",
            default: true
          },
          minimumStock: {
            type: "number",
            minimum: 0,
            default: 0
          },
          salePrice: {
            type: "number",
            minimum: 0,
            example: 1.5
          }
        }
      },
      UpdateProductRequest: {
        allOf: [
          {
            $ref: "#/components/schemas/CreateProductRequest"
          },
          {
            type: "object",
            properties: {
              status: {
                $ref: "#/components/schemas/ProductStatus"
              }
            }
          }
        ],
        description: "All fields are optional for PATCH requests."
      },
      UpsertProductUnitRequest: {
        type: "object",
        required: ["unitId", "conversionFactor"],
        properties: {
          unitId: {
            type: "string"
          },
          conversionFactor: {
            type: "number",
            minimum: 0.0001,
            example: 10
          }
        }
      },
      UpdateProductUnitsRequest: {
        type: "object",
        required: ["units"],
        properties: {
          units: {
            type: "array",
            minItems: 1,
            items: {
              $ref: "#/components/schemas/UpsertProductUnitRequest"
            }
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
