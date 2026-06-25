import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { auditFacade } from "../facades/auditFacade";
import { createAuditDataError, getAuditStatusFromError } from "../utils/auditErrors";
import type { AuditActions } from "./AuditActions";
import { AUDIT_DEFAULT_PAGE_SIZE, buildAuditLogsQueryFromState, initialAuditState, type AuditState } from "./AuditState";

export type AuditStore = AuditState & AuditActions;

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

export const useAuditStore = create<AuditStore>()(
  devtools(
    (set, get) => ({
      ...initialAuditState,

      async loadAuditLogs(signal) {
        set({ auditLogsStatus: "loading", error: null }, false, "loadAuditLogs:start");

        try {
          const response = await auditFacade.listAuditLogs(buildAuditLogsQueryFromState(get()), signal);

          set(
            (state) => {
              const selectedAuditLog =
                state.selectedAuditLogId ? response.data.find((item) => item.id === state.selectedAuditLogId) ?? null : null;

              return {
                auditLogs: response.data,
                auditLogsStatus: response.data.length > 0 ? "success" : "empty",
                error: null,
                pagination: response.pagination,
                selectedAuditLog,
                selectedAuditLogId: selectedAuditLog?.id ?? state.selectedAuditLogId
              };
            },
            false,
            "loadAuditLogs:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createAuditDataError(error);

          set({ auditLogsStatus: getAuditStatusFromError(dataError), error: dataError }, false, "loadAuditLogs:error");
        }
      },

      reset() {
        set(initialAuditState, false, "reset");
      },

      selectAuditLog(selectedAuditLogId) {
        const selectedAuditLog = selectedAuditLogId ? get().auditLogs.find((item) => item.id === selectedAuditLogId) ?? null : null;

        set({ selectedAuditLog, selectedAuditLogId }, false, "selectAuditLog");
      },

      setAction(action) {
        set((state) => ({ action, pagination: { ...state.pagination, page: 1 } }), false, "setAction");
      },

      setActorUserId(actorUserId) {
        set((state) => ({ actorUserId, pagination: { ...state.pagination, page: 1 } }), false, "setActorUserId");
      },

      setEntityId(entityId) {
        set((state) => ({ entityId, pagination: { ...state.pagination, page: 1 } }), false, "setEntityId");
      },

      setEntityType(entityType) {
        set((state) => ({ entityType, pagination: { ...state.pagination, page: 1 } }), false, "setEntityType");
      },

      setFromDate(fromDate) {
        set((state) => ({ fromDate, pagination: { ...state.pagination, page: 1 } }), false, "setFromDate");
      },

      setPage(page) {
        set((state) => ({ pagination: { ...state.pagination, page } }), false, "setPage");
      },

      setPageSize(pageSize) {
        set(
          {
            pagination: {
              page: 1,
              pageSize,
              total: 0,
              totalPages: 0
            }
          },
          false,
          "setPageSize"
        );
      },

      setToDate(toDate) {
        set((state) => ({ pagination: { ...state.pagination, page: 1 }, toDate }), false, "setToDate");
      }
    }),
    { name: "AuditStore" }
  )
);

export function resetAuditStore() {
  useAuditStore.getState().reset();
}
