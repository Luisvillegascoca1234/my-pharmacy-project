import { type FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Ban,
  ClipboardList,
  Eye,
  FileSearch,
  FileText,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldAlert,
  XCircle
} from "lucide-react";
import type {
  BillingDataErrorCode,
  InvoiceableSaleSummary,
  PreparedInvoice,
  PreparedInvoiceEligibilityBlockReason,
  PreparedInvoiceStatus,
  PreparedInvoiceStatusFilter,
  PreparedInvoiceSummary
} from "@/modules/billing";
import { useBilling } from "@/modules/billing";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const moneyFormatter = new Intl.NumberFormat("es-BO", { currency: "BOB", maximumFractionDigits: 2, style: "currency" });
const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" });

const preparedStatusLabels: Record<PreparedInvoiceStatus, string> = {
  cancelled: "Cancelada",
  prepared: "Preparada"
};

const invoiceBlockLabels: Record<PreparedInvoiceEligibilityBlockReason, string> = {
  "active-invoice-exists": "La venta ya tiene un comprobante interno preparado activo.",
  "sale-cancelled": "La venta fue anulada y no puede prepararse como comprobante interno.",
  "sale-not-found": "No se encontró la venta solicitada.",
  "sale-returned": "La venta tiene devolución total y no puede prepararse como comprobante interno.",
  unknown: "La venta no cumple las reglas vigentes para preparar comprobante interno."
};

const errorMessages: Record<BillingDataErrorCode, string> = {
  "active-invoice-exists": "La venta ya cuenta con un comprobante interno preparado activo. Abre el detalle existente antes de crear otro.",
  "already-cancelled": "El comprobante interno preparado ya fue cancelado previamente.",
  forbidden: "Tu usuario no tiene permiso para operar comprobantes internos preparados.",
  "not-found": "No se encontró el comprobante interno preparado solicitado.",
  "sale-cancelled": "La venta fue anulada y no puede convertirse en comprobante interno preparado.",
  "sale-not-found": "No se encontró la venta seleccionada.",
  "sale-not-invoiceable": "La venta no cumple las reglas para preparar comprobante interno.",
  "sale-returned": "La venta tiene devolución total y no puede convertirse en comprobante interno preparado.",
  "session-invalid": "Tu sesión no permite operar comprobantes internos preparados. Vuelve a iniciar sesión.",
  unknown: "No se pudo completar la operación. Intenta nuevamente.",
  validation: "Revisa los datos ingresados antes de continuar."
};

const statusOptions: PreparedInvoiceStatusFilter[] = ["all", "prepared", "cancelled"];

