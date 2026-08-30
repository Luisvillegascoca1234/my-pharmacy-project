import { useEffect, useState } from "react";
import { isFeatureAllowed } from "@pharmacy-pos/shared";
import { getOperationalDate, OPERATIONAL_TIME_ZONE } from "@/lib/operational-date";
import { useAlerts } from "@/modules/alerts";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { purchasesFacade } from "@/modules/purchases";
import { reportsFacade } from "@/modules/reports";

export type DashboardMetricStatus = "error" | "idle" | "loading" | "success" | "unavailable";

type DailySalesSummary = {
  netAmount: number;
  transactionCount: number;
};

const emptyDailySalesSummary: DailySalesSummary = {
  netAmount: 0,
  transactionCount: 0
};

function isRequestAborted(signal: AbortSignal) {
  return signal.aborted;
}

export function useDashboardSummary() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const alerts = useAlerts();
  const canReadReports = isFeatureAllowed(user?.role.name, "reports");
  const canReadPurchases = isFeatureAllowed(user?.role.name, "purchases");
  const [dailySales, setDailySales] = useState<DailySalesSummary>(emptyDailySalesSummary);
  const [dailySalesStatus, setDailySalesStatus] = useState<DashboardMetricStatus>("idle");
  const [openPurchases, setOpenPurchases] = useState(0);
  const [openPurchasesStatus, setOpenPurchasesStatus] = useState<DashboardMetricStatus>("idle");

  useEffect(() => {
    const controller = new AbortController();

    if (!token) {
      setDailySales(emptyDailySalesSummary);
      setDailySalesStatus("idle");
      setOpenPurchases(0);
      setOpenPurchasesStatus("idle");
      return () => controller.abort();
    }

    if (canReadReports) {
      const operationalDate = getOperationalDate();

      setDailySalesStatus("loading");
      void reportsFacade
        .getDailySalesReport(
          {
            fromDate: operationalDate,
            timezone: OPERATIONAL_TIME_ZONE,
            toDate: operationalDate
          },
          controller.signal
        )
        .then((response) => {
          const summary = response.data.reduce<DailySalesSummary>(
            (total, row) => ({
              netAmount: total.netAmount + row.netSalesAmount,
              transactionCount: total.transactionCount + row.saleCount
            }),
            emptyDailySalesSummary
          );

          setDailySales(summary);
          setDailySalesStatus("success");
        })
        .catch(() => {
          if (!isRequestAborted(controller.signal)) {
            setDailySalesStatus("error");
          }
        });
    } else {
      setDailySales(emptyDailySalesSummary);
      setDailySalesStatus("unavailable");
    }

    if (canReadPurchases) {
      setOpenPurchasesStatus("loading");
      void purchasesFacade
        .getAll({ page: 1, pageSize: 1, status: "draft" }, controller.signal)
        .then((response) => {
          setOpenPurchases(response.pagination.total);
          setOpenPurchasesStatus("success");
        })
        .catch(() => {
          if (!isRequestAborted(controller.signal)) {
            setOpenPurchasesStatus("error");
          }
        });
    } else {
      setOpenPurchases(0);
      setOpenPurchasesStatus("unavailable");
    }

    return () => controller.abort();
  }, [canReadPurchases, canReadReports, token]);

  return {
    alerts,
    canReadPurchases,
    canReadReports,
    dailySales,
    dailySalesStatus,
    openPurchases,
    openPurchasesStatus,
    roleName: user?.role.name
  };
}
