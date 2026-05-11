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
      name: "Suppliers",
      description: "Supplier directory management for purchase workflows"
    },
    {
      name: "Purchases",
      description: "Purchase draft, receipt, and cancellation workflows for superadmin and admin users. Seller users do not manage purchases in this PRD."
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
    "/suppliers": {
      get: {
        tags: ["Suppliers"],
        summary: "List suppliers",
        description: "Available to superadmin and admin users. Seller users receive 403.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/SupplierStatusQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated suppliers ordered by business name",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuppliersListResponse"
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
          }
        }
      },
      post: {
        tags: ["Suppliers"],
        summary: "Create a supplier",
        description: "Available to superadmin and admin users. Seller users receive 403. Duplicate NIT values return SUPPLIER_NIT_IN_USE.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateSupplierRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Supplier created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Supplier"
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
            $ref: "#/components/responses/SupplierNitConflict"
          }
        }
      }
    },
    "/suppliers/{id}": {
      get: {
        tags: ["Suppliers"],
        summary: "Get a supplier",
        description: "Available to superadmin and admin users. Seller users receive 403.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/SupplierId" }],
        responses: {
          "200": {
            description: "Supplier detail",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Supplier"
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
            $ref: "#/components/responses/SupplierNotFound"
          }
        }
      },
      patch: {
        tags: ["Suppliers"],
        summary: "Update a supplier",
        description: "Available to superadmin and admin users. Seller users receive 403. Duplicate NIT values return SUPPLIER_NIT_IN_USE.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/SupplierId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateSupplierRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Supplier updated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Supplier"
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
            $ref: "#/components/responses/SupplierNotFound"
          },
          "409": {
            $ref: "#/components/responses/SupplierNitConflict"
          }
        }
      }
    },
    "/purchases": {
      get: {
        tags: ["Purchases"],
        summary: "List purchases",
        description: "Available to superadmin and admin users. Seller users receive 403 and do not manage purchases in this PRD.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/PurchaseStatusQuery" },
          { $ref: "#/components/parameters/PurchaseSupplierIdQuery" },
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated purchases ordered by purchase date",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PurchasesListResponse"
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
          }
        }
      },
      post: {
        tags: ["Purchases"],
        summary: "Create a draft purchase",
        description: "Available to superadmin and admin users. Creates a draft purchase with items and audit metadata. Seller users receive 403.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreatePurchaseRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Draft purchase created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Purchase"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/PurchaseBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "409": {
            $ref: "#/components/responses/PurchaseConflict"
          }
        }
      }
    },
    "/purchases/{id}": {
      get: {
        tags: ["Purchases"],
        summary: "Get a purchase",
        description: "Available to superadmin and admin users. Seller users receive 403.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PurchaseId" }],
        responses: {
          "200": {
            description: "Purchase detail with items, supplier, and users",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Purchase"
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
            $ref: "#/components/responses/PurchaseNotFound"
          }
        }
      },
      patch: {
        tags: ["Purchases"],
        summary: "Update a draft purchase",
        description: "Available to superadmin and admin users. Only draft purchases can be updated. Seller users receive 403.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PurchaseId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdatePurchaseRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Purchase updated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Purchase"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/PurchaseBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/PurchaseNotFound"
          },
          "409": {
            $ref: "#/components/responses/PurchaseConflict"
          }
        }
      }
    },
    "/purchases/{id}/receive": {
      post: {
        tags: ["Purchases"],
        summary: "Receive a draft purchase",
        description: "Available to superadmin and admin users. Receipt creates inventory batches and movements for tracked items. Seller users receive 403.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PurchaseId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ReceivePurchaseRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Purchase received",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Purchase"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/PurchaseBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/PurchaseNotFound"
          },
          "409": {
            $ref: "#/components/responses/PurchaseConflict"
          }
        }
      }
    },
    "/purchases/{id}/cancel": {
      post: {
        tags: ["Purchases"],
        summary: "Cancel a purchase",
        description: "Available to superadmin and admin users. Cancelling a received purchase reverses purchase receipt inventory layers when they are still reversible. Seller users receive 403.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PurchaseId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CancelPurchaseRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Purchase cancelled",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Purchase"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/PurchaseBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "404": {
            $ref: "#/components/responses/PurchaseNotFound"
          },
          "409": {
            $ref: "#/components/responses/PurchaseConflict"
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
      SupplierId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string"
        },
        description: "Supplier identifier"
      },
      PurchaseId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string"
        },
        description: "Purchase identifier"
      },
      SearchQuery: {
        name: "search",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Search text"
      },
      SupplierStatusQuery: {
        name: "status",
        in: "query",
        required: false,
        schema: {
          $ref: "#/components/schemas/SupplierStatus"
        },
        description: "Filter suppliers by status"
      },
      PurchaseStatusQuery: {
        name: "status",
        in: "query",
        required: false,
        schema: {
          $ref: "#/components/schemas/PurchaseStatus"
        },
        description: "Filter purchases by status"
      },
      PurchaseSupplierIdQuery: {
        name: "supplierId",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter purchases by supplier"
      },
      FromDateQuery: {
        name: "fromDate",
        in: "query",
        required: false,
        schema: {
          type: "string",
          format: "date",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$"
        },
        description: "Inclusive purchase date lower bound in YYYY-MM-DD format"
      },
      ToDateQuery: {
        name: "toDate",
        in: "query",
        required: false,
        schema: {
          type: "string",
          format: "date",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$"
        },
        description: "Inclusive purchase date upper bound in YYYY-MM-DD format"
      },
      PageQuery: {
        name: "page",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1
        },
        description: "Page number"
      },
      PageSizeQuery: {
        name: "pageSize",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20
        },
        description: "Items per page"
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
      SupplierNotFound: {
        description: "Supplier was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Supplier was not found.",
              code: "SUPPLIER_NOT_FOUND"
            }
          }
        }
      },
      SupplierNitConflict: {
        description: "Supplier NIT is already in use",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Supplier NIT is already in use.",
              code: "SUPPLIER_NIT_IN_USE"
            }
          }
        }
      },
      PurchaseNotFound: {
        description: "Purchase was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Purchase was not found.",
              code: "PURCHASE_NOT_FOUND"
            }
          }
        }
      },
      PurchaseBadRequest: {
        description: "Invalid purchase payload or purchase business rule violation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              supplierNotFound: {
                value: {
                  message: "Supplier does not exist.",
                  code: "SUPPLIER_NOT_FOUND"
                }
              },
              supplierNotActive: {
                value: {
                  message: "Supplier must be active.",
                  code: "SUPPLIER_NOT_ACTIVE"
                }
              },
              productNotFound: {
                value: {
                  message: "Product does not exist.",
                  code: "PRODUCT_NOT_FOUND"
                }
              },
              productNotActive: {
                value: {
                  message: "Product must be active.",
                  code: "PRODUCT_NOT_ACTIVE"
                }
              },
              productUnitNotConfigured: {
                value: {
                  message: "Unit is not configured for the product.",
                  code: "PRODUCT_UNIT_NOT_CONFIGURED"
                }
              },
              authenticatedUserNotFound: {
                value: {
                  message: "Authenticated user was not found.",
                  code: "AUTHENTICATED_USER_NOT_FOUND"
                }
              },
              purchaseItemsRequired: {
                value: {
                  message: "Purchase must contain at least one item.",
                  code: "PURCHASE_ITEMS_REQUIRED"
                }
              },
              purchaseBatchRequired: {
                value: {
                  message: "Inventory tracked purchase items require a batch number.",
                  code: "PURCHASE_BATCH_REQUIRED"
                }
              },
              purchaseExpirationRequired: {
                value: {
                  message: "Inventory tracked purchase items require an expiration date.",
                  code: "PURCHASE_EXPIRATION_REQUIRED"
                }
              },
              purchaseExpirationExpired: {
                value: {
                  message: "Purchase item expiration date cannot be in the past.",
                  code: "PURCHASE_EXPIRATION_EXPIRED"
                }
              },
              cancelReasonRequired: {
                value: {
                  message: "Cancel reason is required.",
                  code: "PURCHASE_CANCEL_REASON_REQUIRED"
                }
              }
            }
          }
        }
      },
      PurchaseConflict: {
        description: "Purchase domain conflict or invalid state transition",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              purchaseNotDraft: {
                value: {
                  message: "Only draft purchases can be updated.",
                  code: "PURCHASE_NOT_DRAFT"
                }
              },
              purchaseNotDraftForReceipt: {
                value: {
                  message: "Only draft purchases can be received.",
                  code: "PURCHASE_NOT_DRAFT"
                }
              },
              duplicatedPurchaseItem: {
                value: {
                  message: "Purchase items cannot contain equivalent duplicates.",
                  code: "DUPLICATED_PURCHASE_ITEM"
                }
              },
              alreadyCancelled: {
                value: {
                  message: "Purchase is already cancelled.",
                  code: "PURCHASE_ALREADY_CANCELLED"
                }
              },
              invalidStatus: {
                value: {
                  message: "Purchase cannot be cancelled from its current status.",
                  code: "PURCHASE_STATUS_INVALID"
                }
              },
              inventoryLayerMismatch: {
                value: {
                  message: "Purchase inventory layers do not match the purchase items.",
                  code: "PURCHASE_INVENTORY_LAYER_MISMATCH"
                }
              },
              inventoryLayerNotReversible: {
                value: {
                  message: "Purchase inventory layers were already consumed or cancelled.",
                  code: "PURCHASE_INVENTORY_LAYER_NOT_REVERSIBLE"
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
      SupplierStatus: {
        type: "string",
        enum: ["active", "inactive"]
      },
      PaginationMeta: {
        type: "object",
        required: ["page", "pageSize", "total", "totalPages"],
        properties: {
          page: {
            type: "integer",
            minimum: 1,
            example: 1
          },
          pageSize: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            example: 20
          },
          total: {
            type: "integer",
            minimum: 0,
            example: 42
          },
          totalPages: {
            type: "integer",
            minimum: 0,
            example: 3
          }
        }
      },
      Supplier: {
        type: "object",
        required: ["id", "businessName", "status", "createdAt", "updatedAt"],
        properties: {
          id: {
            type: "string"
          },
          businessName: {
            type: "string",
            example: "Distribuidora Farmaceutica Andina"
          },
          nit: {
            type: "string",
            example: "123456789"
          },
          phone: {
            type: "string",
            example: "22222222"
          },
          address: {
            type: "string",
            example: "Av. Principal 123"
          },
          contactName: {
            type: "string",
            example: "Ana Perez"
          },
          status: {
            $ref: "#/components/schemas/SupplierStatus"
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
      SuppliersListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Supplier"
            }
          },
          pagination: {
            $ref: "#/components/schemas/PaginationMeta"
          }
        }
      },
      CreateSupplierRequest: {
        type: "object",
        required: ["businessName"],
        properties: {
          businessName: {
            type: "string",
            minLength: 2,
            maxLength: 160,
            example: "Distribuidora Farmaceutica Andina"
          },
          nit: {
            type: "string",
            maxLength: 40,
            nullable: true,
            example: "123456789"
          },
          phone: {
            type: "string",
            maxLength: 40,
            nullable: true,
            example: "22222222"
          },
          address: {
            type: "string",
            maxLength: 240,
            nullable: true,
            example: "Av. Principal 123"
          },
          contactName: {
            type: "string",
            maxLength: 120,
            nullable: true,
            example: "Ana Perez"
          },
          status: {
            allOf: [{ $ref: "#/components/schemas/SupplierStatus" }],
            default: "active"
          }
        }
      },
      UpdateSupplierRequest: {
        type: "object",
        description: "All fields are optional for PATCH requests.",
        properties: {
          businessName: {
            type: "string",
            minLength: 2,
            maxLength: 160,
            example: "Distribuidora Farmaceutica Andina"
          },
          nit: {
            type: "string",
            maxLength: 40,
            nullable: true,
            example: "123456789"
          },
          phone: {
            type: "string",
            maxLength: 40,
            nullable: true,
            example: "22222222"
          },
          address: {
            type: "string",
            maxLength: 240,
            nullable: true,
            example: "Av. Principal 123"
          },
          contactName: {
            type: "string",
            maxLength: 120,
            nullable: true,
            example: "Ana Perez"
          },
          status: {
            $ref: "#/components/schemas/SupplierStatus"
          }
        }
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
      SupplierSummary: {
        type: "object",
        required: ["id", "businessName", "status"],
        properties: {
          id: {
            type: "string"
          },
          businessName: {
            type: "string",
            example: "Distribuidora Farmaceutica Andina"
          },
          nit: {
            type: "string",
            example: "123456789"
          },
          status: {
            $ref: "#/components/schemas/SupplierStatus"
          }
        }
      },
      PurchaseStatus: {
        type: "string",
        enum: ["draft", "received", "cancelled"]
      },
      PurchaseUserSummary: {
        type: "object",
        required: ["id", "fullName", "email"],
        properties: {
          id: {
            type: "string"
          },
          fullName: {
            type: "string",
            example: "Admin Principal"
          },
          email: {
            type: "string",
            format: "email",
            example: "admin@admin.com"
          }
        }
      },
      PurchaseItem: {
        type: "object",
        required: [
          "id",
          "purchaseId",
          "productId",
          "productName",
          "unitId",
          "unitName",
          "quantity",
          "unitCost",
          "conversionFactor",
          "baseQuantity",
          "baseUnitCost",
          "lineTotal",
          "isInventoryTracked",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: {
            type: "string"
          },
          purchaseId: {
            type: "string"
          },
          productId: {
            type: "string"
          },
          productName: {
            type: "string",
            example: "Paracetamol 500 mg"
          },
          unitId: {
            type: "string"
          },
          unitName: {
            type: "string",
            example: "Caja"
          },
          quantity: {
            type: "number",
            minimum: 0,
            example: 10
          },
          unitCost: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 12.5
          },
          conversionFactor: {
            type: "number",
            minimum: 0.0001,
            multipleOf: 0.0001,
            example: 10
          },
          baseQuantity: {
            type: "number",
            minimum: 0,
            example: 100
          },
          baseUnitCost: {
            type: "number",
            minimum: 0,
            example: 1.25
          },
          lineTotal: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 125
          },
          isInventoryTracked: {
            type: "boolean"
          },
          batchNumber: {
            type: "string",
            example: "L-2026-001"
          },
          expirationDate: {
            type: "string",
            format: "date",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2027-05-11"
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
      PurchaseSummary: {
        type: "object",
        required: [
          "id",
          "supplierId",
          "supplier",
          "purchaseDate",
          "status",
          "totalAmount",
          "createdByUserId",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: {
            type: "string"
          },
          supplierId: {
            type: "string"
          },
          supplier: {
            $ref: "#/components/schemas/SupplierSummary"
          },
          purchaseDate: {
            type: "string",
            format: "date",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2026-05-11"
          },
          status: {
            $ref: "#/components/schemas/PurchaseStatus"
          },
          totalAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 125
          },
          createdByUserId: {
            type: "string"
          },
          receivedByUserId: {
            type: "string"
          },
          receivedAt: {
            type: "string",
            format: "date-time"
          },
          cancelledAt: {
            type: "string",
            format: "date-time"
          },
          notes: {
            type: "string",
            example: "Compra inicial de reposicion"
          },
          receiveNotes: {
            type: "string",
            example: "Recepcion completa"
          },
          cancelReason: {
            type: "string",
            example: "Proveedor no entrego la mercaderia"
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
      Purchase: {
        allOf: [
          {
            $ref: "#/components/schemas/PurchaseSummary"
          },
          {
            type: "object",
            required: ["createdByUser", "items"],
            properties: {
              createdByUser: {
                $ref: "#/components/schemas/PurchaseUserSummary"
              },
              receivedByUser: {
                $ref: "#/components/schemas/PurchaseUserSummary"
              },
              items: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/PurchaseItem"
                }
              }
            }
          }
        ]
      },
      PurchaseItemInput: {
        type: "object",
        required: ["productId", "unitId", "quantity", "unitCost"],
        properties: {
          productId: {
            type: "string"
          },
          unitId: {
            type: "string"
          },
          quantity: {
            type: "number",
            minimum: 0.0001,
            multipleOf: 0.0001,
            example: 10
          },
          unitCost: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 12.5
          },
          batchNumber: {
            type: "string",
            maxLength: 80,
            example: "L-2026-001"
          },
          expirationDate: {
            type: "string",
            format: "date",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2027-05-11"
          }
        }
      },
      CreatePurchaseRequest: {
        type: "object",
        required: ["supplierId", "purchaseDate", "items"],
        properties: {
          supplierId: {
            type: "string"
          },
          purchaseDate: {
            type: "string",
            format: "date",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2026-05-11"
          },
          notes: {
            type: "string",
            example: "Compra inicial de reposicion"
          },
          items: {
            type: "array",
            minItems: 1,
            items: {
              $ref: "#/components/schemas/PurchaseItemInput"
            }
          }
        }
      },
      UpdatePurchaseRequest: {
        allOf: [
          {
            $ref: "#/components/schemas/CreatePurchaseRequest"
          }
        ],
        description: "Same payload as create. Only draft purchases can be updated."
      },
      ReceivePurchaseRequest: {
        type: "object",
        properties: {
          receiveNotes: {
            type: "string",
            example: "Recepcion completa"
          }
        }
      },
      CancelPurchaseRequest: {
        type: "object",
        required: ["cancelReason"],
        properties: {
          cancelReason: {
            type: "string",
            minLength: 3,
            maxLength: 240,
            example: "Proveedor no entrego la mercaderia"
          }
        }
      },
      PurchasesListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PurchaseSummary"
            }
          },
          pagination: {
            $ref: "#/components/schemas/PaginationMeta"
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
