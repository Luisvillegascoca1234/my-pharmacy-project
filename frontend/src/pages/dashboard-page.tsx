import { isFeatureAllowed, type Alert as PharmacyAlert, type AlertType, type FeatureKey } from "@pharmacy-pos/shared";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarDays,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
  Store,
  WalletCards,
  type LucideIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATIONAL_TIME_ZONE } from "@/lib/operational-date";
import { useDashboardSummary, type DashboardMetricStatus } from "@/modules/dashboard";
import { useCashSession } from "@/modules/cash";
import { useHealthStatus } from "@/modules/health";

const operationalDateFormatter = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "long",
  timeZone: OPERATIONAL_TIME_ZONE,
  weekday: "long",
  year: "numeric"
});

const moneyFormatter = new Intl.NumberFormat("es-BO", {
  currency: "BOB",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency"
});

type QuickAction = {
  description: string;
  feature: FeatureKey;
  icon: LucideIcon;
  label: string;
  path: string;
};

const quickActions: QuickAction[] = [
  { label: "Caja", description: "Abrir o cerrar tu caja", path: "/cash", icon: WalletCards, feature: "cash" },
  { label: "Nueva venta", description: "Atender una venta de mostrador", path: "/pos", icon: Store, feature: "pos" },
  { label: "Nueva compra", description: "Registrar una compra a proveedor", path: "/purchases/new", icon: ShoppingCart, feature: "purchases" },
  { label: "Existencias", description: "Consultar lotes y vencimientos", path: "/batches", icon: PackageCheck, feature: "batches" },
  { label: "Reportes", description: "Consultar ventas e inventario", path: "/reports", icon: ReceiptText, feature: "reports" }
];

