import type { AuditDataErrorCode, AuditLog, AuditRequestStatus } from "@/modules/audit";
import type { ReactNode } from "react";
import { administrationNavigation, ContextNavigation } from "@/components/context-navigation";
import {
  AlertCircle,
  ChevronDown,
  Database,
  FileSearch,
  History,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  UserRound
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_DEFAULT_PAGE_SIZE, useAudit } from "@/modules/audit";

const auditErrorMessages: Record<AuditDataErrorCode, string> = {
  forbidden: "No tienes permiso para consultar la auditoría.",
  "session-invalid": "Tu sesión venció. Vuelve a iniciar sesión.",
  unknown: "No se pudo cargar la auditoría. Intenta nuevamente.",
  validation: "Revisa las fechas y los filtros avanzados."
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/La_Paz"
});

const pageSizeOptions = [10, AUDIT_DEFAULT_PAGE_SIZE, 50];
const auditActionOptions = [
  ["AUTH_LOGIN_SUCCESS", "Inicio de sesión exitoso"],
  ["AUTH_LOGIN_FAILURE", "Inicio de sesión fallido"],
  ["AUTH_LOGOUT", "Cierre de sesión"],
  ["CASH_SESSION_OPENED", "Caja abierta"],
  ["CASH_SESSION_CLOSED", "Caja cerrada"],
  ["SALE_CONFIRMED", "Venta confirmada"],
  ["SALE_CANCELLED", "Venta anulada"],
  ["SALE_RETURNED", "Venta devuelta"],
  ["PENDING_CART_CREATED", "Venta guardada"],
  ["PENDING_CART_UPDATED", "Venta guardada actualizada"],
  ["PENDING_CART_DISCARDED", "Venta guardada descartada"],
  ["PENDING_CART_CONVERTED", "Venta guardada cobrada"],
  ["PURCHASE_CREATED", "Compra creada"],
  ["PURCHASE_UPDATED", "Compra actualizada"],
  ["PURCHASE_RECEIVED", "Compra recibida"],
  ["PURCHASE_CANCELLED", "Compra anulada"],
  ["SUPPLIER_CREATED", "Proveedor creado"],
  ["SUPPLIER_UPDATED", "Proveedor actualizado"],
  ["PREPARED_INVOICE_CREATED", "Comprobante preparado"],
  ["PREPARED_INVOICE_CANCELLED", "Comprobante cancelado"],
  ["CSV_EXPORT_DOWNLOADED", "Archivo CSV descargado"],
  ["STOCK_PLANNING_FILE_GENERATED", "Archivo técnico de reposición generado"],
  ["PRODUCT_STOCK_PLANNING_CONFIGURATION_UPDATED", "Criterio de compra actualizado"],
  ["STOCK_PLANNING_GLOBAL_CONFIGURATION_UPDATED", "Configuración de reposición actualizada"],
  ["STOCK_PLANNING_MANUAL_RECALCULATION_REQUESTED", "Actualización de recomendaciones solicitada"],
  ["DEVELOPMENT_SEED_COMPLETED", "Datos de prueba cargados"]
] as const;

const auditActionLabels = Object.fromEntries(auditActionOptions) as Record<string, string>;

const auditEntityLabels: Record<string, string> = {
  auth: "Inicio de sesión",
  cash_session: "Caja",
  export: "Archivo descargado",
  prepared_invoice: "Comprobante interno",
  purchase: "Compra",
  pending_cart: "Venta guardada",
  sale: "Venta",
  seed: "Datos de prueba",
  stock_planning_execution: "Cálculo de reposición",
  supplier: "Proveedor",
  user: "Usuario"
};

