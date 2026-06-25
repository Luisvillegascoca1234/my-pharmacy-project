import { type FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  ClipboardList,
  Eye,
  FileSearch,
  PackageCheck,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  Undo2
} from "lucide-react";
import type {
  ReturnableSaleBlockReason,
  ReturnableSaleSummary,
  ReturnsDataErrorCode,
  SaleReturn,
  SaleReturnSummary
} from "@/modules/returns";
import { useReturns } from "@/modules/returns";
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
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const moneyFormatter = new Intl.NumberFormat("es-BO", { currency: "BOB", maximumFractionDigits: 2, style: "currency" });
const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" });

const saleStatusLabels = {
  cancelled: "Anulada",
  confirmed: "Confirmada",
  returned: "Devuelta"
};

const paymentStatusLabels = {
  cancelled: "Cancelado",
  paid: "Pagado",
  refunded: "Reembolsado",
  reverted: "Revertido"
};

const returnBlockLabels: Record<ReturnableSaleBlockReason, string> = {
  "active-invoice-exists": "Comprobante interno activo",
  "already-returned": "Ya devuelta",
  "cash-session-open": "Caja abierta",
  "payment-not-refundable": "Pago no reembolsable",
  "sale-cancelled": "Venta anulada",
  "sale-not-found": "Venta no encontrada",
  unknown: "Bloqueo no clasificado"
};

const returnBlockDescriptions: Record<ReturnableSaleBlockReason, string> = {
  "active-invoice-exists": "Cancela primero el comprobante interno preparado desde Comprobantes internos antes de registrar la devolución administrativa.",
  "already-returned": "La venta ya tiene devolución total registrada en el historial administrativo.",
  "cash-session-open": "Con caja abierta corresponde anulación POS, no devolución administrativa posterior al cierre.",
  "payment-not-refundable": "El pago no está en estado reembolsable para una devolución total V1.",
  "sale-cancelled": "Una venta anulada por POS no requiere devolución administrativa.",
  "sale-not-found": "No se encontró la venta solicitada para evaluar devolución.",
  unknown: "La venta no cumple las reglas vigentes para devolución total."
};

const errorMessages: Record<ReturnsDataErrorCode, string> = {
  "active-invoice-exists": "La venta tiene un comprobante interno preparado activo. Cancélalo primero desde Comprobantes internos.",
  "already-returned": "La venta ya cuenta con devolución total registrada.",
  "cash-session-open": "La caja de la venta sigue abierta. Usa anulación POS mientras la caja no esté cerrada.",
  forbidden: "Tu usuario no tiene permiso para operar devoluciones administrativas.",
  "not-found": "No se encontró la devolución solicitada.",
  "payment-not-refundable": "El pago asociado no permite devolución total.",
  "sale-cancelled": "La venta fue anulada. No corresponde registrar devolución administrativa.",
  "sale-not-found": "No se encontró la venta seleccionada.",
  "sale-not-returnable": "La venta no cumple las reglas para devolución total.",
  "session-invalid": "Tu sesión no permite operar devoluciones. Vuelve a iniciar sesión.",
  unknown: "No se pudo completar la operación. Intenta nuevamente.",
  validation: "El motivo debe tener entre 5 y 500 caracteres."
};

