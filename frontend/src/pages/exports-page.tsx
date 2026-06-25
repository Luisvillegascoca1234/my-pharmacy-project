import type { CsvExportDataErrorCode, CsvExportFile, CsvExportRequestStatus } from "@/modules/exports";
import type { ReactNode } from "react";
import { AlertCircle, BadgeCheck, Download, FileDown, FileSpreadsheet, Info, RotateCcw, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  CSV_EXPORT_SEPARATOR,
  INVENTORY_MOVEMENTS_CSV_FILE_NAME,
  SALES_CSV_FILE_NAME,
  useExports
} from "@/modules/exports";

const errorMessages: Record<CsvExportDataErrorCode, string> = {
  forbidden: "Tu usuario no tiene permiso para descargar extracciones CSV auditadas.",
  "session-invalid": "Tu sesion vencio o ya no permite descargar extracciones CSV. Vuelve a iniciar sesion.",
  unknown: "No se pudo completar la descarga. Intenta nuevamente.",
  validation: "Revisa el rango de fechas. La fecha inicial no puede ser posterior a la fecha final."
};

export function ExportsPage() {
  const exportsState = useExports();
  const canOperate = exportsState.canDownloadExports;
  const visibleError = exportsState.error ? errorMessages[exportsState.error.code] : null;

  async function downloadSales() {
    const file = await exportsState.downloadSalesCsv();
    saveCsvFile(file);
  }

  async function downloadInventoryMovements() {
    const file = await exportsState.downloadInventoryMovementsCsv();
    saveCsvFile(file);
  }

  function clearSalesFilters() {
    exportsState.setSalesFromDate("");
    exportsState.setSalesToDate("");
    exportsState.clearSalesExport();
  }

  function clearInventoryMovementsFilters() {
    exportsState.setInventoryMovementsFromDate("");
    exportsState.setInventoryMovementsToDate("");
    exportsState.clearInventoryMovementsExport();
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Extracciones auditadas
          </Badge>
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Exportaciones CSV</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Descarga operativa de ventas y movimientos de inventario para analisis externo. Cada descarga genera registro de
              auditoria; las consultas visuales de reportes no se auditan como extraccion.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:w-[520px]">
          <ExportRule icon={<FileSpreadsheet aria-hidden="true" />} label={`Separador ${CSV_EXPORT_SEPARATOR}`} value="Regional" />
          <ExportRule icon={<Info aria-hidden="true" />} label="Fechas ISO" value="YYYY-MM-DD" />
        </div>
      </div>

      {!canOperate ? (
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Permiso insuficiente</AlertTitle>
          <AlertDescription>Solo administracion y superadministracion pueden descargar archivos CSV auditados.</AlertDescription>
        </Alert>
      ) : null}

      {visibleError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudo completar la descarga</AlertTitle>
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Registro de auditoria por descarga</AlertTitle>
        <AlertDescription>
          El archivo descargado queda asociado al usuario, direccion IP, agente de navegador y rango solicitado. Usa estas
          extracciones solo para conciliacion, respaldo operativo o analisis autorizado.
        </AlertDescription>
      </Alert>

      <div className="grid gap-5 xl:grid-cols-2">
        <ExportCard
          description="Ventas confirmadas, anuladas y devueltas con margen, caja, vendedor y fecha de confirmacion."
          disabled={!canOperate}
          fileName={SALES_CSV_FILE_NAME}
          fromDate={exportsState.salesFromDate}
          status={exportsState.salesExportStatus}
          title="Ventas POS"
          toDate={exportsState.salesToDate}
          onClear={clearSalesFilters}
          onDownload={() => void downloadSales()}
          onFromDateChange={exportsState.setSalesFromDate}
          onToDateChange={exportsState.setSalesToDate}
        />

        <ExportCard
          description="Movimientos de inventario por lote, producto, tipo, referencia, motivo y usuario asociado."
          disabled={!canOperate}
          fileName={INVENTORY_MOVEMENTS_CSV_FILE_NAME}
          fromDate={exportsState.inventoryMovementsFromDate}
          status={exportsState.inventoryMovementsExportStatus}
          title="Movimientos de inventario"
          toDate={exportsState.inventoryMovementsToDate}
          onClear={clearInventoryMovementsFilters}
          onDownload={() => void downloadInventoryMovements()}
          onFromDateChange={exportsState.setInventoryMovementsFromDate}
          onToDateChange={exportsState.setInventoryMovementsToDate}
        />
      </div>
    </section>
  );
}

type ExportCardProps = {
  description: string;
  disabled: boolean;
  fileName: string;
  fromDate: string;
  onClear: () => void;
  onDownload: () => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  status: CsvExportRequestStatus;
  title: string;
  toDate: string;
};

function ExportCard({
  description,
  disabled,
  fileName,
  fromDate,
  onClear,
  onDownload,
  onFromDateChange,
  onToDateChange,
  status,
  title,
  toDate
}: ExportCardProps) {
  const isLoading = status === "loading";

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge className="w-fit" variant={status === "success" ? "default" : status === "forbidden" || status === "error" ? "destructive" : "secondary"}>
            {getStatusLabel(status)}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <DateField disabled={disabled || isLoading} label="Desde" value={fromDate} onChange={onFromDateChange} />
          <DateField disabled={disabled || isLoading} label="Hasta" value={toDate} onChange={onToDateChange} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <InfoLine label="Archivo" value={fileName} />
          <Separator className="my-3" />
          <InfoLine label="Formato" value={`CSV UTF-8 con separador ${CSV_EXPORT_SEPARATOR} y fechas ISO`} />
        </div>

        <ExportState status={status} />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={disabled || isLoading} type="button" onClick={onDownload}>
            {isLoading ? <Spinner /> : <Download aria-hidden="true" />}
            Descargar CSV
          </Button>
          <Button disabled={isLoading} type="button" variant="outline" onClick={onClear}>
            <RotateCcw aria-hidden="true" />
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DateField({
  disabled,
  label,
  value,
  onChange
}: {
  disabled: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input disabled={disabled} type="date" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
      <FieldDescription>Opcional. Sin fecha se exporta todo el rango disponible.</FieldDescription>
    </Field>
  );
}

function ExportState({ status }: { status: CsvExportRequestStatus }) {
  if (status === "loading") {
    return (
      <StateBox>
        <Spinner />
        Preparando extraccion CSV auditada...
      </StateBox>
    );
  }

  if (status === "success") {
    return (
      <Alert>
        <BadgeCheck aria-hidden="true" />
        <AlertTitle>Descarga generada</AlertTitle>
        <AlertDescription>El archivo fue preparado y descargado con los filtros actuales.</AlertDescription>
      </Alert>
    );
  }

  if (status === "empty") {
    return (
      <Alert>
        <FileDown aria-hidden="true" />
        <AlertTitle>Archivo sin registros</AlertTitle>
        <AlertDescription>La descarga se genero, pero el rango actual no contiene filas operativas.</AlertDescription>
      </Alert>
    );
  }

  if (status === "forbidden") {
    return (
      <Alert variant="destructive">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Permiso insuficiente o sesion vencida</AlertTitle>
        <AlertDescription>La descarga fue rechazada sin romper la pantalla. Revisa tu sesion o permisos.</AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>No se pudo generar el CSV</AlertTitle>
        <AlertDescription>Revisa el rango ingresado o intenta nuevamente.</AlertDescription>
      </Alert>
    );
  }

  return (
    <StateBox>
      <FileDown aria-hidden="true" className="size-4" />
      Listo para descargar con los filtros actuales.
    </StateBox>
  );
}

function StateBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-16 items-center gap-2 rounded-md border bg-muted/20 px-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function ExportRule({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{value}</span>
      </span>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-medium text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}

function getStatusLabel(status: CsvExportRequestStatus) {
  const labels: Record<CsvExportRequestStatus, string> = {
    empty: "Sin filas",
    error: "Error",
    forbidden: "Restringido",
    idle: "Pendiente",
    loading: "Descargando",
    success: "Descargado"
  };

  return labels[status];
}

function saveCsvFile(file: CsvExportFile | null) {
  if (!file) {
    return;
  }

  const blob = new Blob([file.content], { type: file.contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = file.fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
