import { axiosApi } from "@/api";
import type { AuditLogsListResponse, AuditLogsQuery } from "../types/auditTypes";

export const auditApi = {
  async listAuditLogs(query: AuditLogsQuery, signal?: AbortSignal): Promise<AuditLogsListResponse> {
    const response = await axiosApi.get<AuditLogsListResponse>("/audit/logs", {
      params: query,
      signal
    });

    return response.data;
  }
};