export function ReturnsPage() {
  const returns = useReturns({ autoLoadReturnableSales: true, autoLoadSaleReturns: true });
  const [returnableSearchInput, setReturnableSearchInput] = useState(returns.returnableSearch);
  const [returnableSellerInput, setReturnableSellerInput] = useState(returns.returnableSellerUserId);
  const [historySearchInput, setHistorySearchInput] = useState(returns.saleReturnSearch);
  const [historySaleIdInput, setHistorySaleIdInput] = useState(returns.saleReturnSaleId);
  const [historyActorInput, setHistoryActorInput] = useState(returns.saleReturnActorUserId);
  const [selectedSale, setSelectedSale] = useState<ReturnableSaleSummary | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isReasonDialogOpen, setReasonDialogOpen] = useState(false);
  const isLoadingReturnableSales = returns.returnableSalesStatus === "loading";
  const isLoadingHistory = returns.saleReturnsStatus === "loading";
  const isLoadingDetail = returns.detailStatus === "loading";
  const isCreating = returns.createStatus === "loading";
  const canOperate = returns.canUseReturns;
  const selectedReturn = returns.selectedSaleReturn;
  const visibleError = returns.error ? errorMessages[returns.error.code] : null;

  const returnsSummary = useMemo(
    () => ({
      blocked: returns.returnableSales.filter((sale) => !sale.canReturn).length,
      refundableAmount: returns.returnableSales.filter((sale) => sale.canReturn).reduce((total, sale) => total + sale.totalAmount, 0),
      returnedAmount: returns.saleReturns.reduce((total, saleReturn) => total + saleReturn.refundAmount, 0)
    }),
    [returns.returnableSales, returns.saleReturns]
  );

  function applyReturnableFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    returns.setReturnableSearch(returnableSearchInput);
    returns.setReturnableSellerUserId(returnableSellerInput);
  }

  function clearReturnableFilters() {
    setReturnableSearchInput("");
    setReturnableSellerInput("");
    returns.setReturnableSearch("");
    returns.setReturnableSellerUserId("");
    returns.setReturnableFromDate("");
    returns.setReturnableToDate("");
  }

  function applyHistoryFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    returns.setSaleReturnSearch(historySearchInput);
    returns.setSaleReturnSaleId(historySaleIdInput);
    returns.setSaleReturnActorUserId(historyActorInput);
  }

  function clearHistoryFilters() {
    setHistorySearchInput("");
    setHistorySaleIdInput("");
    setHistoryActorInput("");
    returns.setSaleReturnSearch("");
    returns.setSaleReturnSaleId("");
    returns.setSaleReturnActorUserId("");
    returns.setSaleReturnFromDate("");
    returns.setSaleReturnToDate("");
  }

  function openReasonDialog(sale: ReturnableSaleSummary) {
    returns.clearCreation();
    setSelectedSale(sale);
    setReasonInput("");
    setReasonError(null);
    setReasonDialogOpen(true);
  }

  function requestTotalReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReasonError(null);

    if (!selectedSale) {
      setReasonError("Selecciona una venta devolvible.");
      return;
    }

    if (!selectedSale.canReturn) {
      setReasonError(getReturnBlockDescription(selectedSale));
      return;
    }

    const normalizedReason = reasonInput.trim();

    if (normalizedReason.length < 5 || normalizedReason.length > 500) {
      setReasonError("El motivo debe tener entre 5 y 500 caracteres.");
      return;
    }

    setReasonDialogOpen(true);
  }

  async function confirmTotalReturn() {
    if (!selectedSale) {
      return;
    }

    const normalizedReason = reasonInput.trim();

    if (normalizedReason.length < 5 || normalizedReason.length > 500) {
      setReasonError("El motivo debe tener entre 5 y 500 caracteres.");
      return;
    }

    const saleReturn = await returns.createTotalSaleReturn({
      reason: normalizedReason,
      saleId: selectedSale.id
    });

    if (saleReturn) {
      setSelectedSale(null);
      setReasonInput("");
      setReasonDialogOpen(false);
      await returns.reloadReturnableSales();
      await returns.reloadSaleReturns();
    }
  }

  async function openSaleReturnDetail(saleReturnId: string) {
    returns.selectSaleReturn(saleReturnId);
    await returns.loadSaleReturn(saleReturnId);
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Posterior al cierre de caja
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Devoluciones administrativas totales</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Registro administrativo de devolución total sobre ventas POS ya cerradas. Si la caja sigue abierta, corresponde anulación POS y no devolución posterior.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[640px]">
          <Metric label="Bloqueadas" value={returnsSummary.blocked} />
          <Metric label="Devolvible visible" value={formatMoney(returnsSummary.refundableAmount)} />
          <Metric label="Devuelto historial" value={formatMoney(returnsSummary.returnedAmount)} />
        </div>
      </div>

      {!canOperate ? (
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Permiso insuficiente</AlertTitle>
          <AlertDescription>Solo administración y superadministración pueden registrar devoluciones administrativas totales.</AlertDescription>
        </Alert>
      ) : null}

      {returns.lastSaleReturn && returns.createStatus === "success" ? (
        <Alert>
          <BadgeCheck aria-hidden="true" />
          <AlertTitle>Devolución total registrada</AlertTitle>
          <AlertDescription>
            La venta {returns.lastSaleReturn.saleCorrelativeCode} quedó marcada como devuelta por {formatMoney(returns.lastSaleReturn.refundAmount)} en el historial.
          </AlertDescription>
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
                <CardTitle>Ventas devolvibles</CardTitle>
                <CardDescription>Ventas POS evaluadas para devolución total, con bloqueo operativo cuando corresponde anulación o cancelación previa.</CardDescription>
              </div>
              <Button disabled={!canOperate || isLoadingReturnableSales} size="sm" type="button" variant="outline" onClick={() => void returns.reloadReturnableSales()}>
                {isLoadingReturnableSales ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
                Actualizar
              </Button>
            </div>

            <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_auto]" onSubmit={applyReturnableFilters}>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  disabled={!canOperate}
                  placeholder="Correlativo, vendedor o texto de venta"
                  value={returnableSearchInput}
                  onChange={(event) => setReturnableSearchInput(event.currentTarget.value)}
                />
              </div>
              <Input disabled={!canOperate} type="date" value={returns.returnableFromDate} onChange={(event) => returns.setReturnableFromDate(event.currentTarget.value)} />
              <Input disabled={!canOperate} type="date" value={returns.returnableToDate} onChange={(event) => returns.setReturnableToDate(event.currentTarget.value)} />
              <Button disabled={!canOperate || isLoadingReturnableSales} type="submit">
                <Search aria-hidden="true" />
                Filtrar
              </Button>
            </form>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <Input disabled={!canOperate} placeholder="ID de vendedor" value={returnableSellerInput} onChange={(event) => setReturnableSellerInput(event.currentTarget.value)} />
              <Button disabled={!canOperate || isLoadingReturnableSales} type="button" variant="outline" onClick={clearReturnableFilters}>
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
                  <TableHead className="w-[128px]">Caja</TableHead>
                  <TableHead className="w-[132px]">Fecha</TableHead>
                  <TableHead className="w-[112px] text-right">Total neto</TableHead>
                  <TableHead className="w-[170px]">Estado</TableHead>
                  <TableHead className="w-[118px] text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.returnableSales.map((sale) => (
                  <ReturnableSaleRow key={sale.id} disabled={!canOperate || isCreating} sale={sale} onSelect={() => setSelectedSale(sale)} onStartReturn={() => openReasonDialog(sale)} />
                ))}
                {returns.returnableSales.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-64" colSpan={7}>
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{isLoadingReturnableSales ? <Spinner /> : <FileSearch aria-hidden="true" />}</EmptyMedia>
                          <EmptyTitle>{isLoadingReturnableSales ? "Cargando ventas" : "Sin ventas devolvibles"}</EmptyTitle>
                          <EmptyDescription>
                            {isLoadingReturnableSales
                              ? "Consultando ventas POS según filtros administrativos."
                              : "Ajusta filtros o revisa si la venta fue anulada, ya devuelta, tiene caja abierta, comprobante interno activo o pago no reembolsable."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <PaginationControls
              disabled={!canOperate || isLoadingReturnableSales}
              page={returns.returnablePagination.page}
              total={returns.returnablePagination.total}
              totalPages={returns.returnablePagination.totalPages}
              onNext={() => returns.setReturnablePage(returns.returnablePagination.page + 1)}
              onPrevious={() => returns.setReturnablePage(returns.returnablePagination.page - 1)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Historial de devoluciones</CardTitle>
                <CardDescription>Devoluciones administrativas totales registradas por venta, actor administrativo, texto y rango de fechas.</CardDescription>
              </div>
              <Button disabled={!canOperate || isLoadingHistory} size="sm" type="button" variant="outline" onClick={() => void returns.reloadSaleReturns()}>
                {isLoadingHistory ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
                Actualizar
              </Button>
            </div>

            <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_auto]" onSubmit={applyHistoryFilters}>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input className="pl-8" disabled={!canOperate} placeholder="Venta, actor o motivo" value={historySearchInput} onChange={(event) => setHistorySearchInput(event.currentTarget.value)} />
              </div>
              <Input disabled={!canOperate} type="date" value={returns.saleReturnFromDate} onChange={(event) => returns.setSaleReturnFromDate(event.currentTarget.value)} />
              <Input disabled={!canOperate} type="date" value={returns.saleReturnToDate} onChange={(event) => returns.setSaleReturnToDate(event.currentTarget.value)} />
              <Button disabled={!canOperate || isLoadingHistory} type="submit">
                <Search aria-hidden="true" />
                Filtrar
              </Button>
            </form>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Input disabled={!canOperate} placeholder="ID de venta" value={historySaleIdInput} onChange={(event) => setHistorySaleIdInput(event.currentTarget.value)} />
              <Input disabled={!canOperate} placeholder="ID de actor" value={historyActorInput} onChange={(event) => setHistoryActorInput(event.currentTarget.value)} />
              <Button disabled={!canOperate || isLoadingHistory} type="button" variant="outline" onClick={clearHistoryFilters}>
                Limpiar filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[132px]">Venta POS</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead className="w-[132px]">Fecha</TableHead>
                  <TableHead className="w-[120px] text-right">Devuelto</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="w-[86px] text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.saleReturns.map((saleReturn) => (
                  <SaleReturnRow key={saleReturn.id} isSelected={saleReturn.id === returns.selectedSaleReturnId} saleReturn={saleReturn} onOpen={() => void openSaleReturnDetail(saleReturn.id)} />
                ))}
                {returns.saleReturns.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-64" colSpan={6}>
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{isLoadingHistory ? <Spinner /> : <RotateCcw aria-hidden="true" />}</EmptyMedia>
                          <EmptyTitle>{isLoadingHistory ? "Cargando devoluciones" : "Sin devoluciones registradas"}</EmptyTitle>
                          <EmptyDescription>
                            {isLoadingHistory ? "Consultando historial según filtros actuales." : "Registra una devolución total desde una venta elegible o ajusta los filtros del historial."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <PaginationControls
              disabled={!canOperate || isLoadingHistory}
              page={returns.saleReturnPagination.page}
              total={returns.saleReturnPagination.total}
              totalPages={returns.saleReturnPagination.totalPages}
              onNext={() => returns.setSaleReturnPage(returns.saleReturnPagination.page + 1)}
              onPrevious={() => returns.setSaleReturnPage(returns.saleReturnPagination.page - 1)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <ReturnRequestPanel
          canOperate={canOperate}
          error={reasonError}
          isCreating={isCreating}
          reason={reasonInput}
          sale={selectedSale}
          onCancel={() => {
            setSelectedSale(null);
            setReasonError(null);
            setReasonInput("");
          }}
          onReasonChange={setReasonInput}
          onStartReturn={() => setReasonDialogOpen(true)}
          onSubmit={requestTotalReturn}
        />

        <SaleReturnDetailPanel isLoading={isLoadingDetail} saleReturn={selectedReturn} />
      </div>

      <AlertDialog open={isReasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Undo2 aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Confirmar devolución total</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marca la venta {selectedSale?.correlativeCode ?? "seleccionada"} como devuelta, registra historial administrativo y restaura lotes según el detalle entregado por backend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form className="grid gap-4" onSubmit={requestTotalReturn}>
            <Field>
              <FieldLabel>Motivo obligatorio</FieldLabel>
              <Textarea
                disabled={!canOperate || isCreating}
                maxLength={500}
                placeholder="Ej. cliente devolvió la totalidad de productos con comprobante interno validado"
                value={reasonInput}
                onChange={(event) => setReasonInput(event.currentTarget.value)}
              />
              <FieldDescription>Entre 5 y 500 caracteres. No se captura importe manual de reembolso en V1.</FieldDescription>
              <FieldError>{reasonError}</FieldError>
            </Field>
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreating}>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={!canOperate || isCreating} variant="destructive" onClick={() => void confirmTotalReturn()}>
              {isCreating ? <Spinner /> : <Undo2 aria-hidden="true" />}
              Registrar devolución
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

type ReturnableSaleRowProps = {
  disabled: boolean;
  onSelect: () => void;
  onStartReturn: () => void;
  sale: ReturnableSaleSummary;
};

function ReturnableSaleRow({ disabled, onSelect, onStartReturn, sale }: ReturnableSaleRowProps) {
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
        <ReturnableSaleBadge sale={sale} />
      </TableCell>
      <TableCell className="text-right">
        {sale.canReturn ? (
          <Button disabled={disabled} size="sm" type="button" onClick={onStartReturn}>
            Devolver
          </Button>
        ) : (
          <Button disabled={disabled} size="icon" type="button" variant="ghost" onClick={onSelect}>
            <Eye aria-label="Ver bloqueo de devolución" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function ReturnableSaleBadge({ sale }: { sale: ReturnableSaleSummary }) {
  if (sale.canReturn) {
    return <Badge variant="default">Devolvible</Badge>;
  }

  return <Badge variant={sale.returnBlockedReason === "active-invoice-exists" ? "secondary" : "destructive"}>{getReturnBlockLabel(sale)}</Badge>;
}

type SaleReturnRowProps = {
  isSelected: boolean;
  onOpen: () => void;
  saleReturn: SaleReturnSummary;
};

function SaleReturnRow({ isSelected, onOpen, saleReturn }: SaleReturnRowProps) {
  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell className="min-w-0">
        <p className="truncate font-medium text-foreground" title={saleReturn.saleCorrelativeCode}>
          {saleReturn.saleCorrelativeCode}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={saleReturn.saleId}>
          {saleReturn.saleId}
        </p>
      </TableCell>
      <TableCell className="min-w-0">
        <p className="truncate" title={saleReturn.actorUser.fullName}>
          {saleReturn.actorUser.fullName}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={saleReturn.actorUser.email}>
          {saleReturn.actorUser.email}
        </p>
      </TableCell>
      <TableCell>{formatDateTime(saleReturn.returnedAt)}</TableCell>
      <TableCell className="text-right font-medium">{formatMoney(saleReturn.refundAmount)}</TableCell>
      <TableCell className="min-w-0">
        <p className="truncate" title={saleReturn.reason}>
          {saleReturn.reason}
        </p>
      </TableCell>
      <TableCell className="text-right">
        <Button aria-label={`Abrir devolución ${saleReturn.saleCorrelativeCode}`} size="icon" type="button" variant="ghost" onClick={onOpen}>
          <Eye aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

type ReturnRequestPanelProps = {
  canOperate: boolean;
  error: string | null;
  isCreating: boolean;
  onCancel: () => void;
  onReasonChange: (value: string) => void;
  onStartReturn: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  reason: string;
  sale: ReturnableSaleSummary | null;
};

function ReturnRequestPanel({ canOperate, error, isCreating, onCancel, onReasonChange, onStartReturn, onSubmit, reason, sale }: ReturnRequestPanelProps) {
  if (!sale) {
    return (
      <Card>
        <CardContent>
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageCheck aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Selecciona una venta</EmptyTitle>
              <EmptyDescription>El detalle mostrará si corresponde devolución posterior al cierre o anulación POS.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalle de venta devolvible</CardTitle>
        <CardDescription>
          Venta {sale.correlativeCode} · Caja {sale.cashSessionCorrelativeCode} · Total neto {formatMoney(sale.totalAmount)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm">
            <InfoLine label="Vendedor" value={`${sale.sellerUser.fullName} · ${sale.sellerUser.email}`} />
            <InfoLine label="Estado de venta" value={saleStatusLabels[sale.status]} />
            <InfoLine label="Estado de pago" value={paymentStatusLabels[sale.paymentStatus]} />
            <InfoLine label="Fecha de venta" value={formatDateTime(sale.confirmedAt)} />
            <InfoLine label="Importe a devolver" value={formatMoney(sale.totalAmount)} />
            <InfoLine label="ID de venta" value={sale.id} />
          </div>

          {!sale.canReturn ? (
            <Alert variant={sale.returnBlockedReason === "active-invoice-exists" ? "default" : "destructive"}>
              <AlertCircle aria-hidden="true" />
              <AlertTitle>{getReturnBlockLabel(sale)}</AlertTitle>
              <AlertDescription>{getReturnBlockDescription(sale)}</AlertDescription>
            </Alert>
          ) : null}

          {sale.canReturn ? (
            <Field>
              <FieldLabel>Motivo de devolución total</FieldLabel>
              <Textarea
                disabled={!canOperate || isCreating}
                maxLength={500}
                placeholder="Ej. devolución total solicitada por cliente con productos reintegrados a inventario"
                value={reason}
                onChange={(event) => onReasonChange(event.currentTarget.value)}
              />
              <FieldDescription>Obligatorio. Entre 5 y 500 caracteres. El importe devuelto será el total neto de venta.</FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled={!canOperate || isCreating || !sale.canReturn} type="button" variant="destructive" onClick={onStartReturn}>
              {isCreating ? <Spinner /> : <Undo2 aria-hidden="true" />}
              Registrar devolución
            </Button>
            <Button disabled={isCreating} type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SaleReturnDetailPanel({ isLoading, saleReturn }: { isLoading: boolean; saleReturn: SaleReturn | null }) {
  if (isLoading && !saleReturn) {
    return (
      <Card>
        <CardContent className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Cargando detalle de devolución...
        </CardContent>
      </Card>
    );
  }

  if (!saleReturn) {
    return (
      <Card>
        <CardContent>
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Selecciona una devolución</EmptyTitle>
              <EmptyDescription>El detalle mostrará venta, pago, actor, importe devuelto, motivo e ítems restaurados por lote.</EmptyDescription>
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
            <CardTitle>{saleReturn.saleCorrelativeCode}</CardTitle>
            <CardDescription>
              Devolución total · Pago {saleReturn.paymentId} · {formatDateTime(saleReturn.returnedAt)}
            </CardDescription>
          </div>
          <Badge variant="default">Devuelta</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <InfoLine label="Actor" value={`${saleReturn.actorUser.fullName} · ${saleReturn.actorUser.email}`} />
          <InfoLine label="Importe devuelto" value={formatMoney(saleReturn.refundAmount)} />
          <InfoLine label="ID venta" value={saleReturn.saleId} />
          <InfoLine label="ID pago" value={saleReturn.paymentId} />
          <InfoLine label="ID devolución" value={saleReturn.id} />
          <InfoLine label="Fecha registro" value={formatDateTime(saleReturn.createdAt)} />
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">Motivo administrativo</p>
          <p className="mt-1 text-muted-foreground">{saleReturn.reason}</p>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto y lote</TableHead>
                <TableHead className="w-[88px] text-right">Cant.</TableHead>
                <TableHead className="w-[118px] text-right">Unitario</TableHead>
                <TableHead className="w-[118px] text-right">Subtotal</TableHead>
                <TableHead className="w-[180px]">Movimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saleReturn.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="min-w-0">
                    <p className="truncate font-medium text-foreground" title={item.commercialName}>
                      {item.commercialName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" title={`${item.internalCode} · Lote ${item.batchNumber ?? item.batchId}`}>
                      {item.internalCode} · Lote {item.batchNumber ?? item.batchId}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">{quantityFormatter.format(item.quantity)}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.refundUnitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(item.refundSubtotal)}</TableCell>
                  <TableCell className="min-w-0">
                    <p className="truncate text-sm" title={item.inventoryMovementId ?? "Movimiento pendiente de backend"}>
                      {item.inventoryMovementId ?? "Sin movimiento expuesto"}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
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

function getReturnBlockLabel(sale: ReturnableSaleSummary) {
  return returnBlockLabels[sale.returnBlockedReason ?? "unknown"];
}

function getReturnBlockDescription(sale: ReturnableSaleSummary) {
  return returnBlockDescriptions[sale.returnBlockedReason ?? "unknown"];
}

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
