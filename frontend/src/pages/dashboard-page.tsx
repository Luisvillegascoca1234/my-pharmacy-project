import { Activity, AlertTriangle, Boxes, CheckCircle2, Clock3, ReceiptText, Server, ShoppingCart, Store } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useHealthStatus } from "@/modules/health";

const summaryCards = [
  {
    title: "Ventas de hoy",
    value: "0",
    detail: "Listo para conectar el POS",
    icon: Store
  },
  {
    title: "Stock crítico",
    value: "0",
    detail: "Pendiente de inventario",
    icon: Boxes
  },
  {
    title: "Compras abiertas",
    value: "0",
    detail: "Borradores y recepción",
    icon: ShoppingCart
  },
  {
    title: "Facturas observadas",
    value: "0",
    detail: "Estados SIAT iniciales",
    icon: ReceiptText
  }
];

const alertItems = ["Lotes próximos a vencer", "Productos sin precio", "Caja abierta sin cerrar"];

export function DashboardPage() {
  const health = useHealthStatus();
  const isOnline = health.status === "success";
  const readiness = isOnline ? 100 : health.status === "loading" ? 56 : 32;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3">
        <Badge className="w-fit" variant="secondary">
          Consola de farmacia
        </Badge>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Dashboard operativo</h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Vista inicial para ventas, inventario, compras, caja, facturación y alertas de una sola sucursal.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Preparación del sistema</CardTitle>
            <CardDescription>Estado base para conectar módulos funcionales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <HealthAlert status={health.status} />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Preparación técnica</span>
                <Badge variant={isOnline ? "default" : "secondary"}>{readiness}%</Badge>
              </div>
              <Progress value={readiness} />
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-3">
              {["Contratos compartidos", "Autenticación", "Sidebar modular"].map((label) => (
                <div key={label} className="rounded-md border bg-muted/30 p-3 text-sm">
                  <CheckCircle2 aria-hidden="true" className="mb-2 size-4 text-muted-foreground" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas operativas</CardTitle>
            <CardDescription>Se conectarán al inventario, caja y SIAT.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {alertItems.map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm">
                  <AlertTriangle aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

type HealthStatus = ReturnType<typeof useHealthStatus>["status"];

type HealthAlertProps = {
  status: HealthStatus;
};

function HealthAlert({ status }: HealthAlertProps) {
  if (status === "success") {
    return (
      <Alert>
        <Server aria-hidden="true" />
        <AlertTitle>Servidor en línea</AlertTitle>
        <AlertDescription>La interfaz está recibiendo una respuesta válida del servicio.</AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <Activity aria-hidden="true" />
        <AlertTitle>Servidor no disponible</AlertTitle>
        <AlertDescription>Revisa el servicio API cuando vayas a validar datos en vivo.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Clock3 aria-hidden="true" />
      <AlertTitle>Revisando servidor</AlertTitle>
      <AlertDescription>Esperando la respuesta de la ruta de salud.</AlertDescription>
    </Alert>
  );
}