export function DashboardPage() {
  const navigate = useNavigate();
  const health = useHealthStatus();
  const summary = useDashboardSummary();
  const cash = useCashSession();
  const isAdministrative = summary.roleName === "admin" || summary.roleName === "superadmin";
  const hasOpenCash = cash.current.isOpen;
  const primaryAction = isAdministrative
    ? { label: "Supervisar ventas", path: "/supervision", icon: WalletCards }
    : hasOpenCash
      ? { label: "Nueva venta", path: "/pos", icon: Store }
      : { label: "Abrir caja", path: "/cash", icon: WalletCards };
  const PrimaryActionIcon = primaryAction.icon;
  const criticalProductCount = countUniqueProducts(summary.alerts.items, ["low_stock", "out_of_stock"]);
  const expiringLotCount = summary.alerts.items.filter((alert) => alert.type === "near_expiration").length;
  const alertMetricStatus = toDashboardMetricStatus(summary.alerts.status);
  const visibleQuickActions = quickActions.filter((action) => isFeatureAllowed(summary.roleName, action.feature));
  const summaryCards = [
    {
      title: "Ventas de hoy",
      value: getMetricValue(summary.dailySalesStatus, moneyFormatter.format(summary.dailySales.netAmount)),
      detail: getMetricDetail(
        summary.dailySalesStatus,
        `${summary.dailySales.transactionCount} transacciones confirmadas`,
        "Disponible para administración"
      ),
      icon: Store,
      toneClass: "bg-primary/10 text-primary"
    },
    {
      title: "Stock crítico",
      value: getMetricValue(alertMetricStatus, String(criticalProductCount)),
      detail: getMetricDetail(alertMetricStatus, criticalProductCount === 1 ? "1 producto requiere revisión" : `${criticalProductCount} productos requieren revisión`),
      icon: Boxes,
      toneClass: "bg-warning/10 text-warning-foreground dark:text-warning"
    },
    {
      title: "Compras abiertas",
      value: getMetricValue(summary.openPurchasesStatus, String(summary.openPurchases)),
      detail: getMetricDetail(
        summary.openPurchasesStatus,
        summary.openPurchases === 1 ? "1 borrador pendiente" : `${summary.openPurchases} borradores pendientes`,
        "Disponible para administración"
      ),
      icon: ShoppingCart,
      toneClass: "bg-info/10 text-info"
    },
    {
      title: "Próximos a vencer",
      value: getMetricValue(alertMetricStatus, String(expiringLotCount)),
      detail: getMetricDetail(alertMetricStatus, expiringLotCount === 1 ? "1 lote en los próximos 30 días" : `${expiringLotCount} lotes en los próximos 30 días`),
      icon: CalendarDays,
      toneClass: "bg-destructive/10 text-destructive"
    }
  ];
  const pendingPriorities = [
    {
      label: "Productos bajo stock mínimo",
      detail: getPriorityDetail(alertMetricStatus, criticalProductCount, "producto", "productos"),
      dotClass: "bg-warning",
      path: "/alerts"
    },
    {
      label: "Lotes próximos a vencer",
      detail: getPriorityDetail(alertMetricStatus, expiringLotCount, "lote", "lotes"),
      dotClass: "bg-destructive",
      path: "/alerts"
    },
    {
      label: isAdministrative ? "Cajas pendientes de revisión" : "Estado de mi caja",
      detail: isAdministrative ? "Consulta las cajas abiertas y cerradas" : "Verifica tu caja antes de cobrar",
      dotClass: "bg-info",
      path: isAdministrative ? "/supervision" : "/cash"
    }
  ];

  return (
    <section className="grid gap-5 lg:gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">{formatOperationalDate(new Date())}</span>
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[1.75rem]">Resumen del día</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Revisa las tareas que requieren atención.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/alerts")}><AlertTriangle aria-hidden="true" />Revisar alertas</Button>
          <Button onClick={() => navigate(primaryAction.path)}>
            <PrimaryActionIcon aria-hidden="true" />
            {primaryAction.label}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">{item.title}</CardTitle>
                <CardAction><span className={`flex size-8 items-center justify-center rounded-lg ${item.toneClass}`}><Icon aria-hidden="true" className="size-4" /></span></CardAction>
              </CardHeader>
              <CardContent className="px-4">
                <p className="tabular-nums text-2xl font-semibold tracking-[-0.025em]">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Card>
          <CardHeader><CardTitle>Prioridades</CardTitle><CardDescription>Revisa estos puntos durante el turno.</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            {pendingPriorities.map((item) => (
              <button className="group flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3 text-left transition-colors hover:border-primary/25 hover:bg-accent/35" key={item.label} type="button" onClick={() => navigate(item.path)}>
                <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${item.dotClass}`} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{item.label}</span><span className="block text-xs text-muted-foreground">{item.detail}</span></span>
                <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mi caja</CardTitle><CardDescription>Estado de la caja que usarás para cobrar.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {health.status === "error" ? <HealthAlert status={health.status} /> : null}
            <div className="flex items-center gap-3 rounded-lg bg-muted/55 p-3">
              <WalletCards aria-hidden="true" className="size-4 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Estado de caja</p>
                <p className="text-xs text-muted-foreground">
                  {cash.currentStatus === "loading" || cash.currentStatus === "idle"
                    ? "Verificando estado…"
                    : hasOpenCash
                      ? `${cash.current.cashSession?.correlativeCode ?? "Caja"} abierta y lista para cobrar`
                      : "Sin caja abierta para el turno actual"}
                </p>
              </div>
              <Button className="ml-auto" size="sm" variant={hasOpenCash ? "outline" : "default"} onClick={() => navigate("/cash")}>
                {hasOpenCash ? "Ver caja" : "Abrir caja"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Accesos rápidos</CardTitle><CardDescription>Empieza una tarea frecuente.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visibleQuickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm" key={action.path} type="button" onClick={() => navigate(action.path)}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon aria-hidden="true" className="size-4" /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold">{action.label}</span><span className="block truncate text-xs text-muted-foreground">{action.description}</span></span>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}

function countUniqueProducts(alerts: PharmacyAlert[], types: AlertType[]) {
  return new Set(alerts.filter((alert) => types.includes(alert.type)).map((alert) => alert.productId)).size;
}

function formatOperationalDate(date: Date) {
  const formattedDate = operationalDateFormatter.format(date);
  return `${formattedDate.charAt(0).toUpperCase()}${formattedDate.slice(1)}`;
}

function toDashboardMetricStatus(status: ReturnType<typeof useDashboardSummary>["alerts"]["status"]): DashboardMetricStatus {
  return status;
}

function getMetricValue(status: DashboardMetricStatus, successValue: string) {
  if (status === "success") {
    return successValue;
  }

  if (status === "loading" || status === "idle") {
    return "…";
  }

  return "—";
}

function getMetricDetail(status: DashboardMetricStatus, successDetail: string, unavailableDetail = "No disponible para este rol") {
  if (status === "success") {
    return successDetail;
  }

  if (status === "loading" || status === "idle") {
    return "Actualizando datos…";
  }

  return status === "unavailable" ? unavailableDetail : "No se pudo actualizar";
}

function getPriorityDetail(status: DashboardMetricStatus, count: number, singular: string, plural: string) {
  if (status === "success") {
    return count === 0 ? "Sin alertas activas" : `${count} ${count === 1 ? singular : plural} requieren revisión`;
  }

  return status === "error" ? "No se pudieron actualizar las alertas" : "Actualizando alertas…";
}

type HealthStatus = ReturnType<typeof useHealthStatus>["status"];

function HealthAlert({ status }: { status: HealthStatus }) {
  if (status === "error") {
    return <Alert variant="destructive"><Activity aria-hidden="true" /><AlertTitle>Sin conexión</AlertTitle><AlertDescription>No registres operaciones hasta recuperar la conexión.</AlertDescription></Alert>;
  }

  return null;
}