export function InvoicesPage() {
  const billing = useBilling({ autoLoadInvoiceableSales: true, autoLoadPreparedInvoices: true });
  const [invoiceableSearchInput, setInvoiceableSearchInput] = useState(billing.invoiceableSearch);
  const [invoiceableSellerInput, setInvoiceableSellerInput] = useState(billing.invoiceableSellerUserId);
  const [preparedSearchInput, setPreparedSearchInput] = useState(billing.preparedInvoiceSearch);
  const [preparedSaleIdInput, setPreparedSaleIdInput] = useState(billing.preparedInvoiceSaleId);
  const [preparationSale, setPreparationSale] = useState<InvoiceableSaleSummary | null>(null);
  const [customerNitInput, setCustomerNitInput] = useState("0");
  const [customerBusinessNameInput, setCustomerBusinessNameInput] = useState("Consumidor final");
  const [fiscalNotesInput, setFiscalNotesInput] = useState("");
  const [preparationError, setPreparationError] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);
  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
  const isLoadingInvoiceableSales = billing.invoiceableSalesStatus === "loading";
  const isLoadingPreparedInvoices = billing.preparedInvoicesStatus === "loading";
  const isLoadingDetail = billing.detailStatus === "loading";
  const isPreparing = billing.prepareStatus === "loading";
  const isCancelling = billing.cancelStatus === "loading";
  const visibleError = billing.error ? errorMessages[billing.error.code] : null;
  const selectedInvoice = billing.selectedPreparedInvoice;
  const canOperate = billing.canUseBilling;
  const canCancelSelectedInvoice = Boolean(selectedInvoice && selectedInvoice.status === "prepared");

  const preparedSummary = useMemo(
    () => ({
      cancelled: billing.preparedInvoices.filter((invoice) => invoice.status === "cancelled").length,
      prepared: billing.preparedInvoices.filter((invoice) => invoice.status === "prepared").length,
      totalAmount: billing.preparedInvoices.reduce((total, invoice) => total + invoice.totalAmount, 0)
    }),
    [billing.preparedInvoices]
  );

  function applyInvoiceableFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    billing.setInvoiceableSearch(invoiceableSearchInput);
    billing.setInvoiceableSellerUserId(invoiceableSellerInput);
  }

  function clearInvoiceableFilters() {
    setInvoiceableSearchInput("");
    setInvoiceableSellerInput("");
    billing.setInvoiceableSearch("");
    billing.setInvoiceableSellerUserId("");
    billing.setInvoiceableFromDate("");
    billing.setInvoiceableToDate("");
  }

  function applyPreparedFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    billing.setPreparedInvoiceSearch(preparedSearchInput);
    billing.setPreparedInvoiceSaleId(preparedSaleIdInput);
  }

  function clearPreparedFilters() {
    setPreparedSearchInput("");
    setPreparedSaleIdInput("");
    billing.setPreparedInvoiceSearch("");
    billing.setPreparedInvoiceSaleId("");
    billing.setPreparedInvoiceFromDate("");
    billing.setPreparedInvoiceToDate("");
    billing.setPreparedInvoiceStatus("all");
  }

  function openPreparation(sale: InvoiceableSaleSummary) {
    billing.clearPreparation();
    setPreparationError(null);
    setPreparationSale(sale);
    setCustomerNitInput("0");
    setCustomerBusinessNameInput("Consumidor final");
    setFiscalNotesInput("");
  }

  async function submitPreparation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreparationError(null);

    if (!preparationSale) {
      setPreparationError("Selecciona una venta preparable.");
      return;
    }

    if (!preparationSale.canPrepareInvoice) {
      setPreparationError(getInvoiceBlockMessage(preparationSale));
      return;
    }

    const customerNit = customerNitInput.trim() || "0";
    const customerBusinessName = customerBusinessNameInput.trim() || "Consumidor final";
    const fiscalNotes = fiscalNotesInput.trim();

    const preparedInvoice = await billing.prepareInvoice({
      customerBusinessName,
      customerNit,
      fiscalNotes: fiscalNotes || undefined,
      saleId: preparationSale.id
    });

    if (preparedInvoice) {
      setPreparationSale(null);
      await billing.reloadInvoiceableSales();
      await billing.reloadPreparedInvoices();
    }
  }

  async function openPreparedInvoiceDetail(preparedInvoiceId: string) {
    billing.clearCancellation();
    setCancelReasonInput("");
    setCancelReasonError(null);
    billing.selectPreparedInvoice(preparedInvoiceId);
    await billing.loadPreparedInvoice(preparedInvoiceId);
  }

  function requestCancellation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCancelReasonError(null);

    if (!canCancelSelectedInvoice) {
      setCancelReasonError("Solo un comprobante interno preparado activo puede cancelarse.");
      return;
    }

    const normalizedReason = cancelReasonInput.trim();

    if (normalizedReason.length < 5 || normalizedReason.length > 500) {
      setCancelReasonError("El motivo debe tener entre 5 y 500 caracteres.");
      return;
    }

    setCancelDialogOpen(true);
  }

  async function confirmCancellation() {
    const cancelledInvoice = await billing.cancelSelectedPreparedInvoice({ cancelReason: cancelReasonInput.trim() });

    if (cancelledInvoice) {
      setCancelReasonInput("");
      setCancelDialogOpen(false);
      await billing.reloadPreparedInvoices();
      await billing.reloadInvoiceableSales();
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Documento interno no tributario
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Comprobantes internos preparados</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Preparación administrativa de comprobantes internos desde ventas POS. Esta pantalla no emite documentos tributarios SIAT, no genera CUF, QR fiscal ni envío al SIN.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[600px]">
          <Metric label="Preparadas" value={preparedSummary.prepared} />
          <Metric label="Canceladas" value={preparedSummary.cancelled} />
          <Metric label="Importe visible" value={formatMoney(preparedSummary.totalAmount)} />
        </div>
      </div>

      {!canOperate ? (
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Permiso insuficiente</AlertTitle>
          <AlertDescription>Solo administración y superadministración pueden preparar o cancelar comprobantes internos.</AlertDescription>
        </Alert>
      ) : null}

      {billing.lastPreparedInvoice && billing.prepareStatus === "success" ? (
        <Alert>
          <BadgeCheck aria-hidden="true" />
          <AlertTitle>Comprobante interno preparado</AlertTitle>
          <AlertDescription>
            {billing.lastPreparedInvoice.correlativeCode} quedó registrada como comprobante interno preparado para la venta{" "}
            {billing.lastPreparedInvoice.saleCorrelativeCode}.
          </AlertDescription>
        </Alert>
      ) : null}

      {billing.lastPreparedInvoice && billing.cancelStatus === "success" ? (
        <Alert>
          <XCircle aria-hidden="true" />
          <AlertTitle>Comprobante interno cancelado</AlertTitle>
          <AlertDescription>{billing.lastPreparedInvoice.correlativeCode} ahora figura como cancelada en el historial interno.</AlertDescription>
        </Alert>
      ) : null}

      {visibleError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudo completar la operación</AlertTitle>
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Ventas preparables</CardTitle>
                <CardDescription>Ventas POS elegibles para preparar comprobante interno, filtradas por texto, vendedor y fecha.</CardDescription>
              </div>
              <Button disabled={!canOperate || isLoadingInvoiceableSales} size="sm" type="button" variant="outline" onClick={() => void billing.reloadInvoiceableSales()}>
                {isLoadingInvoiceableSales ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
                Actualizar
              </Button>
            </div>

            <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_auto]" onSubmit={applyInvoiceableFilters}>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  disabled={!canOperate}
                  placeholder="Correlativo, NIT o texto de venta"
                  value={invoiceableSearchInput}
                  onChange={(event) => setInvoiceableSearchInput(event.currentTarget.value)}
                />
              </div>
              <Input
                disabled={!canOperate}
                type="date"
                value={billing.invoiceableFromDate}
                onChange={(event) => billing.setInvoiceableFromDate(event.currentTarget.value)}
              />
              <Input
                disabled={!canOperate}
                type="date"
                value={billing.invoiceableToDate}
                onChange={(event) => billing.setInvoiceableToDate(event.currentTarget.value)}
              />
              <Button disabled={!canOperate || isLoadingInvoiceableSales} type="submit">
                <Search aria-hidden="true" />
                Filtrar
              </Button>
            </form>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                disabled={!canOperate}
                placeholder="ID de vendedor"
                value={invoiceableSellerInput}
                onChange={(event) => setInvoiceableSellerInput(event.currentTarget.value)}
              />
              <Button disabled={!canOperate || isLoadingInvoiceableSales} type="button" variant="outline" onClick={clearInvoiceableFilters}>
                Limpiar filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[132px]">Venta POS</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="w-[130px]">Caja</TableHead>
                  <TableHead className="w-[138px]">Fecha</TableHead>
                  <TableHead className="w-[112px] text-right">Total</TableHead>
                  <TableHead className="w-[122px]">Estado</TableHead>
                  <TableHead className="w-[112px] text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.invoiceableSales.map((sale) => (
                  <InvoiceableSaleRow
                    key={sale.id}
                    disabled={!canOperate || isPreparing}
                    sale={sale}
                    onPrepare={() => openPreparation(sale)}
                    onOpenInvoice={
                      sale.activePreparedInvoiceId ? () => void openPreparedInvoiceDetail(sale.activePreparedInvoiceId as string) : undefined
                    }
                  />
                ))}
                {billing.invoiceableSales.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-64" colSpan={7}>
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{isLoadingInvoiceableSales ? <Spinner /> : <FileSearch aria-hidden="true" />}</EmptyMedia>
                          <EmptyTitle>{isLoadingInvoiceableSales ? "Cargando ventas" : "Sin ventas preparables"}</EmptyTitle>
                          <EmptyDescription>
                            {isLoadingInvoiceableSales
                              ? "Consultando ventas POS según permisos y filtros actuales."
                              : "Ajusta filtros o revisa si la venta ya fue anulada, devuelta o tiene un comprobante interno activo."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <PaginationControls
              disabled={!canOperate || isLoadingInvoiceableSales}
              page={billing.invoiceablePagination.page}
              totalPages={billing.invoiceablePagination.totalPages}
              total={billing.invoiceablePagination.total}
              onPrevious={() => billing.setInvoiceablePage(billing.invoiceablePagination.page - 1)}
              onNext={() => billing.setInvoiceablePage(billing.invoiceablePagination.page + 1)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Comprobantes internos preparados</CardTitle>
                <CardDescription>Listado administrativo por estado, correlativo interno, venta POS, texto y fechas.</CardDescription>
              </div>
              <Button disabled={!canOperate || isLoadingPreparedInvoices} size="sm" type="button" variant="outline" onClick={() => void billing.reloadPreparedInvoices()}>
                {isLoadingPreparedInvoices ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
                Actualizar
              </Button>
            </div>

            <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_142px_auto]" onSubmit={applyPreparedFilters}>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  disabled={!canOperate}
                  placeholder="Correlativo, NIT, razón social"
                  value={preparedSearchInput}
                  onChange={(event) => setPreparedSearchInput(event.currentTarget.value)}
                />
              </div>
              <Input
                disabled={!canOperate}
                type="date"
                value={billing.preparedInvoiceFromDate}
                onChange={(event) => billing.setPreparedInvoiceFromDate(event.currentTarget.value)}
              />
              <Input
                disabled={!canOperate}
                type="date"
                value={billing.preparedInvoiceToDate}
                onChange={(event) => billing.setPreparedInvoiceToDate(event.currentTarget.value)}
              />
              <NativeSelect
                disabled={!canOperate}
                value={billing.preparedInvoiceStatus}
                onChange={(event) => billing.setPreparedInvoiceStatus(event.currentTarget.value as PreparedInvoiceStatusFilter)}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Todos" : preparedStatusLabels[option]}
                  </option>
                ))}
              </NativeSelect>
              <Button disabled={!canOperate || isLoadingPreparedInvoices} type="submit">
                <Search aria-hidden="true" />
                Filtrar
              </Button>
            </form>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                disabled={!canOperate}
                placeholder="ID de venta"
                value={preparedSaleIdInput}
                onChange={(event) => setPreparedSaleIdInput(event.currentTarget.value)}
              />
              <Button disabled={!canOperate || isLoadingPreparedInvoices} type="button" variant="outline" onClick={clearPreparedFilters}>
                Limpiar filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[138px]">Comprobante</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[132px]">Venta POS</TableHead>
                  <TableHead className="w-[132px]">Fecha</TableHead>
                  <TableHead className="w-[112px] text-right">Total</TableHead>
                  <TableHead className="w-[110px]">Estado</TableHead>
                  <TableHead className="w-[86px] text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.preparedInvoices.map((invoice) => (
                  <PreparedInvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    isSelected={invoice.id === billing.selectedPreparedInvoiceId}
                    onOpen={() => void openPreparedInvoiceDetail(invoice.id)}
                  />
                ))}
                {billing.preparedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-64" colSpan={7}>
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{isLoadingPreparedInvoices ? <Spinner /> : <ReceiptText aria-hidden="true" />}</EmptyMedia>
                          <EmptyTitle>{isLoadingPreparedInvoices ? "Cargando comprobantes" : "Sin comprobantes internos preparados"}</EmptyTitle>
                          <EmptyDescription>
                            {isLoadingPreparedInvoices
                              ? "Consultando documentos internos según los filtros actuales."
                              : "Prepara un comprobante interno desde una venta elegible o ajusta los filtros del listado."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <PaginationControls
              disabled={!canOperate || isLoadingPreparedInvoices}
              page={billing.preparedInvoicePagination.page}
              totalPages={billing.preparedInvoicePagination.totalPages}
              total={billing.preparedInvoicePagination.total}
              onPrevious={() => billing.setPreparedInvoicePage(billing.preparedInvoicePagination.page - 1)}
              onNext={() => billing.setPreparedInvoicePage(billing.preparedInvoicePagination.page + 1)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <PreparationPanel
          canOperate={canOperate}
          customerBusinessName={customerBusinessNameInput}
          customerNit={customerNitInput}
          error={preparationError}
          fiscalNotes={fiscalNotesInput}
          isPreparing={isPreparing}
          sale={preparationSale}
          onBusinessNameChange={setCustomerBusinessNameInput}
          onCancel={() => {
            setPreparationSale(null);
            setPreparationError(null);
          }}
          onFiscalNotesChange={setFiscalNotesInput}
          onNitChange={setCustomerNitInput}
          onSubmit={submitPreparation}
        />

        <PreparedInvoiceDetailPanel
          canCancel={canCancelSelectedInvoice}
          cancelReason={cancelReasonInput}
          cancelReasonError={cancelReasonError}
          invoice={selectedInvoice}
          isCancelling={isCancelling}
          isLoading={isLoadingDetail}
          onCancelReasonChange={setCancelReasonInput}
          onRequestCancellation={requestCancellation}
        />
      </div>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Ban aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Confirmar cancelación interna</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará el comprobante interno preparado. No realiza anulación tributaria ni reversa SIAT. Motivo: {cancelReasonInput.trim()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={isCancelling} variant="destructive" onClick={() => void confirmCancellation()}>
              {isCancelling ? <Spinner /> : <Ban aria-hidden="true" />}
              Cancelar comprobante
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

type InvoiceableSaleRowProps = {
  disabled: boolean;
  onOpenInvoice?: () => void;
  onPrepare: () => void;
  sale: InvoiceableSaleSummary;
};

function InvoiceableSaleRow({ disabled, onOpenInvoice, onPrepare, sale }: InvoiceableSaleRowProps) {
  return (
    <TableRow>
      <TableCell className="min-w-0">
        <p className="truncate font-medium text-foreground" title={sale.correlativeCode}>
          {sale.correlativeCode}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={sale.id}>
          {sale.id}
        </p>
      </TableCell>
      <TableCell className="min-w-0">
        <p className="truncate" title={sale.sellerUser.fullName}>
          {sale.sellerUser.fullName}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={sale.sellerUser.email}>
          {sale.sellerUser.email}
        </p>
      </TableCell>
      <TableCell className="min-w-0">
        <p className="truncate" title={sale.cashSessionCorrelativeCode}>
          {sale.cashSessionCorrelativeCode}
        </p>
      </TableCell>
      <TableCell>{formatDateTime(sale.confirmedAt)}</TableCell>
      <TableCell className="text-right font-medium">{formatMoney(sale.totalAmount)}</TableCell>
      <TableCell>
        <InvoiceableSaleBadge sale={sale} />
      </TableCell>
      <TableCell className="text-right">
        {sale.canPrepareInvoice ? (
          <Button disabled={disabled} size="sm" type="button" onClick={onPrepare}>
            Preparar
          </Button>
        ) : (
          <Button disabled={disabled || !onOpenInvoice} size="icon" type="button" variant="ghost" onClick={onOpenInvoice}>
            <Eye aria-label="Abrir comprobante activo" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function InvoiceableSaleBadge({ sale }: { sale: InvoiceableSaleSummary }) {
  if (sale.canPrepareInvoice) {
    return <Badge variant="default">Facturable</Badge>;
  }

  return <Badge variant={sale.invoiceBlockedReason === "active-invoice-exists" ? "secondary" : "destructive"}>{getInvoiceBlockMessage(sale)}</Badge>;
}

type PreparedInvoiceRowProps = {
  invoice: PreparedInvoiceSummary;
  isSelected: boolean;
  onOpen: () => void;
};

function PreparedInvoiceRow({ invoice, isSelected, onOpen }: PreparedInvoiceRowProps) {
  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell className="min-w-0">
        <p className="truncate font-medium text-foreground" title={invoice.correlativeCode}>
          {invoice.correlativeCode}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={invoice.id}>
          {invoice.id}
        </p>
      </TableCell>
      <TableCell className="min-w-0">
        <p className="truncate" title={invoice.customerBusinessName}>
          {invoice.customerBusinessName}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={invoice.customerNit}>
          NIT {invoice.customerNit}
        </p>
      </TableCell>
      <TableCell className="min-w-0">
        <p className="truncate" title={invoice.saleCorrelativeCode}>
          {invoice.saleCorrelativeCode}
        </p>
      </TableCell>
      <TableCell>{formatDateTime(invoice.preparedAt)}</TableCell>
      <TableCell className="text-right font-medium">{formatMoney(invoice.totalAmount)}</TableCell>
      <TableCell>
        <PreparedInvoiceStatusBadge status={invoice.status} />
      </TableCell>
      <TableCell className="text-right">
        <Button aria-label={`Abrir ${invoice.correlativeCode}`} size="icon" type="button" variant="ghost" onClick={onOpen}>
          <Eye aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

type PreparationPanelProps = {
  canOperate: boolean;
  customerBusinessName: string;
  customerNit: string;
  error: string | null;
  fiscalNotes: string;
  isPreparing: boolean;
  onBusinessNameChange: (value: string) => void;
  onCancel: () => void;
  onFiscalNotesChange: (value: string) => void;
  onNitChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sale: InvoiceableSaleSummary | null;
};

function PreparationPanel({
  canOperate,
  customerBusinessName,
  customerNit,
  error,
  fiscalNotes,
  isPreparing,
  onBusinessNameChange,
  onCancel,
  onFiscalNotesChange,
  onNitChange,
  onSubmit,
  sale
}: PreparationPanelProps) {
  if (!sale) {
    return (
      <Card>
        <CardContent>
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Selecciona una venta preparable</EmptyTitle>
              <EmptyDescription>El formulario preparará un comprobante interno sin emisión tributaria SIAT.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preparar comprobante interno</CardTitle>
        <CardDescription>
          Venta {sale.correlativeCode} · Caja {sale.cashSessionCorrelativeCode} · {formatMoney(sale.totalAmount)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field>
            <FieldLabel>NIT</FieldLabel>
            <Input disabled={!canOperate || isPreparing} maxLength={32} value={customerNit} onChange={(event) => onNitChange(event.currentTarget.value)} />
            <FieldDescription>Usa 0 cuando corresponda consumidor final.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Razón social</FieldLabel>
            <Input
              disabled={!canOperate || isPreparing}
              maxLength={180}
              value={customerBusinessName}
              onChange={(event) => onBusinessNameChange(event.currentTarget.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Notas administrativas internas</FieldLabel>
            <Textarea
              disabled={!canOperate || isPreparing}
              maxLength={500}
              placeholder="Observaciones internas para archivo administrativo"
              value={fiscalNotes}
              onChange={(event) => onFiscalNotesChange(event.currentTarget.value)}
            />
            <FieldDescription>Opcional. No se envía al SIN desde esta pantalla.</FieldDescription>
            <FieldError>{error}</FieldError>
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled={!canOperate || isPreparing || !sale.canPrepareInvoice} type="submit">
              {isPreparing ? <Spinner /> : <ReceiptText aria-hidden="true" />}
              Preparar comprobante
            </Button>
            <Button disabled={isPreparing} type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
          {!sale.canPrepareInvoice ? <p className="text-sm text-destructive">{getInvoiceBlockMessage(sale)}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

type PreparedInvoiceDetailPanelProps = {
  canCancel: boolean;
  cancelReason: string;
  cancelReasonError: string | null;
  invoice: PreparedInvoice | null;
  isCancelling: boolean;
  isLoading: boolean;
  onCancelReasonChange: (value: string) => void;
  onRequestCancellation: (event: FormEvent<HTMLFormElement>) => void;
};

function PreparedInvoiceDetailPanel({
  canCancel,
  cancelReason,
  cancelReasonError,
  invoice,
  isCancelling,
  isLoading,
  onCancelReasonChange,
  onRequestCancellation
}: PreparedInvoiceDetailPanelProps) {
  if (isLoading && !invoice) {
    return (
      <Card>
        <CardContent className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Cargando detalle de comprobante...
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <CardContent>
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Selecciona un comprobante</EmptyTitle>
              <EmptyDescription>El detalle mostrará snapshot de venta, caja, vendedor, datos fiscales, total e ítems.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{invoice.correlativeCode}</CardTitle>
            <CardDescription>
              Comprobante interno preparado · Venta POS {invoice.saleCorrelativeCode} · {formatDateTime(invoice.preparedAt)}
            </CardDescription>
          </div>
          <PreparedInvoiceStatusBadge status={invoice.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <InfoLine label="Vendedor" value={`${invoice.sellerName} · ${invoice.sellerEmail}`} />
          <InfoLine label="Caja" value={`${invoice.cashSessionCode} · ${invoice.cashSessionId}`} />
          <InfoLine label="NIT" value={invoice.customerNit} />
          <InfoLine label="Razón social" value={invoice.customerBusinessName} />
          <InfoLine label="ID venta" value={invoice.saleId} />
          <InfoLine label="ID comprobante" value={invoice.id} />
          <InfoLine label="Total" value={formatMoney(invoice.totalAmount)} />
          <InfoLine label="Emisión tributaria" value="No emitida" />
        </div>

        {invoice.fiscalNotes ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">Notas administrativas internas</p>
            <p className="mt-1 text-muted-foreground">{invoice.fiscalNotes}</p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="w-[78px] text-right">Cant.</TableHead>
                <TableHead className="w-[116px] text-right">Unitario</TableHead>
                <TableHead className="w-[116px] text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="min-w-0">
                    <p className="truncate font-medium text-foreground" title={item.commercialName}>
                      {item.commercialName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" title={item.internalCode}>
                      {item.internalCode} · {item.baseUnit.abbreviation}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">{quantityFormatter.format(item.quantity)}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {invoice.status === "cancelled" ? (
          <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">Evidencia de cancelación</p>
            <InfoLine label="Fecha" value={invoice.cancelledAt ? formatDateTime(invoice.cancelledAt) : "Sin fecha expuesta"} />
            <InfoLine label="Motivo" value={invoice.cancelReason ?? "Sin motivo expuesto"} />
            {invoice.cancelledByUser ? <InfoLine label="Usuario" value={`${invoice.cancelledByUser.fullName} · ${invoice.cancelledByUser.email}`} /> : null}
          </div>
        ) : null}

        <form className="grid gap-3 rounded-md border p-3" onSubmit={onRequestCancellation}>
          <Field>
            <FieldLabel>Motivo de cancelación</FieldLabel>
            <Textarea
              disabled={!canCancel || isCancelling}
              maxLength={500}
              placeholder="Ej. datos fiscales preparados con NIT incorrecto antes de emisión real"
              value={cancelReason}
              onChange={(event) => onCancelReasonChange(event.currentTarget.value)}
            />
            <FieldDescription>
              {canCancel ? "Obligatorio. Entre 5 y 500 caracteres para auditoría administrativa." : "La factura ya no admite cancelación interna."}
            </FieldDescription>
            <FieldError>{cancelReasonError}</FieldError>
          </Field>
          <Button disabled={!canCancel || isCancelling} type="submit" variant="destructive">
            {isCancelling ? <Spinner /> : <Ban aria-hidden="true" />}
            Cancelar comprobante
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PreparedInvoiceStatusBadge({ status }: { status: PreparedInvoiceStatus }) {
  return <Badge variant={status === "cancelled" ? "destructive" : "default"}>{preparedStatusLabels[status]}</Badge>;
}

function PaginationControls({
  disabled,
  onNext,
  onPrevious,
  page,
  total,
  totalPages
}: {
  disabled: boolean;
  onNext: () => void;
  onPrevious: () => void;
  page: number;
  total: number;
  totalPages: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Página {page} de {Math.max(totalPages, 1)}. Registros: {total}.
      </p>
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-xl font-semibold text-foreground" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function getInvoiceBlockMessage(sale: InvoiceableSaleSummary) {
  return invoiceBlockLabels[sale.invoiceBlockedReason ?? "unknown"];
}

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
