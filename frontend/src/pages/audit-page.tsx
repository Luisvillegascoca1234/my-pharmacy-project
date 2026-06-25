import type { AuditDataErrorCode, AuditLog, AuditRequestStatus } from "@/modules/audit";
import type { ReactNode } from "react";
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
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_DEFAULT_PAGE_SIZE, useAudit } from "@/modules/audit";

const auditErrorMessages: Record<AuditDataErrorCode, string> = {
  forbidden: "Tu usuario no tiene permiso para consultar auditoria sensible.",
  "session-invalid": "Tu sesion vencio o ya no permite consultar auditoria. Vuelve a iniciar sesion.",
  unknown: "No se pudo cargar el registro de auditoria. Intenta nuevamente.",
  validation: "Revisa los filtros. El rango de fechas o algun identificador no cumple el contrato esperado."
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/La_Paz"
});

const pageSizeOptions = [10, AUDIT_DEFAULT_PAGE_SIZE, 50];

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
          <AlertDescription>Solo superadministracion puede consultar auditoria sensible.</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Auditoria sensible
          </Badge>
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Registro de auditoria</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Investigacion de acciones sensibles por actor, entidad, fecha y evidencia tecnica, separada de reportes
              operativos generales.
            </p>
          </div>
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
          <AlertTitle>No se pudo consultar auditoria</AlertTitle>
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Filtros de investigacion</CardTitle>
          <CardDescription>La consulta se ordena por fecha descendente desde el servicio de auditoria.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <AuditField description="Nombre tecnico del evento auditado." label="Accion">
              <Input
                disabled={isLoading}
                placeholder="SALE_CANCELLED, CSV_EXPORT..."
                value={audit.action}
                onChange={(event) => audit.setAction(event.currentTarget.value)}
              />
            </AuditField>
            <AuditField description="ID del usuario que ejecuto la accion." label="Actor">
              <Input
                disabled={isLoading}
                placeholder="UUID de usuario"
                value={audit.actorUserId}
                onChange={(event) => audit.setActorUserId(event.currentTarget.value)}
              />
            </AuditField>
            <AuditField description="Tipo de recurso afectado por la accion." label="Entidad">
              <Input
                disabled={isLoading}
                placeholder="sale, invoice, export..."
                value={audit.entityType}
                onChange={(event) => audit.setEntityType(event.currentTarget.value)}
              />
            </AuditField>
            <AuditField description="ID del recurso afectado." label="Entidad afectada">
              <Input
                disabled={isLoading}
                placeholder="UUID o referencia estable"
                value={audit.entityId}
                onChange={(event) => audit.setEntityId(event.currentTarget.value)}
              />
            </AuditField>
            <AuditField description="Fecha inicial ISO." label="Desde">
              <Input
                disabled={isLoading}
                type="date"
                value={audit.fromDate}
                onChange={(event) => audit.setFromDate(event.currentTarget.value)}
              />
            </AuditField>
            <AuditField description="Fecha final ISO." label="Hasta">
              <Input
                disabled={isLoading}
                type="date"
                value={audit.toDate}
                onChange={(event) => audit.setToDate(event.currentTarget.value)}
              />
            </AuditField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Eventos auditados</CardTitle>
              <CardDescription>
                {paginationStart}-{paginationEnd} de {audit.pagination.total} evento(s). Pagina {audit.pagination.page} de{" "}
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
                    <TableHead>Actor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="w-28 text-right">Metadata</TableHead>
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
      <span className="text-xs text-muted-foreground">Tamano de pagina</span>
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
          <div className="space-y-1">
            <p className="font-medium text-foreground">{formatAction(log.action)}</p>
            <p className="text-xs text-muted-foreground">ID: {log.id}</p>
          </div>
        </TableCell>
        <TableCell className="min-w-52 whitespace-normal">
          <div className="space-y-1">
            <p className="font-medium text-foreground">{actorLabel}</p>
            <p className="text-xs text-muted-foreground">{log.actorUserId ?? "Actor no registrado"}</p>
          </div>
        </TableCell>
        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
        <TableCell className="min-w-48 whitespace-normal">
          <div className="space-y-1">
            <p className="font-medium text-foreground">{entityLabel}</p>
            <p className="text-xs text-muted-foreground">{log.entityId ?? "Sin ID de entidad"}</p>
          </div>
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
                    <MetadataSummary icon={<History aria-hidden="true" />} label="Accion" value={log.action} />
                    <MetadataSummary icon={<UserRound aria-hidden="true" />} label="IP" value={log.ipAddress ?? "No registrada"} />
                    <MetadataSummary
                      icon={<Database aria-hidden="true" />}
                      label="Agente"
                      value={log.userAgent ?? "No registrado"}
                    />
                  </div>
                  <Separator />
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-foreground">Metadata completa</p>
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
        Cargando eventos de auditoria...
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <Alert variant="destructive">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Permiso insuficiente</AlertTitle>
        <AlertDescription>La sesion actual no tiene autorizacion para leer auditoria sensible.</AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>No se pudo cargar auditoria</AlertTitle>
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
        Pagina {page} de {Math.max(totalPages, 1)}. Total: {total} evento(s).
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
    return "Sistema o actor no disponible";
  }

  return log.actorUser.fullName ?? log.actorUser.email ?? "Actor sin nombre";
}

function getEntityLabel(log: AuditLog) {
  return log.entityType ? formatAction(log.entityType) : "Entidad no registrada";
}

function getResultLabel(metadata: AuditLog["metadata"]) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "Registrado";
  }

  const status = getObjectValue(metadata, "status") ?? getObjectValue(metadata, "result") ?? getObjectValue(metadata, "outcome");

  if (typeof status !== "string") {
    return "Registrado";
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
    return "Sin metadata registrada.";
  }

  if (typeof metadata === "object") {
    return JSON.stringify(metadata, null, 2);
  }

  return String(metadata);
}

function formatAction(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
