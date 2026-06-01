import type { PosProduct } from "@pharmacy-pos/shared";

export type PosRequestStatus = "idle" | "loading" | "success" | "error";

export type PosDataErrorCode =
  | "cart-empty"
  | "cash-session-closed"
  | "cash-session-invalid"
  | "payment-insufficient"
  | "product-not-saleable"
  | "session-invalid"
  | "stock-insufficient"
  | "unknown";

export type PosDataError = {
  code: PosDataErrorCode;
  productId?: string;
  statusCode: number | null;
};

export type PosCartItem = {
  barcode?: string;
  baseUnit: PosProduct["baseUnit"];
  commercialName: string;
  genericName?: string;
  internalCode: string;
  nextExpirationDate?: string;
  productId: string;
  quantity: number;
  saleableStock: number;
  subtotal: number;
  unitPrice: number;
};

export type PosCartTotals = {
  itemCount: number;
  totalAmount: number;
  totalQuantity: number;
};
