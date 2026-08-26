import { isFeatureAllowed } from "@pharmacy-pos/shared";
import type { Alert as InventoryAlert } from "@/modules/alerts";
import { AlertCircle, AlertTriangle, ArrowRight, Bell, CalendarClock, PackageX, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlerts } from "@/modules/alerts";
import { selectAuthUser, useAuthStore } from "@/modules/auth";

const alertTypeLabels: Record<InventoryAlert["type"], string> = {
  expired: "Vencido",
  low_stock: "Stock bajo",
  near_expiration: "Próximo a vencer",
  out_of_stock: "Agotado"
};

const severityLabels: Record<InventoryAlert["severity"], string> = {
  critical: "Crítica",
  info: "Informativa",
  warning: "Preventiva"
};

const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 4 });

export function AlertsPage() {
  const navigate = useNavigate();
  const alerts = useAlerts();
  const user = useAuthStore(selectAuthUser);
  const canPlanStock = isFeatureAllowed(user?.role.name, "stockPlanning");
  const isLoading = alerts.status === "loading";

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Alertas</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Revisa faltantes de stock y productos próximos a vencer.
            </p>
          </div>
        </div>
        <Button disabled={isLoading} variant="outline" onClick={() => void alerts.reload()}>
          {isLoading ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
          Actualizar
        </Button>
      </div>

      {alerts.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudieron cargar alertas</AlertTitle>
          <AlertDescription>{alerts.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Críticas" value={alerts.items.filter((item) => item.severity === "critical").length} />
        <Metric title="Preventivas" value={alerts.items.filter((item) => item.severity === "warning").length} />
        <Metric title="Generadas" value={alerts.generatedAt ? formatDateTime(alerts.generatedAt) : "Pendiente"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas activas</CardTitle>
          <CardDescription>Los próximos vencimientos incluyen los siguientes 30 días.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Alerta</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="text-right">Siguiente paso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant={item.severity === "critical" ? "destructive" : "secondary"}>{severityLabels[item.severity]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.internalCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {getAlertIcon(item.type)}
                        <div>
                          <p className="font-medium">{alertTypeLabels[item.type]}</p>
                          <p className="text-xs text-muted-foreground">{item.message}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.batchNumber ?? "No aplica"}</TableCell>
                    <TableCell>{formatDate(item.expirationDate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {quantityFormatter.format(item.availableQuantity)} {item.baseUnitAbbreviation}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => navigate(getAlertDestination(item, canPlanStock))}
                      >
                        {canPlanStock && (item.type === "low_stock" || item.type === "out_of_stock")
                          ? "Planificar compra"
                          : "Ver existencias"}
                        <ArrowRight aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {alerts.items.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-56" colSpan={7}>
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Spinner />
                          Calculando alertas...
                        </div>
                      ) : (
                        <Empty className="border-0">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Bell aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>Sin alertas activas</EmptyTitle>
                            <EmptyDescription>No hay faltantes ni vencimientos que requieran atención.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      )}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Metric({ title, value }: { title: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function getAlertIcon(type: InventoryAlert["type"]) {
  const className = "mt-0.5 size-4 text-muted-foreground";

  if (type === "expired" || type === "near_expiration") {
    return <CalendarClock aria-hidden="true" className={className} />;
  }

  if (type === "out_of_stock") {
    return <PackageX aria-hidden="true" className={className} />;
  }

  return <AlertTriangle aria-hidden="true" className={className} />;
}

function formatDate(value?: string) {
  if (!value) {
    return "No aplica";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/La_Paz"
  }).format(new Date(value));
}

function getAlertDestination(item: InventoryAlert, canPlanStock: boolean) {
  const search = encodeURIComponent(item.internalCode || item.productName);

  if (canPlanStock && (item.type === "low_stock" || item.type === "out_of_stock")) {
    return `/stock-planning?search=${search}`;
  }

  return `/batches?search=${search}`;
}
