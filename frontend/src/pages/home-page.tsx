import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  Layers3,
  PackageCheck,
  RefreshCw,
  Server,
  ShieldCheck
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHealthStatus } from "../modules/health";

const stackItems = [
  { name: "API", detail: "Servicio Express", state: "Lista", icon: Server },
  { name: "Base de datos", detail: "Almacenamiento PostgreSQL", state: "Lista", icon: Database },
  { name: "Contratos", detail: "Esquemas compartidos de Zod", state: "Listos", icon: ShieldCheck }
];

const activityRows = [
  { event: "Estructura de interfaz", owner: "Interfaz", status: "Actualizada" },
  { event: "Registro de componentes", owner: "shadcn/ui", status: "Instalado" },
  { event: "Ruta de salud", owner: "Servidor", status: "Monitoreada" }
];

export function HomePage() {
  const health = useHealthStatus();
  const isOnline = health.status === "success";
  const readiness = isOnline ? 100 : health.status === "loading" ? 56 : 32;

  return (
    <section className="grid gap-6">
      <Card>
        <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <Badge variant="secondary">Panel base</Badge>
            <CardTitle className="text-2xl sm:text-3xl">Espacio de trabajo del punto de venta</CardTitle>
            <CardDescription className="max-w-2xl">
              Superficie de control con shadcn/ui para la interfaz, el servidor, la base de datos y los contratos compartidos.
            </CardDescription>
          </div>
          <CardAction className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Actualizar estado" size="icon" variant="outline">
                  <RefreshCw aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Actualizar estado</TooltipContent>
            </Tooltip>
            <Button>
              <PackageCheck aria-hidden="true" />
              Componentes listos
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {stackItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.name} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="size-4" />
                    {item.name}
                  </CardTitle>
                  <CardDescription>{item.detail}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="outline">{item.state}</Badge>
                  <Switch checked disabled aria-label={`Preparación de ${item.name}`} />
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Resumen operativo</CardTitle>
            <CardDescription>Componentes de interfaz instalados para el espacio principal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="status">
              <TabsList>
                <TabsTrigger value="status">
                  <Activity aria-hidden="true" />
                  Estado
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <Layers3 aria-hidden="true" />
                  Actividad
                </TabsTrigger>
              </TabsList>
              <TabsContent className="space-y-4" value="status">
                <HealthAlert status={health.status} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Preparación del espacio</span>
                    <Badge variant={isOnline ? "default" : "secondary"}>{readiness}%</Badge>
                  </div>
                  <Progress value={readiness} />
                </div>
                {health.status === "loading" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : null}
              </TabsContent>
              <TabsContent value="activity">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityRows.map((row) => (
                      <TableRow key={row.event}>
                        <TableCell>{row.event}</TableCell>
                        <TableCell>{row.owner}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salud del servidor</CardTitle>
            <CardDescription>Respuesta en vivo de la ruta de salud.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>UI</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>API</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>BD</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>3</AvatarGroupCount>
            </AvatarGroup>
            <Separator />
            <HealthDetails
              status={health.status}
              error={health.error ?? undefined}
              version={health.data?.version}
              timestamp={health.data?.timestamp}
            />
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
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>Servidor en línea</AlertTitle>
        <AlertDescription>La interfaz está recibiendo una respuesta válida del servicio.</AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Servidor no disponible</AlertTitle>
        <AlertDescription>Inicia el servicio API y revisa la URL base configurada.</AlertDescription>
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

type HealthDetailsProps = {
  status: HealthStatus;
  error?: string;
  version?: string;
  timestamp?: string;
};

function HealthDetails({ status, error, version, timestamp }: HealthDetailsProps) {
  return (
    <Accordion defaultValue="service" type="single" collapsible>
      <AccordionItem value="service">
        <AccordionTrigger>Estado del servicio</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <Badge variant={status === "error" ? "destructive" : "secondary"}>{getHealthStatusLabel(status)}</Badge>
            <p className="text-sm text-muted-foreground">{error ?? `Versión ${version ?? "pendiente"}`}</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="timestamp">
        <AccordionTrigger>Última respuesta</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-muted-foreground">{timestamp ?? "Aún no se recibió una marca de tiempo."}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function getHealthStatusLabel(status: HealthStatus) {
  const labels: Record<HealthStatus, string> = {
    error: "Error",
    loading: "Cargando",
    success: "Correcto"
  };

  return labels[status];
}
