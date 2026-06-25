import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectAuditActions, selectAuditState } from "../store/AuditSelectors";
import { useAuditStore } from "../store/AuditStore";

type UseAuditOptions = {
  autoLoad?: boolean;
};

function canUseAudit(roleName?: string): boolean {
  return roleName === "superadmin";
}

export function useAudit(options: UseAuditOptions = {}) {
  const { autoLoad = true } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const auditState = useAuditStore(useShallow(selectAuditState));
  const auditActions = useAuditStore(useShallow(selectAuditActions));
  const canReadAudit = canUseAudit(user?.role.name);

  const loadAuditLogs = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canReadAudit) {
        auditActions.reset();
        return;
      }

      await auditActions.loadAuditLogs(signal);
    },
    [auditActions, canReadAudit, token]
  );

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    const controller = new AbortController();

    void loadAuditLogs(controller.signal);

    return () => controller.abort();
  }, [
    auditState.action,
    auditState.actorUserId,
    auditState.entityId,
    auditState.entityType,
    auditState.fromDate,
    auditState.pagination.page,
    auditState.pagination.pageSize,
    auditState.toDate,
    autoLoad,
    loadAuditLogs,
    user?.id
  ]);

  useEffect(() => {
    if (!token || !canReadAudit) {
      auditActions.reset();
    }
  }, [auditActions, canReadAudit, token, user?.id]);

  return useMemo(
    () => ({
      ...auditState,
      canReadAudit,
      loadAuditLogs,
      reset: auditActions.reset,
      selectAuditLog: auditActions.selectAuditLog,
      setAction: auditActions.setAction,
      setActorUserId: auditActions.setActorUserId,
      setEntityId: auditActions.setEntityId,
      setEntityType: auditActions.setEntityType,
      setFromDate: auditActions.setFromDate,
      setPage: auditActions.setPage,
      setPageSize: auditActions.setPageSize,
      setToDate: auditActions.setToDate
    }),
    [auditActions, auditState, canReadAudit, loadAuditLogs]
  );
}
