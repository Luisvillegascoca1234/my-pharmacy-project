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
  "x-contract-parity-review": {
    flow: "sales-cash-pos-v1-and-administrative-closure-v1",
    implementedRoutes: [
      "GET /cash-sessions",
      "POST /cash-sessions/open",
      "GET /cash-sessions/current",
      "POST /cash-sessions/{id}/close",
      "GET /pending-carts",
      "POST /pending-carts",
      "PATCH /pending-carts/{id}",
      "POST /pending-carts/{id}/discard",
      "POST /pending-carts/{id}/convert",
      "GET /pos/products",
      "GET /sales",
      "POST /sales",
      "GET /sales/{id}",
      "POST /sales/{id}/cancel",
      "GET /billing/prepared-invoices",
      "POST /billing/prepared-invoices",
      "GET /billing/prepared-invoices/{id}",
      "POST /billing/prepared-invoices/{id}/cancel",
      "GET /billing/invoiceable-sales",
      "GET /returns/returnable-sales",
      "GET /returns/sale-returns",
      "POST /returns/sale-returns",
      "GET /returns/sale-returns/{id}",
      "GET /audit/logs",
      "GET /reports/daily-sales",
      "GET /reports/inventory-valuation",
      "GET /reports/expiring-products",
      "GET /exports/sales.csv",
      "GET /exports/inventory-movements.csv"
    ],
    plannedRoutes: [],
    sharedContracts: [
      "Cash sessions and supervision envelopes",
      "POS product search",
      "Confirmed cash sales and receipts",
      "Cancelable sale envelopes",
      "Pending cart lifecycle envelopes",
      "Prepared invoice internal envelopes",
      "Total sale return envelopes",
      "Queryable audit log envelopes",
      "Operational report envelopes",
      "CSV export query and row contracts"
    ],
    deferredRouteParity: [
      "Queryable audit logs and visual operational reports are executable V1 contracts.",
      "Returns endpoints are executable administrative total return workflows and remain separate from POS sale cancellation.",
      "Prepared invoices are executable internal pharmacy fiscal preparation records and do not promise real SIAT integration, fiscal QR generation, XML, CUF, CUFD, or tax authority submission.",
      "CSV export downloads must create audit logs; visual report queries must not create audit logs."
    ],
    generationGuardrails: [
      "Run pnpm --filter @pharmacy-pos/shared typecheck after changing shared contracts.",
      "Run pnpm --filter @pharmacy-pos/backend typecheck after changing OpenAPI or Prisma-backed contracts.",
      "Run pnpm --filter @pharmacy-pos/backend prisma:generate after Prisma schema changes before backend typecheck.",
      "Advanced BI, CSV per sold item, visual query auditing, and UI consumption work remain outside this V1 scope."
    ],
    documentedDomainErrorCodes: [
      "VALIDATION_ERROR",
      "ADMINISTRATIVE_REASON_INVALID",
      "PENDING_CART_EXPIRED",
      "PENDING_CART_ACCESS_FORBIDDEN",
      "PENDING_CART_STOCK_INSUFFICIENT",
      "SALE_NOT_CANCELABLE",
      "SALE_ALREADY_CANCELLED",
      "SALE_CASH_SESSION_CLOSED",
      "SALE_CASH_SESSION_REQUIRED",
      "SALE_STOCK_INSUFFICIENT",
      "SALE_PAYMENT_INSUFFICIENT",
      "SALE_NOT_FOUND",
      "CASH_SESSION_ALREADY_CLOSED",
      "CASH_SESSION_CLOSE_FORBIDDEN",
      "SALE_NOT_INVOICEABLE",
      "PREPARED_INVOICE_ACTIVE_EXISTS",
      "PREPARED_INVOICE_NOT_FOUND",
      "PREPARED_INVOICE_ALREADY_CANCELLED",
      "SALE_NOT_RETURNABLE",
      "SALE_PAYMENT_NOT_REFUNDABLE",
      "SALE_RETURN_CONFLICT",
      "SALE_RETURN_NOT_FOUND",
      "SALE_RETURN_REASON_INVALID",
      "UNSUPPORTED_TIMEZONE",
      "INVALID_REPORT_DATE_RANGE",
      "INVALID_EXPORT_DATE_RANGE",
      "FORBIDDEN"
    ],
    administrativeClosureV1Evidence: {
      roleMatrix: {
        billing: ["admin", "superadmin"],
        returns: ["admin", "superadmin"],
        audit: ["superadmin"],
        reports: ["admin", "superadmin"],
        exports: ["admin", "superadmin"]
      },
      billingPreparedInvoiceContract: {
        executableRoutes: [
          "GET /billing/invoiceable-sales",
          "GET /billing/prepared-invoices",
          "POST /billing/prepared-invoices",
          "GET /billing/prepared-invoices/{id}",
          "POST /billing/prepared-invoices/{id}/cancel"
        ],
        statusValues: ["prepared", "cancelled"],
        expectedErrors: [
          "SALE_NOT_FOUND",
          "SALE_NOT_INVOICEABLE",
          "PREPARED_INVOICE_ACTIVE_EXISTS",
          "PREPARED_INVOICE_NOT_FOUND",
          "PREPARED_INVOICE_ALREADY_CANCELLED",
          "ADMINISTRATIVE_REASON_INVALID",
          "FORBIDDEN"
        ],
        siatBoundary:
          "Prepared invoices are internal administrative records only; V1 does not issue SIAT documents, fiscal QR, XML, CUF, CUFD, tax authority submissions, or fiscal annulments."
      },
      totalSaleReturnContract: {
        executableRoutes: [
          "GET /returns/returnable-sales",
          "GET /returns/sale-returns",
          "POST /returns/sale-returns",
          "GET /returns/sale-returns/{id}"
        ],
        resultingStateValues: {
          sale: "returned",
          payment: "refunded",
          inventoryMovement: "sale_returned"
        },
        expectedErrors: [
          "SALE_NOT_FOUND",
          "SALE_NOT_RETURNABLE",
          "SALE_PAYMENT_NOT_REFUNDABLE",
          "SALE_RETURN_CONFLICT",
          "SALE_RETURN_NOT_FOUND",
          "SALE_RETURN_REASON_INVALID",
          "FORBIDDEN"
        ],
        boundary:
          "Returns are total administrative returns after sale closure; V1 does not support partial returns, sold-item CSV files, or direct mutation of closed cash sessions."
      },
      reportsAndExportsAuditPolicy: {
        visualReports: {
          routes: [
            "GET /reports/daily-sales",
            "GET /reports/inventory-valuation",
            "GET /reports/expiring-products"
          ],
          responseField: "audited=false",
          auditSideEffect: false,
          expectedErrors: ["UNSUPPORTED_TIMEZONE", "INVALID_REPORT_DATE_RANGE", "FORBIDDEN"]
        },
        csvDownloads: {
          routes: ["GET /exports/sales.csv", "GET /exports/inventory-movements.csv"],
          contentType: "text/csv; charset=utf-8",
          separator: ";",
          auditSideEffect: true,
          auditAction: "CSV_EXPORT_DOWNLOADED",
          expectedErrors: ["INVALID_EXPORT_DATE_RANGE", "FORBIDDEN"]
        }
      },
      explicitV1Limitations: [
        "No real SIAT integration.",
        "No fiscal QR.",
        "No partial returns.",
        "No advanced BI or data warehouse.",
        "No CSV file grouped by sold item."
      ],
      reconciliationDebt: []
    }
  },
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
      description: "Supplier directory management for purchase workflows. Seller users do not manage suppliers in this PRD."
    },
    {
      name: "Purchases",
      description: "Purchase draft, receipt, and cancellation workflows for superadmin and admin users. Seller users do not manage purchases in this PRD."
    },
    {
      name: "Cash Sessions",
      description: "Cash register session opening, current session lookup, and closing workflows for seller, admin, and superadmin users."
    },
    {
      name: "POS",
      description: "Point of sale product search for seller, admin, and superadmin users."
    },
    {
      name: "Pending Carts",
      description: "Pending cart lifecycle for paused point-of-sale attention without stock reservation or frozen prices."
    },
    {
      name: "Sales",
      description: "Confirmed cash sale workflows for seller, admin, and superadmin users."
    },
    {
      name: "Billing",
      description: "Executable internal prepared invoice workflows for admin and superadmin users. This V1 scope does not integrate with SIAT, fiscal QR generation, XML, CUF, CUFD, or tax authority submission."
    },
    {
      name: "Returns",
      description: "Executable administrative total sale return workflows for admin and superadmin users with inventory reversal, payment refund state, and audit traceability. POS sale cancellation remains a separate workflow."
    },
    {
      name: "Audit",
      description: "Executable queryable audit log review for superadmin users."
    },
    {
      name: "Reports",
      description: "Executable visual operational reports for admin and superadmin users. Visual report queries return audited=false and do not create audit logs."
    },
    {
      name: "Exports",
      description: "Executable CSV downloads for admin and superadmin users. CSV downloads generate audit logs."
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
    "/cash-sessions": {
      get: {
        tags: ["Cash Sessions"],
        summary: "List cash sessions for supervision",
        description: "Requires authentication. Seller users receive only their own cash sessions. Admin and superadmin users can supervise all cash sessions with operational filters.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CashSessionStatusQuery" },
          { $ref: "#/components/parameters/OpenedByUserIdQuery" },
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated cash sessions with supervision close eligibility",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CashSessionsListResponse"
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
      }
    },
    "/cash-sessions/open": {
      post: {
        tags: ["Cash Sessions"],
        summary: "Open a cash session",
        description: "Requires authentication. Available to seller, admin, and superadmin users. A user can only have one open cash session.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/OpenCashSessionRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Cash session opened",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CashSession"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/CashSessionBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "409": {
            $ref: "#/components/responses/CashSessionConflict"
          }
        }
      }
    },
    "/cash-sessions/current": {
      get: {
        tags: ["Cash Sessions"],
        summary: "Get the current cash session",
        description: "Requires authentication. Available to seller, admin, and superadmin users. Returns an empty current-session envelope when the authenticated user has no open cash session.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current cash session state for the authenticated user",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CurrentCashSession"
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
    "/cash-sessions/{id}/close": {
      post: {
        tags: ["Cash Sessions"],
        summary: "Close a cash session",
        description: "Requires authentication. Seller users can close their own cash session. Admin and superadmin users can close their own cash session or another user's open cash session.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CashSessionId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CloseCashSessionRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Cash session closed with expected and difference amounts calculated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CashSession"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/CashSessionBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/CashSessionCloseForbidden"
          },
          "404": {
            $ref: "#/components/responses/CashSessionNotFound"
          },
          "409": {
            $ref: "#/components/responses/CashSessionConflict"
          }
        }
      }
    },
    "/pos/products": {
      get: {
        tags: ["POS"],
        summary: "Search saleable POS products",
        description: "Requires authentication. Available to seller, admin, and superadmin users. Returns active products with saleable FEFO stock and the next expiration date when available.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/PosProductCodeQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated saleable POS products ordered by product name",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PosProductsListResponse"
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
      }
    },
    "/pending-carts": {
      get: {
        tags: ["Pending Carts"],
        summary: "List pending carts",
        description: "Requires authentication. Seller users receive only their own pending carts. Admin and superadmin users can supervise all pending carts with filters. Pending carts do not reserve stock or freeze prices.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PendingCartStatusQuery" },
          { $ref: "#/components/parameters/SellerUserIdQuery" },
          { $ref: "#/components/parameters/IncludeAllQuery" },
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated pending carts with current revalidation data",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PendingCartsListResponse"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/PendingCartBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/PendingCartForbidden"
          }
        }
      },
      post: {
        tags: ["Pending Carts"],
        summary: "Save a pending cart",
        description: "Requires authentication. Creates a paused point-of-sale cart for the authenticated user without affecting inventory or cash.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SavePendingCartRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Pending cart saved",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PendingCart"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/PendingCartBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/PendingCartForbidden"
          }
        }
      }
    },
    "/pending-carts/{id}": {
      patch: {
        tags: ["Pending Carts"],
        summary: "Edit an active pending cart",
        description: "Requires authentication. Seller users can edit only their own active pending carts. Expired, discarded, or converted carts cannot be edited.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PendingCartId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SavePendingCartRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Pending cart updated with current revalidation data",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PendingCart"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/PendingCartBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/PendingCartForbidden"
          },
          "404": {
            $ref: "#/components/responses/PendingCartNotFound"
          },
          "409": {
            $ref: "#/components/responses/PendingCartConflict"
          }
        }
      }
    },
    "/pending-carts/{id}/discard": {
      post: {
        tags: ["Pending Carts"],
        summary: "Discard a pending cart",
        description: "Requires authentication. Seller users can discard their own active or expired pending carts. Admin and superadmin users can discard visible pending carts for supervision.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PendingCartId" }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DiscardPendingCartRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Pending cart discarded",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PendingCart"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/PendingCartBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/PendingCartForbidden"
          },
          "404": {
            $ref: "#/components/responses/PendingCartNotFound"
          },
          "409": {
            $ref: "#/components/responses/PendingCartConflict"
          }
        }
      }
    },
    "/pending-carts/{id}/convert": {
      post: {
        tags: ["Pending Carts"],
        summary: "Convert a pending cart to a sale",
        description: "Requires authentication. Converts the authenticated user's active pending cart into a confirmed cash sale using current prices and saleable FEFO stock. The pending cart remains active if conversion is rejected.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PendingCartId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ConvertPendingCartRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Pending cart converted and linked to the confirmed sale",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PendingCart"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/PendingCartBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/PendingCartForbidden"
          },
          "404": {
            $ref: "#/components/responses/PendingCartNotFound"
          },
          "409": {
            $ref: "#/components/responses/PendingCartConflict"
          }
        }
      }
    },
    "/sales": {
      get: {
        tags: ["Sales"],
        summary: "List sales for operational supervision",
        description: "Requires authentication. Seller users receive only their own sales. Admin and superadmin users can supervise all sellers with date, seller, cash session, status, and search filters.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/SaleStatusQuery" },
          { $ref: "#/components/parameters/SellerUserIdQuery" },
          { $ref: "#/components/parameters/CashSessionIdQuery" },
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated sale summaries with cancellation eligibility",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SalesListResponse"
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
            $ref: "#/components/responses/SaleForbidden"
          }
        }
      },
      post: {
        tags: ["Sales"],
        summary: "Create a confirmed cash sale",
        description: "Requires authentication. Available to seller, admin, and superadmin users. The sale uses the authenticated user's open cash session, registers a cash payment, and discounts inventory by FEFO.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateSaleRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Confirmed sale with payment, FEFO consumption, totals, margin, and internal receipt",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Sale"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/SaleBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/SaleForbidden"
          },
          "409": {
            $ref: "#/components/responses/SaleConflict"
          }
        }
      }
    },
    "/sales/{id}": {
      get: {
        tags: ["Sales"],
        summary: "Get a confirmed sale",
        description: "Requires authentication. Seller users can read only their own sales. Admin and superadmin users can read any sale.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/SaleId" }],
        responses: {
          "200": {
            description: "Cancelable sale detail with payment, FEFO consumption, totals, margin, and internal receipt",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CancelableSale"
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/SaleForbidden"
          },
          "404": {
            $ref: "#/components/responses/SaleNotFound"
          }
        }
      }
    },
    "/sales/{id}/cancel": {
      post: {
        tags: ["Sales"],
        summary: "Cancel a confirmed sale",
        description: "Requires authentication. Seller users can cancel only their own current-day sales while the cash session remains open. Admin and superadmin users can cancel any confirmed sale with an open cash session.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/SaleId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CancelSaleRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Sale cancelled with reverted payment and restored inventory movements",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CancelableSale"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/SaleBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/SaleForbidden"
          },
          "404": {
            $ref: "#/components/responses/SaleNotFound"
          },
          "409": {
            $ref: "#/components/responses/SaleConflict"
          }
        }
      }
    },
    "/billing/invoiceable-sales": {
      get: {
        tags: ["Billing"],
        summary: "List sales eligible for internal prepared invoices",
        description: "Executable V1 endpoint for admin and superadmin users. Returns sales with invoice eligibility flags before prepared invoice creation. It does not call SIAT, generate fiscal QR/XML, or issue tax documents.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/SellerUserIdQuery" },
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated sales with prepared invoice eligibility",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/InvoiceableSalesListResponse"
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
            $ref: "#/components/responses/AdministrativeForbidden"
          }
        }
      }
    },
    "/billing/prepared-invoices": {
      get: {
        tags: ["Billing"],
        summary: "List internal prepared invoices",
        description: "Executable V1 endpoint for admin and superadmin users. Prepared invoices are internal records with stable correlatives and no real SIAT submission, fiscal QR, XML, CUF, or CUFD.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/PreparedInvoiceStatusQuery" },
          { $ref: "#/components/parameters/SaleIdQuery" },
          { $ref: "#/components/parameters/CorrelativeCodeQuery" },
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated prepared invoices",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PreparedInvoicesListResponse"
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
            $ref: "#/components/responses/AdministrativeForbidden"
          }
        }
      },
      post: {
        tags: ["Billing"],
        summary: "Prepare an internal invoice from an eligible sale",
        description: "Executable V1 endpoint for admin and superadmin users. Creates an internal prepared invoice only; real SIAT integration, fiscal QR/XML generation, CUF, CUFD, and tax authority issuance are out of scope.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PrepareInvoiceFromSaleRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Prepared invoice created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PreparedInvoice"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/AdministrativeBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
          },
          "404": {
            $ref: "#/components/responses/PreparedInvoiceSaleNotFound"
          },
          "409": {
            $ref: "#/components/responses/PreparedInvoiceConflict"
          }
        }
      }
    },
    "/billing/prepared-invoices/{id}": {
      get: {
        tags: ["Billing"],
        summary: "Get an internal prepared invoice",
        description: "Executable V1 endpoint for admin and superadmin users. Returns the internal prepared invoice detail and line snapshot without SIAT, fiscal QR, XML, CUF, or CUFD data.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PreparedInvoiceId" }],
        responses: {
          "200": {
            description: "Prepared invoice detail with items",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PreparedInvoice"
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
          },
          "404": {
            $ref: "#/components/responses/PreparedInvoiceNotFound"
          }
        }
      }
    },
    "/billing/prepared-invoices/{id}/cancel": {
      post: {
        tags: ["Billing"],
        summary: "Cancel an internal prepared invoice",
        description: "Executable V1 endpoint for admin and superadmin users. Cancellation is internal, records the administrative reason, and does not send SIAT annulment messages.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PreparedInvoiceId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CancelPreparedInvoiceRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Prepared invoice cancelled",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PreparedInvoice"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/AdministrativeBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
          },
          "404": {
            $ref: "#/components/responses/PreparedInvoiceNotFound"
          },
          "409": {
            $ref: "#/components/responses/PreparedInvoiceConflict"
          }
        }
      }
    },
    "/returns/returnable-sales": {
      get: {
        tags: ["Returns"],
        summary: "List sales eligible for total return",
        description: "Executable V1 endpoint for admin and superadmin users. Lists confirmed sales with total return eligibility flags. Administrative returns restore inventory and refund payment state; POS sale cancellation is handled by the sales cancellation endpoint.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/SellerUserIdQuery" },
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated sales with total return eligibility",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReturnableSalesListResponse"
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
            $ref: "#/components/responses/AdministrativeForbidden"
          }
        }
      }
    },
    "/returns/sale-returns": {
      get: {
        tags: ["Returns"],
        summary: "List total sale returns",
        description: "Executable V1 endpoint for admin and superadmin users. Lists administrative total returns already registered through the returns workflow.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/SaleIdQuery" },
          { $ref: "#/components/parameters/ActorUserIdQuery" },
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated total sale returns",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SaleReturnsListResponse"
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
            $ref: "#/components/responses/AdministrativeForbidden"
          }
        }
      },
      post: {
        tags: ["Returns"],
        summary: "Register a total sale return",
        description: "Executable V1 endpoint for admin and superadmin users. Registers one administrative total return for an eligible sale, restores the originally consumed lots, marks the payment as refunded, and writes audit traceability in one transaction. It does not perform partial returns or modify open cash sessions; POS sale cancellation remains separate.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateTotalSaleReturnRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Total sale return registered",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SaleReturn"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/SaleReturnBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
          },
          "404": {
            $ref: "#/components/responses/SaleReturnSaleNotFound"
          },
          "409": {
            $ref: "#/components/responses/SaleReturnConflict"
          }
        }
      }
    },
    "/returns/sale-returns/{id}": {
      get: {
        tags: ["Returns"],
        summary: "Get a total sale return",
        description: "Executable V1 endpoint for admin and superadmin users. Returns administrative total return detail with the item and lot snapshot restored during the transaction.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/SaleReturnId" }],
        responses: {
          "200": {
            description: "Total sale return detail with returned items",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SaleReturn"
                }
              }
            }
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
          },
          "404": {
            $ref: "#/components/responses/SaleReturnNotFound"
          }
        }
      }
    },
    "/audit/logs": {
      get: {
        tags: ["Audit"],
        summary: "List audit logs",
        description: "Executable V1 audit log query for superadmin users only. Includes administrative traceability metadata and paginated results.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/AuditActionQuery" },
          { $ref: "#/components/parameters/ActorUserIdQuery" },
          { $ref: "#/components/parameters/EntityTypeQuery" },
          { $ref: "#/components/parameters/EntityIdQuery" },
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/PageSizeQuery" }
        ],
        responses: {
          "200": {
            description: "Paginated audit logs",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuditLogsListResponse"
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
            $ref: "#/components/responses/SuperadminOnlyForbidden"
          }
        }
      }
    },
    "/reports/daily-sales": {
      get: {
        tags: ["Reports"],
        summary: "Get daily sales report",
        description: "Executable V1 visual report for admin and superadmin users. Queries use America/La_Paz, return audited=false, and do not create audit logs.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequiredFromDateQuery" },
          { $ref: "#/components/parameters/RequiredToDateQuery" },
          { $ref: "#/components/parameters/TimezoneQuery" }
        ],
        responses: {
          "200": {
            description: "Daily sales report rows",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DailySalesReportResponse"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/ReportBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
          }
        }
      }
    },
    "/reports/inventory-valuation": {
      get: {
        tags: ["Reports"],
        summary: "Get inventory valuation report",
        description: "Executable V1 visual report for admin and superadmin users. Queries use America/La_Paz, return audited=false, and do not create audit logs.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/ProductIdQuery" },
          { $ref: "#/components/parameters/TimezoneQuery" }
        ],
        responses: {
          "200": {
            description: "Inventory valuation grouped by product and lot",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/InventoryValuationReportResponse"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/ReportBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
          }
        }
      }
    },
    "/reports/expiring-products": {
      get: {
        tags: ["Reports"],
        summary: "Get expiring products report",
        description: "Executable V1 visual report for admin and superadmin users. Queries use America/La_Paz, return audited=false, and do not create audit logs.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/DaysQuery" },
          { $ref: "#/components/parameters/SearchQuery" },
          { $ref: "#/components/parameters/ProductIdQuery" },
          { $ref: "#/components/parameters/TimezoneQuery" }
        ],
        responses: {
          "200": {
            description: "Products with lots close to expiration",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ExpiringProductsReportResponse"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/ReportBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
          }
        }
      }
    },
    "/exports/sales.csv": {
      get: {
        tags: ["Exports"],
        summary: "Download sales CSV export",
        description: "Executable V1 CSV download for admin and superadmin users. Downloads generate audit logs and return text/csv with semicolon-separated rows.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/CsvSeparatorQuery" }
        ],
        responses: {
          "200": {
            description: "Sales CSV download",
            headers: {
              "Content-Disposition": {
                schema: {
                  type: "string",
                  example: "attachment; filename=\"sales.csv\""
                }
              }
            },
            content: {
              "text/csv; charset=utf-8": {
                schema: {
                  type: "string",
                  example: "saleId;correlativeCode;status;sellerName;cashSessionCorrelativeCode;totalAmount;totalCost;totalMargin;confirmedAt;cancelledAt;returnedAt\r\nsale-id;V-000001;confirmed;Maria Perez;C-000001;25;18;7;2026-06-25T14:30:00.000Z;;\r\n"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/ExportBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
          }
        }
      }
    },
    "/exports/inventory-movements.csv": {
      get: {
        tags: ["Exports"],
        summary: "Download inventory movements CSV export",
        description: "Executable V1 CSV download for admin and superadmin users. Downloads generate audit logs and return text/csv with semicolon-separated rows.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/FromDateQuery" },
          { $ref: "#/components/parameters/ToDateQuery" },
          { $ref: "#/components/parameters/CsvSeparatorQuery" }
        ],
        responses: {
          "200": {
            description: "Inventory movements CSV download",
            headers: {
              "Content-Disposition": {
                schema: {
                  type: "string",
                  example: "attachment; filename=\"inventory-movements.csv\""
                }
              }
            },
            content: {
              "text/csv; charset=utf-8": {
                schema: {
                  type: "string",
                  example: "movementId;type;productId;internalCode;commercialName;batchId;batchNumber;quantityBase;unitCostBase;referenceType;referenceId;actorUserName;reason;createdAt\r\nmovement-id;sale_returned;product-id;MED-000001;Paracetamol 500 mg;batch-id;L-001;2;1.25;sale_return;return-id;Maria Perez;Total return;2026-06-25T14:30:00.000Z\r\n"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/ExportBadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/AdministrativeForbidden"
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
      CashSessionId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string"
        },
        description: "Cash session identifier"
      },
      PendingCartId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string"
        },
        description: "Pending cart identifier"
      },
      SaleId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string"
        },
        description: "Sale identifier"
      },
      PreparedInvoiceId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string"
        },
        description: "Prepared invoice identifier"
      },
      SaleReturnId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string"
        },
        description: "Sale return identifier"
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
      PosProductCodeQuery: {
        name: "code",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter saleable products by internal code or barcode"
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
      CashSessionStatusQuery: {
        name: "status",
        in: "query",
        required: false,
        schema: {
          $ref: "#/components/schemas/CashSessionStatus"
        },
        description: "Filter cash sessions by status"
      },
      OpenedByUserIdQuery: {
        name: "openedByUserId",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter cash sessions by opening user. Seller users are always scoped to their own user."
      },
      PendingCartStatusQuery: {
        name: "status",
        in: "query",
        required: false,
        schema: {
          $ref: "#/components/schemas/PendingCartStatus"
        },
        description: "Filter pending carts by lifecycle status"
      },
      IncludeAllQuery: {
        name: "includeAll",
        in: "query",
        required: false,
        schema: {
          type: "boolean"
        },
        description: "Request all visible pending carts. Only admin and superadmin users can list carts owned by other sellers."
      },
      SaleStatusQuery: {
        name: "status",
        in: "query",
        required: false,
        schema: {
          $ref: "#/components/schemas/SaleStatus"
        },
        description: "Filter sales by status"
      },
      SellerUserIdQuery: {
        name: "sellerUserId",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter sales by seller. Seller users are always scoped to their own user."
      },
      CashSessionIdQuery: {
        name: "cashSessionId",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter sales by cash session"
      },
      SaleIdQuery: {
        name: "saleId",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter by sale identifier"
      },
      CorrelativeCodeQuery: {
        name: "correlativeCode",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter by prepared invoice correlative code"
      },
      PreparedInvoiceStatusQuery: {
        name: "status",
        in: "query",
        required: false,
        schema: {
          $ref: "#/components/schemas/PreparedInvoiceStatus"
        },
        description: "Filter prepared invoices by internal status"
      },
      ActorUserIdQuery: {
        name: "actorUserId",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter by administrative actor user"
      },
      AuditActionQuery: {
        name: "action",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter audit logs by action"
      },
      EntityTypeQuery: {
        name: "entityType",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter audit logs by entity type"
      },
      EntityIdQuery: {
        name: "entityId",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter audit logs by entity identifier"
      },
      ProductIdQuery: {
        name: "productId",
        in: "query",
        required: false,
        schema: {
          type: "string"
        },
        description: "Filter report data by product identifier"
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
        description: "Inclusive date lower bound in YYYY-MM-DD format"
      },
      RequiredFromDateQuery: {
        name: "fromDate",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "date",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$"
        },
        description: "Inclusive report date lower bound in YYYY-MM-DD format"
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
        description: "Inclusive date upper bound in YYYY-MM-DD format"
      },
      RequiredToDateQuery: {
        name: "toDate",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "date",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$"
        },
        description: "Inclusive report date upper bound in YYYY-MM-DD format"
      },
      TimezoneQuery: {
        name: "timezone",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: ["America/La_Paz"],
          default: "America/La_Paz"
        },
        description: "Report timezone"
      },
      DaysQuery: {
        name: "days",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 365,
          default: 30
        },
        description: "Expiration horizon in days"
      },
      CsvSeparatorQuery: {
        name: "separator",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: [";"],
          default: ";"
        },
        description: "CSV separator"
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
      ReportBadRequest: {
        description: "Invalid report query or report business rule violation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              validationError: {
                value: {
                  message: "Invalid request payload.",
                  code: "VALIDATION_ERROR"
                }
              },
              unsupportedTimezone: {
                value: {
                  message: "Inventory valuation report only supports America/La_Paz timezone.",
                  code: "UNSUPPORTED_TIMEZONE"
                }
              },
              invalidDateRange: {
                value: {
                  message: "fromDate must be less than or equal to toDate.",
                  code: "INVALID_REPORT_DATE_RANGE"
                }
              }
            }
          }
        }
      },
      ExportBadRequest: {
        description: "Invalid CSV export query or export business rule violation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              validationError: {
                value: {
                  message: "Invalid request payload.",
                  code: "VALIDATION_ERROR"
                }
              },
              invalidDateRange: {
                value: {
                  message: "fromDate must be less than or equal to toDate.",
                  code: "INVALID_EXPORT_DATE_RANGE"
                }
              }
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
              purchaseDateInvalid: {
                value: {
                  message: "Purchase dates must use YYYY-MM-DD format.",
                  code: "PURCHASE_DATE_INVALID"
                }
              },
              purchaseQuantityInvalid: {
                value: {
                  message: "Purchase item quantity must be greater than zero with at most 4 decimal places.",
                  code: "PURCHASE_QUANTITY_INVALID"
                }
              },
              purchaseUnitCostInvalid: {
                value: {
                  message: "Purchase item unit cost must be zero or greater with at most 2 decimal places.",
                  code: "PURCHASE_UNIT_COST_INVALID"
                }
              },
              purchaseBatchNumberInvalid: {
                value: {
                  message: "Batch number must have at most 80 characters.",
                  code: "PURCHASE_BATCH_NUMBER_INVALID"
                }
              },
              purchaseBatchRequired: {
                value: {
                  message: "Inventory tracked purchase items require a batch number.",
                  code: "PURCHASE_BATCH_REQUIRED"
                }
              },
              purchaseExpirationDateInvalid: {
                value: {
                  message: "Purchase dates must use YYYY-MM-DD format.",
                  code: "PURCHASE_EXPIRATION_DATE_INVALID"
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
      CashSessionBadRequest: {
        description: "Invalid cash session payload or active authenticated user requirement failure",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              validationError: {
                value: {
                  message: "Invalid request payload.",
                  code: "VALIDATION_ERROR"
                }
              },
              initialAmountInvalid: {
                value: {
                  message: "Cash session amounts must be zero or greater with at most 2 decimal places.",
                  code: "CASH_SESSION_INITIAL_AMOUNT_INVALID"
                }
              },
              countedAmountInvalid: {
                value: {
                  message: "Cash session amounts must be zero or greater with at most 2 decimal places.",
                  code: "CASH_SESSION_COUNTED_AMOUNT_INVALID"
                }
              },
              noteInvalid: {
                value: {
                  message: "Cash session notes must have at most 240 characters.",
                  code: "CASH_SESSION_NOTE_INVALID"
                }
              }
            }
          }
        }
      },
      CashSessionCloseForbidden: {
        description: "The authenticated user cannot close another user's cash session",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              roleForbidden: {
                value: {
                  message: "You do not have permission to perform this action.",
                  code: "FORBIDDEN"
                }
              },
              closeOtherForbidden: {
                value: {
                  message: "Only admin users can close another user's cash session.",
                  code: "CASH_SESSION_CLOSE_FORBIDDEN"
                }
              },
              inactiveUser: {
                value: {
                  message: "Authenticated user must be active.",
                  code: "AUTHENTICATED_USER_NOT_ACTIVE"
                }
              }
            }
          }
        }
      },
      CashSessionNotFound: {
        description: "Cash session was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Cash session was not found.",
              code: "CASH_SESSION_NOT_FOUND"
            }
          }
        }
      },
      CashSessionConflict: {
        description: "Cash session duplicate opening or invalid closing state",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              alreadyOpen: {
                value: {
                  message: "User already has an open cash session.",
                  code: "CASH_SESSION_ALREADY_OPEN"
                }
              },
              alreadyClosed: {
                value: {
                  message: "Cash session is already closed.",
                  code: "CASH_SESSION_ALREADY_CLOSED"
                }
              }
            }
          }
        }
      },
      PendingCartBadRequest: {
        description: "Invalid pending cart payload or product validation failure",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              validationError: {
                value: {
                  message: "Invalid request payload.",
                  code: "VALIDATION_ERROR"
                }
              },
              productNotFound: {
                value: {
                  message: "Pending cart item product was not found.",
                  code: "PENDING_CART_ITEM_PRODUCT_NOT_FOUND",
                  details: {
                    productId: "product-id"
                  }
                }
              },
              productNotActive: {
                value: {
                  message: "Pending cart item product must be active.",
                  code: "PENDING_CART_ITEM_PRODUCT_NOT_ACTIVE",
                  details: {
                    productId: "product-id"
                  }
                }
              },
              salePaymentAmountInvalid: {
                value: {
                  message: "Sale amounts must be zero or greater with at most 2 decimal places.",
                  code: "SALE_PAYMENT_RECEIVED_AMOUNT_INVALID"
                }
              }
            }
          }
        }
      },
      PendingCartForbidden: {
        description: "The authenticated user cannot access or mutate the pending cart",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              roleForbidden: {
                value: {
                  message: "You do not have permission to perform this action.",
                  code: "FORBIDDEN"
                }
              },
              listAllForbidden: {
                value: {
                  message: "Only admin users can list all pending carts.",
                  code: "PENDING_CART_ACCESS_FORBIDDEN"
                }
              },
              convertForbidden: {
                value: {
                  message: "Pending cart belongs to another seller.",
                  code: "PENDING_CART_CONVERT_FORBIDDEN"
                }
              },
              discardForbidden: {
                value: {
                  message: "Pending cart belongs to another seller.",
                  code: "PENDING_CART_DISCARD_FORBIDDEN"
                }
              }
            }
          }
        }
      },
      PendingCartNotFound: {
        description: "Pending cart was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Pending cart was not found.",
              code: "PENDING_CART_NOT_FOUND"
            }
          }
        }
      },
      PendingCartConflict: {
        description: "Pending cart lifecycle, revalidation, cash session, or saleable stock rule was not satisfied",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              expired: {
                value: {
                  message: "Expired pending carts cannot be converted.",
                  code: "PENDING_CART_EXPIRED"
                }
              },
              notEditable: {
                value: {
                  message: "Pending cart cannot be edited in its current status.",
                  code: "PENDING_CART_NOT_EDITABLE"
                }
              },
              notDiscardable: {
                value: {
                  message: "Only active or expired pending carts can be discarded.",
                  code: "PENDING_CART_NOT_DISCARDABLE"
                }
              },
              notConvertible: {
                value: {
                  message: "Pending cart cannot be converted in its current status.",
                  code: "PENDING_CART_NOT_CONVERTIBLE"
                }
              },
              priceChanged: {
                value: {
                  message: "Pending cart item price changed.",
                  code: "PENDING_CART_ITEM_PRICE_CHANGED",
                  details: {
                    productId: "product-id",
                    issues: [
                      {
                        code: "price-changed",
                        productId: "product-id",
                        referenceUnitPrice: 3,
                        currentUnitPrice: 3.5
                      }
                    ]
                  }
                }
              },
              stockInsufficient: {
                value: {
                  message: "Pending cart stock is insufficient.",
                  code: "PENDING_CART_STOCK_INSUFFICIENT",
                  details: {
                    productId: "product-id",
                    issues: [
                      {
                        code: "stock-insufficient",
                        productId: "product-id",
                        requestedQuantity: 3,
                        saleableStock: 1
                      }
                    ]
                  }
                }
              },
              cashSessionRequired: {
                value: {
                  message: "User must have an open cash session to create a sale.",
                  code: "SALE_CASH_SESSION_REQUIRED"
                }
              },
              saleStockInsufficient: {
                value: {
                  message: "Saleable stock is not enough for the requested item.",
                  code: "SALE_STOCK_INSUFFICIENT",
                  details: {
                    productId: "product-id",
                    requestedQuantity: 3,
                    availableQuantity: 1
                  }
                }
              }
            }
          }
        }
      },
      SaleBadRequest: {
        description: "Invalid sale payload or sale business rule violation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              validationError: {
                value: {
                  message: "Invalid request payload.",
                  code: "VALIDATION_ERROR"
                }
              },
              saleItemsRequired: {
                value: {
                  message: "Sale must contain at least one item.",
                  code: "SALE_ITEMS_REQUIRED"
                }
              },
              saleItemQuantityInvalid: {
                value: {
                  message: "Sale item quantity must be a positive integer.",
                  code: "SALE_ITEM_QUANTITY_INVALID"
                }
              },
              salePaymentAmountInvalid: {
                value: {
                  message: "Sale amounts must be zero or greater with at most 2 decimal places.",
                  code: "SALE_PAYMENT_RECEIVED_AMOUNT_INVALID"
                }
              },
              saleItemProductNotFound: {
                value: {
                  message: "Sale item product was not found.",
                  code: "SALE_ITEM_PRODUCT_NOT_FOUND"
                }
              },
              saleItemProductNotActive: {
                value: {
                  message: "Sale item product must be active.",
                  code: "SALE_ITEM_PRODUCT_NOT_ACTIVE"
                }
              }
            }
          }
        }
      },
      SaleForbidden: {
        description: "The authenticated user cannot create or read the sale",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              roleForbidden: {
                value: {
                  message: "You do not have permission to perform this action.",
                  code: "FORBIDDEN"
                }
              },
              inactiveUser: {
                value: {
                  message: "Authenticated user must be active.",
                  code: "AUTHENTICATED_USER_NOT_ACTIVE"
                }
              },
              sellerOwnSalesOnly: {
                value: {
                  message: "Seller users can only read their own sales.",
                  code: "SALE_ACCESS_FORBIDDEN"
                }
              }
            }
          }
        }
      },
      SaleNotFound: {
        description: "Sale was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Sale was not found.",
              code: "SALE_NOT_FOUND"
            }
          }
        }
      },
      SaleConflict: {
        description: "Sale cannot be confirmed or cancelled because cash session, payment, cancellation, or saleable stock rules were not satisfied",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              cashSessionRequired: {
                value: {
                  message: "User must have an open cash session to create a sale.",
                  code: "SALE_CASH_SESSION_REQUIRED"
                }
              },
              cashSessionInvalid: {
                value: {
                  message: "Sale must use the authenticated user's open cash session.",
                  code: "SALE_CASH_SESSION_INVALID"
                }
              },
              paymentInsufficient: {
                value: {
                  message: "Received cash amount must be equal to or greater than sale total.",
                  code: "SALE_PAYMENT_INSUFFICIENT",
                  details: {
                    totalAmount: 25,
                    receivedAmount: 20
                  }
                }
              },
              stockInsufficient: {
                value: {
                  message: "Saleable stock is not enough for the requested item.",
                  code: "SALE_STOCK_INSUFFICIENT",
                  details: {
                    productId: "product-id",
                    requestedQuantity: 3,
                    availableQuantity: 1
                  }
                }
              },
              cashSessionClosed: {
                value: {
                  message: "Sale cannot be cancelled because its cash session is closed.",
                  code: "SALE_CASH_SESSION_CLOSED"
                }
              },
              saleAlreadyCancelled: {
                value: {
                  message: "Sale has already been cancelled.",
                  code: "SALE_ALREADY_CANCELLED"
                }
              },
              saleNotCancelable: {
                value: {
                  message: "Sale status cannot be cancelled.",
                  code: "SALE_NOT_CANCELABLE"
                }
              },
              salePaymentAlreadyReverted: {
                value: {
                  message: "Sale payment has already been reverted.",
                  code: "SALE_PAYMENT_ALREADY_REVERTED"
                }
              }
            }
          }
        }
      },
      AdministrativeForbidden: {
        description: "The authenticated user is not admin or superadmin",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Only admin and superadmin users can access this administrative operation.",
              code: "FORBIDDEN"
            }
          }
        }
      },
      SuperadminOnlyForbidden: {
        description: "The authenticated user is not superadmin",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Only superadmin users can access audit logs.",
              code: "FORBIDDEN"
            }
          }
        }
      },
      AdministrativeBadRequest: {
        description: "Invalid administrative closure payload",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              validationError: {
                value: {
                  message: "Invalid request payload.",
                  code: "VALIDATION_ERROR"
                }
              },
              invalidReason: {
                value: {
                  message: "Administrative reason must be between 5 and 500 characters.",
                  code: "ADMINISTRATIVE_REASON_INVALID"
                }
              }
            }
          }
        }
      },
      PreparedInvoiceNotFound: {
        description: "Prepared invoice was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Prepared invoice was not found.",
              code: "PREPARED_INVOICE_NOT_FOUND"
            }
          }
        }
      },
      PreparedInvoiceSaleNotFound: {
        description: "Sale was not found for prepared invoice creation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Sale was not found for prepared invoice creation.",
              code: "SALE_NOT_FOUND",
              details: {
                saleId: "sale-1",
                invoiceBlockedReason: "sale-not-found"
              }
            }
          }
        }
      },
      PreparedInvoiceConflict: {
        description: "Prepared invoice eligibility or lifecycle rule was not satisfied",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              saleNotInvoiceable: {
                value: {
                  message: "Sale is not eligible for prepared invoice creation.",
                  code: "SALE_NOT_INVOICEABLE",
                  details: {
                    invoiceBlockedReason: "sale-cancelled"
                  }
                }
              },
              activeInvoiceExists: {
                value: {
                  message: "Sale already has an active prepared invoice.",
                  code: "PREPARED_INVOICE_ACTIVE_EXISTS",
                  details: {
                    invoiceBlockedReason: "active-invoice-exists"
                  }
                }
              },
              alreadyCancelled: {
                value: {
                  message: "Prepared invoice has already been cancelled.",
                  code: "PREPARED_INVOICE_ALREADY_CANCELLED"
                }
              }
            }
          }
        }
      },
      SaleReturnBadRequest: {
        description: "Invalid total sale return payload",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              validationError: {
                value: {
                  message: "Invalid request payload.",
                  code: "VALIDATION_ERROR"
                }
              },
              invalidReason: {
                value: {
                  message: "Sale return reason must be between 5 and 500 characters.",
                  code: "SALE_RETURN_REASON_INVALID"
                }
              }
            }
          }
        }
      },
      SaleReturnNotFound: {
        description: "Sale return was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Sale return was not found.",
              code: "SALE_RETURN_NOT_FOUND"
            }
          }
        }
      },
      SaleReturnSaleNotFound: {
        description: "Sale was not found for return creation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            example: {
              message: "Sale was not found for return creation.",
              code: "SALE_NOT_FOUND",
              details: {
                saleId: "sale-0001",
                returnBlockedReason: "sale-not-found"
              }
            }
          }
        }
      },
      SaleReturnConflict: {
        description: "Total sale return eligibility rule was not satisfied",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError"
            },
            examples: {
              saleCancelled: {
                value: {
                  message: "Sale is not eligible for total return.",
                  code: "SALE_NOT_RETURNABLE",
                  details: {
                    saleId: "sale-0001",
                    saleStatus: "cancelled",
                    returnBlockedReason: "sale-cancelled"
                  }
                }
              },
              alreadyReturned: {
                value: {
                  message: "Sale is not eligible for total return.",
                  code: "SALE_NOT_RETURNABLE",
                  details: {
                    saleId: "sale-0001",
                    saleStatus: "returned",
                    returnBlockedReason: "already-returned"
                  }
                }
              },
              cashSessionOpen: {
                value: {
                  message: "Sale is not eligible for total return.",
                  code: "SALE_NOT_RETURNABLE",
                  details: {
                    saleId: "sale-0001",
                    saleStatus: "confirmed",
                    returnBlockedReason: "cash-session-open"
                  }
                }
              },
              activeInvoiceExists: {
                value: {
                  message: "Sale is not eligible for total return.",
                  code: "SALE_NOT_RETURNABLE",
                  details: {
                    saleId: "sale-0001",
                    saleStatus: "confirmed",
                    returnBlockedReason: "active-invoice-exists"
                  }
                }
              },
              paymentNotRefundable: {
                value: {
                  message: "Sale is not eligible for total return.",
                  code: "SALE_NOT_RETURNABLE",
                  details: {
                    saleId: "sale-0001",
                    saleStatus: "confirmed",
                    returnBlockedReason: "payment-not-refundable"
                  }
                }
              },
              paymentRefundFailed: {
                value: {
                  message: "Sale payment cannot be refunded.",
                  code: "SALE_PAYMENT_NOT_REFUNDABLE",
                  details: {
                    saleId: "sale-0001",
                    paymentId: "payment-0001"
                  }
                }
              },
              returnConflict: {
                value: {
                  message: "Sale has already been returned or is no longer confirmed.",
                  code: "SALE_RETURN_CONFLICT",
                  details: {
                    saleId: "sale-0001"
                  }
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
      CashSessionStatus: {
        type: "string",
        enum: ["open", "closed"]
      },
      CashSessionUserSummary: {
        type: "object",
        required: ["id", "fullName", "email"],
        properties: {
          id: {
            type: "string"
          },
          fullName: {
            type: "string",
            example: "Vendedor Principal"
          },
          email: {
            type: "string",
            format: "email",
            example: "vendedor@farmacia.com"
          }
        }
      },
      CashSession: {
        type: "object",
        required: [
          "id",
          "correlativeCode",
          "openedByUserId",
          "openedByUser",
          "initialAmount",
          "expectedAmount",
          "status",
          "openedAt",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: {
            type: "string"
          },
          correlativeCode: {
            type: "string",
            example: "C-000001"
          },
          openedByUserId: {
            type: "string"
          },
          openedByUser: {
            $ref: "#/components/schemas/CashSessionUserSummary"
          },
          closedByUserId: {
            type: "string"
          },
          closedByUser: {
            $ref: "#/components/schemas/CashSessionUserSummary"
          },
          initialAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 100
          },
          countedAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 125
          },
          expectedAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 125
          },
          differenceAmount: {
            type: "number",
            multipleOf: 0.01,
            example: 0
          },
          status: {
            $ref: "#/components/schemas/CashSessionStatus"
          },
          openingNote: {
            type: "string",
            maxLength: 240,
            example: "Apertura de turno manana"
          },
          closingNote: {
            type: "string",
            maxLength: 240,
            example: "Cierre sin diferencia"
          },
          openedAt: {
            type: "string",
            format: "date-time"
          },
          closedAt: {
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
      OpenCashSessionRequest: {
        type: "object",
        required: ["initialAmount"],
        properties: {
          initialAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 100
          },
          openingNote: {
            type: "string",
            maxLength: 240,
            example: "Apertura de turno manana"
          }
        }
      },
      CloseCashSessionRequest: {
        type: "object",
        required: ["countedAmount"],
        properties: {
          countedAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 125
          },
          closingNote: {
            type: "string",
            maxLength: 240,
            example: "Cierre sin diferencia"
          }
        }
      },
      CurrentCashSession: {
        type: "object",
        required: ["isOpen", "cashSession"],
        properties: {
          isOpen: {
            type: "boolean",
            example: true
          },
          cashSession: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/CashSession" }]
          }
        }
      },
      SupervisableCashSession: {
        allOf: [
          { $ref: "#/components/schemas/CashSession" },
          {
            type: "object",
            properties: {
              canClose: {
                type: "boolean",
                example: true
              }
            }
          }
        ]
      },
      CashSessionsListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/SupervisableCashSession"
            }
          },
          pagination: {
            $ref: "#/components/schemas/PaginationMeta"
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
          "supplierId",
          "supplier",
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
            example: "MED-000001"
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
          supplierId: {
            type: "string"
          },
          supplier: {
            $ref: "#/components/schemas/SupplierSummary"
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
        required: ["commercialName", "type", "categoryId", "baseUnitId", "supplierId", "salePrice"],
        properties: {
          internalCode: {
            type: "string",
            minLength: 2,
            maxLength: 40,
            description: "Optional override. When omitted, the backend generates it from product type.",
            example: "MED-000001"
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
          supplierId: {
            type: "string",
            description: "Unique supplier assigned to this product."
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
            type: "string",
            minLength: 1
          },
          unitId: {
            type: "string",
            minLength: 1
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
            nullable: true,
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
            type: "string",
            minLength: 1
          },
          purchaseDate: {
            type: "string",
            format: "date",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2026-05-11"
          },
          notes: {
            type: "string",
            nullable: true,
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
            nullable: true,
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
      PosProductUnit: {
        type: "object",
        required: ["id", "name", "abbreviation"],
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
          }
        }
      },
      PosProduct: {
        type: "object",
        required: ["id", "internalCode", "commercialName", "salePrice", "baseUnit", "saleableStock"],
        properties: {
          id: {
            type: "string"
          },
          internalCode: {
            type: "string",
            example: "MED-000001"
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
          salePrice: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 1.5
          },
          baseUnit: {
            $ref: "#/components/schemas/PosProductUnit"
          },
          saleableStock: {
            type: "integer",
            minimum: 0,
            example: 120
          },
          nextExpirationDate: {
            type: "string",
            format: "date",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2027-05-11"
          }
        }
      },
      PosProductsListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PosProduct"
            }
          },
          pagination: {
            $ref: "#/components/schemas/PaginationMeta"
          }
        }
      },
      SaleStatus: {
        type: "string",
        enum: ["confirmed", "cancelled", "returned"]
      },
      PaymentMethod: {
        type: "string",
        enum: ["cash"]
      },
      PaymentStatus: {
        type: "string",
        enum: ["paid", "reverted", "cancelled", "refunded"]
      },
      SaleUserSummary: {
        type: "object",
        required: ["id", "fullName", "email"],
        properties: {
          id: {
            type: "string"
          },
          fullName: {
            type: "string",
            example: "Vendedor Principal"
          },
          email: {
            type: "string",
            format: "email",
            example: "vendedor@farmacia.com"
          }
        }
      },
      SaleBatchConsumption: {
        type: "object",
        required: ["id", "saleItemId", "batchId", "quantity", "unitCost", "totalCost"],
        properties: {
          id: {
            type: "string"
          },
          saleItemId: {
            type: "string"
          },
          batchId: {
            type: "string"
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
          quantity: {
            type: "integer",
            minimum: 1,
            example: 2
          },
          unitCost: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 0.8
          },
          totalCost: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 1.6
          },
          inventoryMovementId: {
            type: "string"
          }
        }
      },
      SaleItem: {
        type: "object",
        required: [
          "id",
          "saleId",
          "productId",
          "internalCode",
          "commercialName",
          "baseUnit",
          "unitPrice",
          "quantity",
          "subtotal",
          "totalCost",
          "margin",
          "consumptions",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: {
            type: "string"
          },
          saleId: {
            type: "string"
          },
          productId: {
            type: "string"
          },
          internalCode: {
            type: "string",
            example: "MED-000001"
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
          baseUnit: {
            $ref: "#/components/schemas/PosProductUnit"
          },
          unitPrice: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 1.5
          },
          quantity: {
            type: "integer",
            minimum: 1,
            example: 2
          },
          subtotal: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3
          },
          totalCost: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 1.6
          },
          margin: {
            type: "number",
            multipleOf: 0.01,
            example: 1.4
          },
          consumptions: {
            type: "array",
            items: {
              $ref: "#/components/schemas/SaleBatchConsumption"
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
      Payment: {
        type: "object",
        required: [
          "id",
          "saleId",
          "cashSessionId",
          "method",
          "saleTotal",
          "receivedAmount",
          "changeAmount",
          "status",
          "paidAt",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: {
            type: "string"
          },
          saleId: {
            type: "string"
          },
          cashSessionId: {
            type: "string"
          },
          method: {
            $ref: "#/components/schemas/PaymentMethod"
          },
          saleTotal: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3
          },
          receivedAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 5
          },
          changeAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 2
          },
          status: {
            $ref: "#/components/schemas/PaymentStatus"
          },
          paidAt: {
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
      SaleReceiptItem: {
        type: "object",
        required: ["productName", "quantity", "unitPrice", "subtotal"],
        properties: {
          productName: {
            type: "string",
            example: "Paracetamol 500 mg"
          },
          quantity: {
            type: "integer",
            minimum: 1,
            example: 2
          },
          unitPrice: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 1.5
          },
          subtotal: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3
          }
        }
      },
      SaleReceipt: {
        type: "object",
        required: [
          "saleId",
          "saleCorrelativeCode",
          "cashSessionCorrelativeCode",
          "sellerName",
          "issuedAt",
          "items",
          "totalAmount",
          "receivedAmount",
          "changeAmount"
        ],
        properties: {
          saleId: {
            type: "string"
          },
          saleCorrelativeCode: {
            type: "string",
            example: "V-000001"
          },
          cashSessionCorrelativeCode: {
            type: "string",
            example: "C-000001"
          },
          sellerName: {
            type: "string",
            example: "Vendedor Principal"
          },
          issuedAt: {
            type: "string",
            format: "date-time"
          },
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/SaleReceiptItem"
            }
          },
          totalAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3
          },
          receivedAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 5
          },
          changeAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 2
          }
        }
      },
      Sale: {
        type: "object",
        required: [
          "id",
          "correlativeCode",
          "sellerUserId",
          "sellerUser",
          "cashSessionId",
          "cashSessionCorrelativeCode",
          "status",
          "items",
          "payment",
          "totalAmount",
          "totalCost",
          "totalMargin",
          "receipt",
          "confirmedAt",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: {
            type: "string"
          },
          correlativeCode: {
            type: "string",
            example: "V-000001"
          },
          sellerUserId: {
            type: "string"
          },
          sellerUser: {
            $ref: "#/components/schemas/SaleUserSummary"
          },
          cashSessionId: {
            type: "string"
          },
          cashSessionCorrelativeCode: {
            type: "string",
            example: "C-000001"
          },
          status: {
            $ref: "#/components/schemas/SaleStatus"
          },
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/SaleItem"
            }
          },
          payment: {
            $ref: "#/components/schemas/Payment"
          },
          totalAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3
          },
          totalCost: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 1.6
          },
          totalMargin: {
            type: "number",
            multipleOf: 0.01,
            example: 1.4
          },
          receipt: {
            $ref: "#/components/schemas/SaleReceipt"
          },
          confirmedAt: {
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
      SaleCancellationBlockReason: {
        type: "string",
        enum: ["cash-session-closed", "already-cancelled", "forbidden", "not-current-day", "unknown"]
      },
      CancelablePayment: {
        allOf: [
          { $ref: "#/components/schemas/Payment" },
          {
            type: "object",
            properties: {
              reversedAt: {
                type: "string",
                format: "date-time"
              },
              status: {
                $ref: "#/components/schemas/PaymentStatus"
              }
            }
          }
        ]
      },
      CancelableSale: {
        allOf: [
          { $ref: "#/components/schemas/Sale" },
          {
            type: "object",
            properties: {
              canCancel: {
                type: "boolean",
                example: true
              },
              cancellationBlockedReason: {
                $ref: "#/components/schemas/SaleCancellationBlockReason"
              },
              cancelReason: {
                type: "string",
                maxLength: 240
              },
              cancelledAt: {
                type: "string",
                format: "date-time"
              },
              cancelledByUser: {
                $ref: "#/components/schemas/SaleUserSummary"
              },
              cancelledByUserId: {
                type: "string"
              },
              payment: {
                $ref: "#/components/schemas/CancelablePayment"
              },
              status: {
                $ref: "#/components/schemas/SaleStatus"
              }
            }
          }
        ]
      },
      CancelableSaleSummary: {
        type: "object",
        required: [
          "id",
          "cashSessionCorrelativeCode",
          "cashSessionId",
          "confirmedAt",
          "correlativeCode",
          "createdAt",
          "sellerUser",
          "sellerUserId",
          "status",
          "totalAmount",
          "totalMargin",
          "updatedAt"
        ],
        properties: {
          id: {
            type: "string"
          },
          canCancel: {
            type: "boolean",
            example: true
          },
          cancellationBlockedReason: {
            $ref: "#/components/schemas/SaleCancellationBlockReason"
          },
          cancelReason: {
            type: "string",
            maxLength: 240
          },
          cancelledAt: {
            type: "string",
            format: "date-time"
          },
          cashSessionCorrelativeCode: {
            type: "string",
            example: "C-000001"
          },
          cashSessionId: {
            type: "string"
          },
          confirmedAt: {
            type: "string",
            format: "date-time"
          },
          correlativeCode: {
            type: "string",
            example: "V-000001"
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          sellerUser: {
            $ref: "#/components/schemas/SaleUserSummary"
          },
          sellerUserId: {
            type: "string"
          },
          status: {
            $ref: "#/components/schemas/SaleStatus"
          },
          totalAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3
          },
          totalMargin: {
            type: "number",
            multipleOf: 0.01,
            example: 1.4
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      SalesListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/CancelableSaleSummary"
            }
          },
          pagination: {
            $ref: "#/components/schemas/PaginationMeta"
          }
        }
      },
      CreateSaleItem: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: {
            type: "string",
            minLength: 1
          },
          quantity: {
            type: "integer",
            minimum: 1,
            example: 2
          }
        }
      },
      CreateSalePayment: {
        type: "object",
        required: ["method", "receivedAmount"],
        properties: {
          method: {
            type: "string",
            enum: ["cash"]
          },
          receivedAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 5
          }
        }
      },
      CreateSaleRequest: {
        type: "object",
        required: ["items", "payment"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: {
              $ref: "#/components/schemas/CreateSaleItem"
            }
          },
          payment: {
            $ref: "#/components/schemas/CreateSalePayment"
          }
        }
      },
      CancelSaleRequest: {
        type: "object",
        required: ["cancelReason"],
        properties: {
          cancelReason: {
            type: "string",
            minLength: 3,
            maxLength: 240,
            example: "Error de registro en caja"
          }
        }
      },
      PendingCartStatus: {
        type: "string",
        enum: ["active", "converted", "discarded", "expired"]
      },
      PendingCartRevalidationIssueCode: {
        type: "string",
        enum: ["price-changed", "stock-insufficient", "product-not-saleable"]
      },
      PendingCartRevalidationIssue: {
        type: "object",
        required: ["code", "productId"],
        properties: {
          code: {
            $ref: "#/components/schemas/PendingCartRevalidationIssueCode"
          },
          currentUnitPrice: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3.5
          },
          productId: {
            type: "string"
          },
          referenceUnitPrice: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3
          },
          requestedQuantity: {
            type: "integer",
            minimum: 1,
            example: 3
          },
          saleableStock: {
            type: "integer",
            minimum: 0,
            example: 1
          }
        }
      },
      PendingCartItem: {
        type: "object",
        required: [
          "baseUnit",
          "commercialName",
          "internalCode",
          "productId",
          "quantity",
          "referenceSubtotal",
          "referenceUnitPrice"
        ],
        properties: {
          barcode: {
            type: "string",
            example: "7790000000012"
          },
          baseUnit: {
            $ref: "#/components/schemas/PosProductUnit"
          },
          commercialName: {
            type: "string",
            example: "Paracetamol 500 mg"
          },
          currentUnitPrice: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3.5
          },
          genericName: {
            type: "string",
            example: "Paracetamol"
          },
          internalCode: {
            type: "string",
            example: "MED-000001"
          },
          isSaleable: {
            type: "boolean",
            example: true
          },
          nextExpirationDate: {
            type: "string",
            format: "date",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            example: "2027-05-11"
          },
          productId: {
            type: "string"
          },
          quantity: {
            type: "integer",
            minimum: 1,
            example: 2
          },
          referenceSubtotal: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 6
          },
          referenceUnitPrice: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 3
          },
          revalidationIssues: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PendingCartRevalidationIssue"
            }
          },
          saleableStock: {
            type: "integer",
            minimum: 0,
            example: 8
          }
        }
      },
      PendingCart: {
        type: "object",
        required: [
          "id",
          "createdAt",
          "expiresAt",
          "items",
          "ownerUserId",
          "referenceTotalAmount",
          "status",
          "updatedAt"
        ],
        properties: {
          id: {
            type: "string"
          },
          convertedAt: {
            type: "string",
            format: "date-time"
          },
          convertedSale: {
            $ref: "#/components/schemas/Sale"
          },
          convertedSaleId: {
            type: "string"
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          currentTotalAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 7
          },
          discardReason: {
            type: "string",
            maxLength: 240
          },
          discardedAt: {
            type: "string",
            format: "date-time"
          },
          expiredAt: {
            type: "string",
            format: "date-time"
          },
          expiresAt: {
            type: "string",
            format: "date-time"
          },
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PendingCartItem"
            }
          },
          name: {
            type: "string",
            maxLength: 120,
            example: "Cliente vuelve en la tarde"
          },
          note: {
            type: "string",
            maxLength: 240
          },
          ownerUser: {
            $ref: "#/components/schemas/SaleUserSummary"
          },
          ownerUserId: {
            type: "string"
          },
          referenceTotalAmount: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            example: 6
          },
          revalidationIssues: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PendingCartRevalidationIssue"
            }
          },
          status: {
            $ref: "#/components/schemas/PendingCartStatus"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      PendingCartItemInput: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: {
            type: "string",
            minLength: 1
          },
          quantity: {
            type: "integer",
            minimum: 1,
            example: 2
          }
        }
      },
      SavePendingCartRequest: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: {
              $ref: "#/components/schemas/PendingCartItemInput"
            }
          },
          name: {
            type: "string",
            maxLength: 120,
            example: "Cliente vuelve en la tarde"
          },
          note: {
            type: "string",
            maxLength: 240
          }
        }
      },
      DiscardPendingCartRequest: {
        type: "object",
        properties: {
          discardReason: {
            type: "string",
            maxLength: 240,
            example: "Atencion no concretada"
          }
        }
      },
      ConvertPendingCartRequest: {
        type: "object",
        required: ["payment"],
        properties: {
          payment: {
            $ref: "#/components/schemas/CreateSalePayment"
          }
        }
      },
      PendingCartRevalidation: {
        type: "object",
        required: ["cartId", "issues", "status", "totals"],
        properties: {
          cartId: {
            type: "string"
          },
          issues: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PendingCartRevalidationIssue"
            }
          },
          status: {
            type: "string",
            enum: ["valid", "warning", "blocked", "expired"]
          },
          totals: {
            type: "object",
            required: ["currentTotalAmount", "referenceTotalAmount"],
            properties: {
              currentTotalAmount: {
                type: "number",
                minimum: 0,
                multipleOf: 0.01,
                example: 7
              },
              referenceTotalAmount: {
                type: "number",
                minimum: 0,
                multipleOf: 0.01,
                example: 6
              }
            }
          }
        }
      },
      PendingCartsListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PendingCart"
            }
          },
          pagination: {
            $ref: "#/components/schemas/PaginationMeta"
          }
        }
      },
      AdministrativeUserSummary: {
        $ref: "#/components/schemas/SaleUserSummary"
      },
      PreparedInvoiceStatus: {
        type: "string",
        enum: ["prepared", "cancelled"]
      },
      PreparedInvoiceEligibilityBlockReason: {
        type: "string",
        enum: ["sale-not-found", "sale-cancelled", "sale-returned", "active-invoice-exists", "unknown"]
      },
      PreparedInvoiceItem: {
        type: "object",
        required: [
          "id",
          "preparedInvoiceId",
          "saleItemId",
          "productId",
          "internalCode",
          "commercialName",
          "baseUnit",
          "unitPrice",
          "quantity",
          "subtotal",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: { type: "string" },
          preparedInvoiceId: { type: "string" },
          saleItemId: { type: "string" },
          productId: { type: "string" },
          internalCode: { type: "string", example: "MED-000001" },
          barcode: { type: "string", example: "7790000000012" },
          commercialName: { type: "string", example: "Paracetamol 500 mg" },
          genericName: { type: "string", example: "Paracetamol" },
          baseUnit: { $ref: "#/components/schemas/PosProductUnit" },
          unitPrice: { type: "number", minimum: 0, multipleOf: 0.01, example: 3 },
          quantity: { type: "integer", minimum: 1, example: 2 },
          subtotal: { type: "number", minimum: 0, multipleOf: 0.01, example: 6 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      PreparedInvoiceSummary: {
        type: "object",
        required: [
          "id",
          "correlativeCode",
          "saleId",
          "saleCorrelativeCode",
          "cashSessionId",
          "cashSessionCode",
          "sellerUserId",
          "sellerName",
          "sellerEmail",
          "status",
          "customerNit",
          "customerBusinessName",
          "totalAmount",
          "preparedAt",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: { type: "string" },
          correlativeCode: { type: "string", example: "INV-000001" },
          saleId: { type: "string" },
          saleCorrelativeCode: { type: "string", example: "V-000001" },
          cashSessionId: { type: "string" },
          cashSessionCode: { type: "string", example: "C-000001" },
          sellerUserId: { type: "string" },
          sellerName: { type: "string", example: "Vendedor Principal" },
          sellerEmail: { type: "string", format: "email" },
          status: { $ref: "#/components/schemas/PreparedInvoiceStatus" },
          customerNit: { type: "string", default: "0" },
          customerBusinessName: { type: "string", default: "Consumidor final" },
          fiscalNotes: { type: "string", maxLength: 500 },
          totalAmount: { type: "number", minimum: 0, multipleOf: 0.01, example: 6 },
          preparedAt: { type: "string", format: "date-time" },
          cancelledAt: { type: "string", format: "date-time" },
          cancelledByUserId: { type: "string" },
          cancelledByUser: { $ref: "#/components/schemas/AdministrativeUserSummary" },
          cancelReason: { type: "string", maxLength: 500 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      PreparedInvoice: {
        allOf: [
          { $ref: "#/components/schemas/PreparedInvoiceSummary" },
          {
            type: "object",
            required: ["items"],
            properties: {
              sellerUser: { $ref: "#/components/schemas/AdministrativeUserSummary" },
              items: {
                type: "array",
                items: { $ref: "#/components/schemas/PreparedInvoiceItem" }
              }
            }
          }
        ]
      },
      PrepareInvoiceFromSaleRequest: {
        type: "object",
        required: ["saleId"],
        properties: {
          saleId: { type: "string", minLength: 1 },
          customerNit: { type: "string", maxLength: 32, default: "0" },
          customerBusinessName: { type: "string", maxLength: 180, default: "Consumidor final" },
          fiscalNotes: { type: "string", maxLength: 500 }
        }
      },
      CancelPreparedInvoiceRequest: {
        type: "object",
        required: ["cancelReason"],
        properties: {
          cancelReason: { type: "string", minLength: 5, maxLength: 500 }
        }
      },
      PreparedInvoicesListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/PreparedInvoiceSummary" }
          },
          pagination: { $ref: "#/components/schemas/PaginationMeta" }
        }
      },
      InvoiceableSaleSummary: {
        type: "object",
        required: [
          "id",
          "correlativeCode",
          "cashSessionId",
          "cashSessionCorrelativeCode",
          "sellerUserId",
          "sellerUser",
          "status",
          "totalAmount",
          "confirmedAt",
          "canPrepareInvoice"
        ],
        properties: {
          id: { type: "string" },
          correlativeCode: { type: "string", example: "V-000001" },
          cashSessionId: { type: "string" },
          cashSessionCorrelativeCode: { type: "string", example: "C-000001" },
          sellerUserId: { type: "string" },
          sellerUser: { $ref: "#/components/schemas/AdministrativeUserSummary" },
          status: { $ref: "#/components/schemas/SaleStatus" },
          totalAmount: { type: "number", minimum: 0, multipleOf: 0.01, example: 6 },
          confirmedAt: { type: "string", format: "date-time" },
          activePreparedInvoiceId: { type: "string" },
          canPrepareInvoice: { type: "boolean", example: true },
          invoiceBlockedReason: { $ref: "#/components/schemas/PreparedInvoiceEligibilityBlockReason" }
        }
      },
      InvoiceableSalesListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/InvoiceableSaleSummary" }
          },
          pagination: { $ref: "#/components/schemas/PaginationMeta" }
        }
      },
      ReturnableSaleBlockReason: {
        type: "string",
        enum: [
          "sale-not-found",
          "sale-cancelled",
          "already-returned",
          "cash-session-open",
          "active-invoice-exists",
          "payment-not-refundable",
          "unknown"
        ]
      },
      ReturnableSaleSummary: {
        type: "object",
        required: [
          "id",
          "correlativeCode",
          "cashSessionId",
          "cashSessionCorrelativeCode",
          "sellerUserId",
          "sellerUser",
          "status",
          "paymentStatus",
          "totalAmount",
          "confirmedAt",
          "canReturn"
        ],
        properties: {
          id: { type: "string" },
          correlativeCode: { type: "string", example: "V-000001" },
          cashSessionId: { type: "string" },
          cashSessionCorrelativeCode: { type: "string", example: "C-000001" },
          sellerUserId: { type: "string" },
          sellerUser: { $ref: "#/components/schemas/AdministrativeUserSummary" },
          status: { $ref: "#/components/schemas/SaleStatus" },
          paymentStatus: { $ref: "#/components/schemas/PaymentStatus" },
          totalAmount: { type: "number", minimum: 0, multipleOf: 0.01, example: 6 },
          confirmedAt: { type: "string", format: "date-time" },
          canReturn: { type: "boolean", example: true },
          returnBlockedReason: { $ref: "#/components/schemas/ReturnableSaleBlockReason" },
          activePreparedInvoiceId: { type: "string" }
        }
      },
      ReturnableSalesListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/ReturnableSaleSummary" }
          },
          pagination: { $ref: "#/components/schemas/PaginationMeta" }
        }
      },
      CreateTotalSaleReturnRequest: {
        type: "object",
        required: ["saleId", "reason"],
        properties: {
          saleId: { type: "string", minLength: 1 },
          reason: { type: "string", minLength: 5, maxLength: 500 }
        }
      },
      SaleReturnItem: {
        type: "object",
        required: [
          "id",
          "saleReturnId",
          "saleItemId",
          "saleItemBatchId",
          "batchId",
          "productId",
          "internalCode",
          "commercialName",
          "quantity",
          "unitCostBase",
          "refundUnitPrice",
          "refundSubtotal",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: { type: "string" },
          saleReturnId: { type: "string" },
          saleItemId: { type: "string" },
          saleItemBatchId: { type: "string" },
          batchId: { type: "string" },
          productId: { type: "string" },
          inventoryMovementId: { type: "string" },
          internalCode: { type: "string", example: "MED-000001" },
          commercialName: { type: "string", example: "Paracetamol 500 mg" },
          genericName: { type: "string", example: "Paracetamol" },
          batchNumber: { type: "string", example: "L-001" },
          expirationDate: { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          quantity: { type: "number", minimum: 0, example: 2 },
          unitCostBase: { type: "number", minimum: 0, example: 1.25 },
          refundUnitPrice: { type: "number", minimum: 0, multipleOf: 0.01, example: 3 },
          refundSubtotal: { type: "number", minimum: 0, multipleOf: 0.01, example: 6 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      SaleReturnSummary: {
        type: "object",
        required: [
          "id",
          "saleId",
          "saleCorrelativeCode",
          "paymentId",
          "actorUserId",
          "actorUser",
          "reason",
          "refundAmount",
          "returnedAt",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: { type: "string" },
          saleId: { type: "string" },
          saleCorrelativeCode: { type: "string", example: "V-000001" },
          paymentId: { type: "string" },
          actorUserId: { type: "string" },
          actorUser: { $ref: "#/components/schemas/AdministrativeUserSummary" },
          reason: { type: "string", minLength: 5, maxLength: 500 },
          refundAmount: { type: "number", minimum: 0, multipleOf: 0.01, example: 6 },
          returnedAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      SaleReturn: {
        allOf: [
          { $ref: "#/components/schemas/SaleReturnSummary" },
          {
            type: "object",
            required: ["items"],
            properties: {
              items: {
                type: "array",
                items: { $ref: "#/components/schemas/SaleReturnItem" }
              }
            }
          }
        ]
      },
      SaleReturnsListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/SaleReturnSummary" }
          },
          pagination: { $ref: "#/components/schemas/PaginationMeta" }
        }
      },
      AdministrativeJsonValue: {
        nullable: true,
        oneOf: [
          { type: "string" },
          { type: "number" },
          { type: "boolean" },
          { type: "object", additionalProperties: true },
          { type: "array", items: {} }
        ]
      },
      AuditLog: {
        type: "object",
        required: ["id", "action", "createdAt"],
        properties: {
          id: { type: "string" },
          action: { type: "string", example: "CSV_EXPORT_DOWNLOADED" },
          actorUserId: { type: "string" },
          actorUser: { $ref: "#/components/schemas/AdministrativeUserSummary" },
          entityType: { type: "string", example: "export" },
          entityId: { type: "string", example: "sales.csv" },
          metadata: { $ref: "#/components/schemas/AdministrativeJsonValue" },
          ipAddress: { type: "string" },
          userAgent: { type: "string" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      AuditLogsListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/AuditLog" }
          },
          pagination: { $ref: "#/components/schemas/PaginationMeta" }
        }
      },
      ReportRange: {
        type: "object",
        required: ["fromDate", "toDate", "timezone"],
        properties: {
          fromDate: { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          toDate: { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          timezone: { type: "string", enum: ["America/La_Paz"], default: "America/La_Paz" }
        }
      },
      DailySalesReportRow: {
        type: "object",
        required: [
          "date",
          "grossSalesAmount",
          "cancelledAmount",
          "returnedAmount",
          "netSalesAmount",
          "saleCount",
          "cancelledCount",
          "returnedCount"
        ],
        properties: {
          date: { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          grossSalesAmount: { type: "number", minimum: 0, multipleOf: 0.01 },
          cancelledAmount: { type: "number", minimum: 0, multipleOf: 0.01 },
          returnedAmount: { type: "number", minimum: 0, multipleOf: 0.01 },
          netSalesAmount: { type: "number", multipleOf: 0.01 },
          saleCount: { type: "integer", minimum: 0 },
          cancelledCount: { type: "integer", minimum: 0 },
          returnedCount: { type: "integer", minimum: 0 }
        }
      },
      DailySalesReportResponse: {
        type: "object",
        required: ["range", "generatedAt", "audited", "data"],
        properties: {
          range: { $ref: "#/components/schemas/ReportRange" },
          generatedAt: { type: "string", format: "date-time" },
          audited: { type: "boolean", enum: [false], example: false },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/DailySalesReportRow" }
          }
        }
      },
      InventoryValuationLot: {
        type: "object",
        required: ["batchId", "availableQuantity", "unitCostBase", "totalValue"],
        properties: {
          batchId: { type: "string" },
          batchNumber: { type: "string", example: "L-001" },
          expirationDate: { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          availableQuantity: { type: "number", minimum: 0 },
          unitCostBase: { type: "number", minimum: 0 },
          totalValue: { type: "number", minimum: 0, multipleOf: 0.01 }
        }
      },
      InventoryValuationProduct: {
        type: "object",
        required: [
          "productId",
          "internalCode",
          "commercialName",
          "baseUnit",
          "totalAvailableQuantity",
          "totalValue",
          "lots"
        ],
        properties: {
          productId: { type: "string" },
          internalCode: { type: "string", example: "MED-000001" },
          commercialName: { type: "string", example: "Paracetamol 500 mg" },
          genericName: { type: "string", example: "Paracetamol" },
          baseUnit: { $ref: "#/components/schemas/PosProductUnit" },
          totalAvailableQuantity: { type: "number", minimum: 0 },
          totalValue: { type: "number", minimum: 0, multipleOf: 0.01 },
          lots: {
            type: "array",
            items: { $ref: "#/components/schemas/InventoryValuationLot" }
          }
        }
      },
      InventoryValuationReportResponse: {
        type: "object",
        required: ["generatedAt", "timezone", "audited", "totalValue", "data"],
        properties: {
          generatedAt: { type: "string", format: "date-time" },
          timezone: { type: "string", enum: ["America/La_Paz"], default: "America/La_Paz" },
          audited: { type: "boolean", enum: [false], example: false },
          totalValue: { type: "number", minimum: 0, multipleOf: 0.01 },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/InventoryValuationProduct" }
          }
        }
      },
      ExpiringProduct: {
        type: "object",
        required: [
          "productId",
          "internalCode",
          "commercialName",
          "batchId",
          "expirationDate",
          "daysUntilExpiration",
          "availableQuantity",
          "unitCostBase",
          "totalValue"
        ],
        properties: {
          productId: { type: "string" },
          internalCode: { type: "string", example: "MED-000001" },
          commercialName: { type: "string", example: "Paracetamol 500 mg" },
          genericName: { type: "string", example: "Paracetamol" },
          batchId: { type: "string" },
          batchNumber: { type: "string", example: "L-001" },
          expirationDate: { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          daysUntilExpiration: { type: "integer", example: 14 },
          availableQuantity: { type: "number", minimum: 0 },
          unitCostBase: { type: "number", minimum: 0 },
          totalValue: { type: "number", minimum: 0, multipleOf: 0.01 }
        }
      },
      ExpiringProductsReportResponse: {
        type: "object",
        required: ["range", "generatedAt", "audited", "data"],
        properties: {
          range: {
            type: "object",
            required: ["days", "timezone"],
            properties: {
              days: { type: "integer", minimum: 1, maximum: 365, default: 30 },
              search: { type: "string" },
              productId: { type: "string" },
              timezone: { type: "string", enum: ["America/La_Paz"], default: "America/La_Paz" }
            }
          },
          generatedAt: { type: "string", format: "date-time" },
          audited: { type: "boolean", enum: [false], example: false },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/ExpiringProduct" }
          }
        }
      },
      InventoryMovementType: {
        type: "string",
        enum: [
          "purchase_received",
          "purchase_cancelled",
          "inventory_adjustment",
          "sale_confirmed",
          "sale_cancelled",
          "sale_returned"
        ]
      },
      SalesCsvRow: {
        type: "object",
        required: [
          "saleId",
          "correlativeCode",
          "status",
          "sellerName",
          "cashSessionCorrelativeCode",
          "totalAmount",
          "totalCost",
          "totalMargin",
          "confirmedAt"
        ],
        properties: {
          saleId: { type: "string" },
          correlativeCode: { type: "string", example: "V-000001" },
          status: { $ref: "#/components/schemas/SaleStatus" },
          sellerName: { type: "string" },
          cashSessionCorrelativeCode: { type: "string", example: "C-000001" },
          totalAmount: { type: "number", minimum: 0, multipleOf: 0.01 },
          totalCost: { type: "number", minimum: 0, multipleOf: 0.01 },
          totalMargin: { type: "number", multipleOf: 0.01 },
          confirmedAt: { type: "string", format: "date-time" },
          cancelledAt: { type: "string", format: "date-time" },
          returnedAt: { type: "string", format: "date-time" }
        }
      },
      InventoryMovementsCsvRow: {
        type: "object",
        required: [
          "movementId",
          "type",
          "productId",
          "internalCode",
          "commercialName",
          "batchId",
          "quantityBase",
          "unitCostBase",
          "referenceType",
          "referenceId",
          "createdAt"
        ],
        properties: {
          movementId: { type: "string" },
          type: { $ref: "#/components/schemas/InventoryMovementType" },
          productId: { type: "string" },
          internalCode: { type: "string", example: "MED-000001" },
          commercialName: { type: "string", example: "Paracetamol 500 mg" },
          batchId: { type: "string" },
          batchNumber: { type: "string", example: "L-001" },
          quantityBase: { type: "number", example: -2 },
          unitCostBase: { type: "number", minimum: 0, example: 1.25 },
          referenceType: { type: "string", example: "sale_return" },
          referenceId: { type: "string" },
          actorUserName: { type: "string" },
          reason: { type: "string" },
          createdAt: { type: "string", format: "date-time" }
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