export function AuditPage() {
  const audit = useAudit();
  const isLoading = audit.auditLogsStatus === "loading";
  const visibleError = audit.error ? auditErrorMessages[audit.error.code] : null;
  const paginationStart = audit.pagination.total === 0 ? 0 : (audit.pagination.page - 1) * audit.pagination.pageSize + 1;
  const paginationEnd = Math.min(audit.pagination.page * audit.pagination.pageSize, audit.pagination.total);

  function clearFilters() {
    audit.setAction("");
    audit.setActorUserId("");
    audit.setEntityType("");
    audit.setEntityId("");
    audit.setFromDate("");
    audit.setToDate("");
    audit.selectAuditLog(null);
    audit.setPage(1);
  }

  if (!audit.canReadAudit) {
    return (
      <section className="mx-auto grid max-w-3xl gap-5">
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Acceso no autorizado</AlertTitle>
          <AlertDescription>No tienes permiso para consultar la auditoría.</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <ContextNavigation ariaLabel="Opciones de administración" items={administrationNavigation} />
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Auditoría</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Consulta quién realizó una acción, cuándo ocurrió y qué registro cambió.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={isLoading} type="button" variant="outline" onClick={clearFilters}>
            <RotateCcw aria-hidden="true" />
            Limpiar filtros
          </Button>
          <Button disabled={isLoading} type="button" onClick={() => void audit.loadAuditLogs()}>
            {isLoading ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
            Recargar
          </Button>
        </div>
      </div>

      {visibleError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudo consultar la auditoría</AlertTitle>
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Buscar eventos</CardTitle>
          <CardDescription>Los eventos más recientes aparecen primero.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <AuditField description="Tipo de operación registrada." label="Acción">
              <Select disabled={isLoading} value={audit.action || "all"} onValueChange={(value) => audit.setAction(value === "all" ? "" : value)}>
                <SelectTrigger><SelectValue placeholder="Todas las acciones" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {auditActionOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </AuditField>
            <AuditField description="Primer día que quieres consultar." label="Desde">
              <Input
                disabled={isLoading}
                type="date"
                value={audit.fromDate}
                onChange={(event) => audit.setFromDate(event.currentTarget.value)}
              />
            </AuditField>
            <AuditField description="Último día que quieres consultar." label="Hasta">
              <Input
                disabled={isLoading}
                type="date"
                value={audit.toDate}
                onChange={(event) => audit.setToDate(event.currentTarget.value)}
              />
            </AuditField>
          </div>
          <Collapsible className="group/technical">
            <CollapsibleTrigger asChild>
              <Button className="w-fit" type="button" variant="ghost">
                Búsqueda avanzada
                <ChevronDown aria-hidden="true" className="transition-transform group-data-[state=open]/technical:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid gap-3 rounded-lg border bg-muted/15 p-4 md:grid-cols-3">
                <AuditField description="Identificador interno del usuario." label="ID de usuario">
                  <Input disabled={isLoading} placeholder="UUID de usuario" value={audit.actorUserId} onChange={(event) => audit.setActorUserId(event.currentTarget.value)} />
                </AuditField>
                <AuditField description="Tipo interno del registro afectado." label="Tipo de registro">
                  <Input disabled={isLoading} placeholder="sale, purchase, export..." value={audit.entityType} onChange={(event) => audit.setEntityType(event.currentTarget.value)} />
                </AuditField>
                <AuditField description="Identificador interno del registro afectado." label="ID de registro">
                  <Input disabled={isLoading} placeholder="UUID o referencia" value={audit.entityId} onChange={(event) => audit.setEntityId(event.currentTarget.value)} />
                </AuditField>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Eventos auditados</CardTitle>
              <CardDescription>
                {paginationStart}-{paginationEnd} de {audit.pagination.total} eventos. Página {audit.pagination.page} de{" "}
                {Math.max(audit.pagination.totalPages, 1)}.
              </CardDescription>
            </div>
            <PageSizeSelect disabled={isLoading} pageSize={audit.pagination.pageSize} onPageSizeChange={audit.setPageSize} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <AuditState status={audit.auditLogsStatus} />

          {audit.auditLogs.length > 0 ? (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="w-28 text-right">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audit.auditLogs.map((log) => (
                    <AuditLogTableRow
                      key={log.id}
                      isExpanded={audit.selectedAuditLogId === log.id}
                      log={log}
                      onToggle={() => audit.selectAuditLog(audit.selectedAuditLogId === log.id ? null : log.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          <PaginationFooter
            disabled={isLoading}
            page={audit.pagination.page}
            total={audit.pagination.total}
            totalPages={audit.pagination.totalPages}
            onNext={() => audit.setPage(audit.pagination.page + 1)}
            onPrevious={() => audit.setPage(audit.pagination.page - 1)}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function AuditField({
  children,
  description,
  label
}: {
  children: ReactNode;
  description: string;
  label: string;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {children}
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}

function PageSizeSelect({
  disabled,
  pageSize,
  onPageSizeChange
}: {
  disabled: boolean;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">Eventos por página</span>
      <Select disabled={disabled} value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option} eventos
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AuditLogTableRow({
  isExpanded,
  log,
  onToggle
}: {
  isExpanded: boolean;
  log: AuditLog;
  onToggle: () => void;
}) {
  const actorLabel = getActorLabel(log);
  const entityLabel = getEntityLabel(log);
  const resultLabel = getResultLabel(log.metadata);
  const metadataText = formatMetadata(log.metadata);

  return (
    <>
      <TableRow aria-expanded={isExpanded}>
        <TableCell className="min-w-56 whitespace-normal">
          <p className="font-medium text-foreground">{formatAction(log.action)}</p>
        </TableCell>
        <TableCell className="min-w-52 whitespace-normal">
          <p className="font-medium text-foreground">{actorLabel}</p>
        </TableCell>
        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
        <TableCell className="min-w-48 whitespace-normal">
          <p className="font-medium text-foreground">{entityLabel}</p>
        </TableCell>
        <TableCell>
          <Badge variant={resultLabel === "Error" ? "destructive" : "secondary"}>{resultLabel}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button size="sm" type="button" variant="outline" onClick={onToggle}>
            <ChevronDown aria-hidden="true" className={isExpanded ? "rotate-180 transition-transform" : "transition-transform"} />
            {isExpanded ? "Ocultar" : "Ver"}
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded ? (
        <TableRow>
          <TableCell className="whitespace-normal bg-muted/20 p-0" colSpan={6}>
            <Collapsible open>
              <CollapsibleContent>
                <div className="grid gap-4 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <MetadataSummary icon={<History aria-hidden="true" />} label="Código de acción" value={log.action} />
                    <MetadataSummary icon={<UserRound aria-hidden="true" />} label="IP" value={log.ipAddress ?? "No registrada"} />
                    <MetadataSummary
                      icon={<Database aria-hidden="true" />}
                      label="Agente"
                      value={log.userAgent ?? "No registrado"}
                    />
                  </div>
                  <Separator />
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-foreground">Datos técnicos</p>
                    <pre className="max-h-[520px] overflow-auto rounded-md border bg-background p-3 text-xs leading-5 text-foreground whitespace-pre-wrap break-all">
                      {metadataText}
                    </pre>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function MetadataSummary({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border bg-background p-3 text-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block break-all font-medium text-foreground">{value}</span>
      </span>
    </div>
  );
}

function AuditState({ status }: { status: AuditRequestStatus }) {
  if (status === "loading") {
    return (
      <div className="flex min-h-20 items-center justify-center gap-2 rounded-md border bg-muted/20 text-sm text-muted-foreground">
        <Spinner />
        Cargando eventos de auditoría...
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <Alert variant="destructive">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Permiso insuficiente</AlertTitle>
        <AlertDescription>No tienes permiso para consultar la auditoría.</AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>No se pudo cargar la auditoría</AlertTitle>
        <AlertDescription>Revisa los filtros y vuelve a intentar la consulta.</AlertDescription>
      </Alert>
    );
  }

  if (status === "empty") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileSearch aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Sin eventos auditados</EmptyTitle>
          <EmptyDescription>No hay registros disponibles para los filtros actuales.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return null;
}

function PaginationFooter({
  disabled,
  page,
  total,
  totalPages,
  onNext,
  onPrevious
}: {
  disabled: boolean;
  page: number;
  total: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Página {page} de {Math.max(totalPages, 1)} · {total} eventos
      </span>
      <div className="flex gap-2">
        <Button disabled={disabled || page <= 1} size="sm" type="button" variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button disabled={disabled || page >= totalPages} size="sm" type="button" variant="outline" onClick={onNext}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}

function getActorLabel(log: AuditLog) {
  if (!log.actorUser) {
    return "Sistema";
  }

  return log.actorUser.fullName ?? log.actorUser.email ?? "Usuario sin nombre";
}

function getEntityLabel(log: AuditLog) {
  if (!log.entityType) {
    return "Registro no identificado";
  }

  return auditEntityLabels[log.entityType.toLowerCase()] ?? formatAction(log.entityType);
}

function getResultLabel(metadata: AuditLog["metadata"]) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "Completado";
  }

  const status = getObjectValue(metadata, "status") ?? getObjectValue(metadata, "result") ?? getObjectValue(metadata, "outcome");

  if (typeof status !== "string") {
    return "Completado";
  }

  const normalizedStatus = status.toLowerCase();

  if (["error", "failed", "failure", "rejected"].includes(normalizedStatus)) {
    return "Error";
  }

  if (["success", "ok", "completed", "accepted"].includes(normalizedStatus)) {
    return "Exitoso";
  }

  return formatAction(status);
}

function getObjectValue(value: object, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key) ? (value as Record<string, unknown>)[key] : undefined;
}

function formatMetadata(metadata: AuditLog["metadata"]) {
  if (metadata === undefined || metadata === null || metadata === "") {
    return "Sin datos técnicos.";
  }

  if (typeof metadata === "object") {
    return JSON.stringify(metadata, null, 2);
  }

  return String(metadata);
}

function formatAction(value: string) {
  if (auditActionLabels[value]) {
    return auditActionLabels[value];
  }

  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
