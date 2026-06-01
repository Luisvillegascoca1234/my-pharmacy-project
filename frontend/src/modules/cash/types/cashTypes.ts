export type CashRequestStatus = "idle" | "loading" | "success" | "error";

export type CashDataErrorCode =
  | "already-closed"
  | "already-open"
  | "amount-invalid"
  | "forbidden"
  | "not-found"
  | "session-invalid"
  | "unknown";

export type CashDataError = {
  code: CashDataErrorCode;
  statusCode: number | null;
};
