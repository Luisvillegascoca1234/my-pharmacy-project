export type RolesRequestStatus = "error" | "idle" | "invalid-configuration" | "loading" | "success";

export type RolesDataError = {
  code: "invalid-configuration" | "request-failed";
  cause?: unknown;
};
