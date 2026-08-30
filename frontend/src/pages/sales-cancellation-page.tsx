import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ContextNavigation, salesNavigation } from "@/components/context-navigation";
import {
  AlertCircle,
  Ban,
  BadgeCheck,
  Boxes,
  ChevronDown,
  ClipboardCheck,
  Eye,
  FileSearch,
  RefreshCcw,
  Search,
  ShieldAlert,
  Undo2,
  WalletCards
} from "lucide-react";
import type {
  CancelablePaymentStatus,
  CancelableSale,
  CancelableSaleStatus,
  CancelableSaleSummary,
  SalesDataErrorCode,
  SalesStatusFilter
} from "@/modules/sales";
import { useSales } from "@/modules/sales";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { OperationalScopeNotice, SupervisionOnly } from "@/components/operational-scope-notice";
import { getSaleCancellationBlockMessage, getSupervisedSellerFilter, isSaleCancellationAllowed } from "./sales-cancellation-policy";

const moneyFormatter = new Intl.NumberFormat("es-BO", { currency: "BOB", maximumFractionDigits: 2, style: "currency" });
const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/La_Paz"
});

const saleStatusLabels: Record<CancelableSaleStatus, string> = {
  cancelled: "Anulada",
  confirmed: "Confirmada",
  returned: "Devuelta"
};

const paymentStatusLabels: Record<CancelablePaymentStatus, string> = {
  cancelled: "Anulado",
  paid: "Pagado",
  refunded: "Reembolsado",
  reverted: "Revertido"
};

const errorMessages: Record<SalesDataErrorCode, string> = {
  "cash-session-closed": "La caja asociada ya fue cerrada. El detalle se mantiene en el historial.",
  forbidden: "Esta venta pertenece a otra persona y no puedes anularla.",
  "not-current-day": "La venta ya no corresponde al turno permitido.",
  "not-found": "No se encontró la venta solicitada.",
  "sale-already-cancelled": "La venta ya fue anulada previamente.",
  "sale-not-cancelable": "Esta venta ya no se puede anular.",
  "session-invalid": "Tu sesión venció. Vuelve a iniciar sesión.",
  unknown: "No se pudo anular la venta. Intenta nuevamente.",
  validation: "Ingresa un motivo de anulación válido."
};

const statusOptions: SalesStatusFilter[] = ["all", "confirmed", "cancelled", "returned"];

export function SalesCancellationPage() {
  const sales = useSales();
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const saleIdFromQuery = searchParams.get("saleId")?.trim() ?? "";
  const [searchInput, setSearchInput] = useState(sales.search);
  const [sellerInput, setSellerInput] = useState(sales.sellerUserId);
  const [cashSessionInput, setCashSessionInput] = useState(sales.cashSessionId);
  const [directSaleIdInput, setDirectSaleIdInput] = useState("");
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const isLoadingList = sales.listStatus === "loading";
  const isLoadingDetail = sales.detailStatus === "loading";
  const isCancelling = sales.cancelStatus === "loading";
  const selectedSale = sales.selectedSale;
  const canCancelSelectedSale = isSaleCancellationAllowed(selectedSale);
  const visibleError = sales.error ? errorMessages[sales.error.code] : null;
  const successSale = sales.lastCancelledSale;

  const listSummary = useMemo(
    () => ({
      cancelled: sales.items.filter((item) => item.status === "cancelled").length,
      cancelable: sales.items.filter((item) => item.canCancel).length,
      totalAmount: sales.items.reduce((total, item) => total + item.totalAmount, 0)
    }),
    [sales.items]
  );

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sales.setSearch(searchInput);
    sales.setSellerUserId(getSupervisedSellerFilter(sales.canSupervise, sellerInput));
    sales.setCashSessionId(cashSessionInput);
  }

  function clearFilters() {
    setSearchInput("");
    setSellerInput("");
    setCashSessionInput("");
    sales.setSearch("");
    sales.setSellerUserId("");
    sales.setCashSessionId("");
    sales.setFromDate("");
    sales.setToDate("");
    sales.setStatus("all");
  }

  async function openSaleDetail(saleId: string) {
    sales.clearCancellation();
    setCancelReasonInput("");
    setCancelReasonError(null);
    sales.selectSale(saleId);
    await sales.loadSale(saleId);
  }

  async function openDirectSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saleId = directSaleIdInput.trim();

    if (!saleId) {
      return;
    }

    await openSaleDetail(saleId);
  }

  useEffect(() => {
    if (!saleIdFromQuery || !sales.canUse || sales.selectedSaleId === saleIdFromQuery) {
      return;
    }

    setDirectSaleIdInput(saleIdFromQuery);
    void openSaleDetail(saleIdFromQuery);
  }, [saleIdFromQuery, sales.canUse, sales.selectedSaleId]);

  useEffect(() => {
    if (!sales.selectedSaleId) {
      return;
    }

    detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  }, [sales.selectedSaleId]);

  function requestCancellation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCancelReasonError(null);

    if (!canCancelSelectedSale) {
      setCancelReasonError(getSaleCancellationBlockMessage(selectedSale));
      return;
    }

    const normalizedReason = cancelReasonInput.trim();

    if (normalizedReason.length < 3) {
      setCancelReasonError("El motivo debe tener al menos 3 caracteres.");
      return;
    }

    setConfirmDialogOpen(true);
  }

  async function confirmCancellation() {
    setCancelReasonError(null);
    const cancelledSale = await sales.cancelSelectedSale(cancelReasonInput);

    if (cancelledSale) {
      setCancelReasonInput("");
      setConfirmDialogOpen(false);
    }
  }

  return (
    <section className="grid gap-5">
      <ContextNavigation ariaLabel="Consultas de ventas" items={salesNavigation} />
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Historial de ventas</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Consulta ventas recientes y anúlalas mientras la caja correspondiente siga abierta.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[600px]">
          <Metric label="Ventas" value={sales.pagination.total} />
          <Metric label="Se pueden anular" value={listSummary.cancelable} />
          <Metric label="Total listado" value={formatMoney(listSummary.totalAmount)} />
        </div>
      </div>

      <OperationalScopeNotice
        canSupervise={sales.canSupervise}
        ownRecordsDescription="Esta pantalla muestra únicamente tus ventas."
        supervisionDescription="Puedes consultar ventas de otros vendedores. La opción de anular aparece solo cuando corresponde."
      />

      {!sales.canUse ? (
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Área no disponible</AlertTitle>
          <AlertDescription>El rol de tu usuario no incluye la consulta de ventas de mostrador.</AlertDescription>
        </Alert>
      ) : null}

      {successSale ? (
        <Alert>
          <BadgeCheck aria-hidden="true" />
          <AlertTitle>Venta anulada</AlertTitle>
          <AlertDescription>
            {successSale.correlativeCode} quedó anulada y se restauraron el efectivo y el stock relacionados.
          </AlertDescription>
        </Alert>
      ) : null}

      {visibleError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudo anular la venta</AlertTitle>
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Ventas recientes</CardTitle>
                <CardDescription>
                  {sales.canSupervise
                    ? "Busca por fecha, vendedor, caja o estado."
                    : "Consulta tus ventas y anúlalas cuando corresponda."}
                </CardDescription>
              </div>
              <Button disabled={!sales.canUse || isLoadingList} size="sm" variant="outline" onClick={() => void sales.reload()}>
                {isLoadingList ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
                Actualizar
              </Button>
            </div>

            <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_150px_auto]" onSubmit={applyFilters}>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  disabled={!sales.canUse}
                  placeholder="Correlativo o texto de venta"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.currentTarget.value)}
                />
              </div>
              <Input
                aria-label="Desde"
                disabled={!sales.canUse}
                type="date"
                value={sales.fromDate}
                onChange={(event) => sales.setFromDate(event.currentTarget.value)}
              />
              <Input aria-label="Hasta" disabled={!sales.canUse} type="date" value={sales.toDate} onChange={(event) => sales.setToDate(event.currentTarget.value)} />
              <NativeSelect
                aria-label="Estado"
                disabled={!sales.canUse}
                value={sales.status}
                onChange={(event) => sales.setStatus(event.currentTarget.value as SalesStatusFilter)}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Todos" : saleStatusLabels[option]}
                  </option>
                ))}
              </NativeSelect>
              <Button disabled={!sales.canUse || isLoadingList} type="submit">
                <Search aria-hidden="true" />
                Filtrar
              </Button>
            </form>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <SupervisionOnly allowed={sales.canSupervise}>
                <Input
                  aria-label="Vendedor"
                  disabled={!sales.canUse}
                  placeholder="ID de vendedor"
                  value={sellerInput}
                  onChange={(event) => setSellerInput(event.currentTarget.value)}
                />
              </SupervisionOnly>
              <Input
                aria-label="Caja"
                disabled={!sales.canUse}
                placeholder="ID de caja"
                value={cashSessionInput}
                onChange={(event) => setCashSessionInput(event.currentTarget.value)}
              />
              <Button disabled={!sales.canUse || isLoadingList} type="button" variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[132px]">Venta</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="w-[128px]">Caja</TableHead>
                  <TableHead className="w-[166px]">Fecha</TableHead>
                  <TableHead className="w-[104px] text-right">Total</TableHead>
                  <TableHead className="w-[104px]">Estado</TableHead>
                  <TableHead className="sticky right-0 z-20 w-[84px] border-l bg-muted text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.items.map((sale) => (
                  <SaleRow key={sale.id} isSelected={sale.id === sales.selectedSaleId} sale={sale} onOpen={() => void openSaleDetail(sale.id)} />
                ))}
                {sales.items.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-64" colSpan={7}>
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{isLoadingList ? <Spinner /> : <FileSearch aria-hidden="true" />}</EmptyMedia>
                          <EmptyTitle>{isLoadingList ? "Cargando ventas" : "No hay ventas"}</EmptyTitle>
                          <EmptyDescription>
                            {isLoadingList
                              ? "Buscando ventas con los filtros actuales."
                              : "Ajusta los filtros para encontrar la venta que buscas."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Página {sales.pagination.page} de {Math.max(sales.pagination.totalPages, 1)} · {listSummary.cancelled} anuladas
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={!sales.canUse || sales.pagination.page <= 1 || isLoadingList}
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => sales.setPage(sales.pagination.page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  disabled={!sales.canUse || sales.pagination.page >= sales.pagination.totalPages || isLoadingList}
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => sales.setPage(sales.pagination.page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid h-fit gap-5">
          <Collapsible className="group/direct-sale">
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button className="h-auto w-full justify-between px-0 text-left" type="button" variant="ghost">
                    <span>
                      <span className="block font-semibold">Búsqueda avanzada</span>
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">Busca una venta mediante su identificador interno.</span>
                    </span>
                    <ChevronDown aria-hidden="true" className="transition-transform group-data-[state=open]/direct-sale:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <form className="grid gap-3" onSubmit={openDirectSale}>
                    <Input disabled={!sales.canUse || isLoadingDetail} placeholder="ID interno de venta" value={directSaleIdInput} onChange={(event) => setDirectSaleIdInput(event.currentTarget.value)} />
                    <Button disabled={!sales.canUse || isLoadingDetail || !directSaleIdInput.trim()} type="submit" variant="outline">
                      {isLoadingDetail ? <Spinner /> : <Eye aria-hidden="true" />} Abrir detalle
                    </Button>
                  </form>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <div ref={detailPanelRef} className="scroll-mt-5">
            <SaleDetailPanel
              canCancel={canCancelSelectedSale}
              cancelReason={cancelReasonInput}
              cancelReasonError={cancelReasonError}
              isCancelling={isCancelling}
              isLoading={isLoadingDetail}
              sale={selectedSale}
              onCancelReasonChange={setCancelReasonInput}
              onRequestCancellation={requestCancellation}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Ban aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Confirmar anulación</AlertDialogTitle>
            <AlertDialogDescription>
              Se anulará la venta y se restaurarán el efectivo y el stock relacionados. Motivo: {cancelReasonInput.trim()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={isCancelling} variant="destructive" onClick={() => void confirmCancellation()}>
              {isCancelling ? <Spinner /> : <Undo2 aria-hidden="true" />}
              Anular venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

type SaleRowProps = {
  isSelected: boolean;
  onOpen: () => void;
  sale: CancelableSaleSummary;
};

function SaleRow({ isSelected, onOpen, sale }: SaleRowProps) {
  return (
    <TableRow className="group" data-state={isSelected ? "selected" : undefined}>
      <TableCell className="min-w-0 overflow-hidden">
        <p className="truncate font-medium text-foreground" title={sale.correlativeCode}>
          {sale.correlativeCode}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={sale.id}>
          {sale.id}
        </p>
      </TableCell>
      <TableCell className="min-w-0 overflow-hidden">
        <p className="truncate" title={sale.sellerUser.fullName}>
          {sale.sellerUser.fullName}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={sale.sellerUser.email}>
          {sale.sellerUser.email}
        </p>
      </TableCell>
      <TableCell className="min-w-0 overflow-hidden">
        <p className="truncate" title={sale.cashSessionCorrelativeCode}>
          {sale.cashSessionCorrelativeCode}
        </p>
      </TableCell>
      <TableCell className="overflow-hidden">{formatDateTime(sale.confirmedAt)}</TableCell>
      <TableCell className="overflow-hidden text-right font-medium">{formatMoney(sale.totalAmount)}</TableCell>
      <TableCell className="overflow-hidden">
        <SaleStatusBadge sale={sale} />
      </TableCell>
      <TableCell className="sticky right-0 z-10 border-l bg-card text-right transition-colors group-hover:bg-accent/45">
        <Button aria-label={`Abrir ${sale.correlativeCode}`} size="icon" type="button" variant="ghost" onClick={onOpen}>
          <Eye aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

type SaleDetailPanelProps = {
  canCancel: boolean;
  cancelReason: string;
  cancelReasonError: string | null;
  isCancelling: boolean;
  isLoading: boolean;
  onCancelReasonChange: (value: string) => void;
  onRequestCancellation: (event: FormEvent<HTMLFormElement>) => void;
  sale: CancelableSale | null;
};

function SaleDetailPanel({
  canCancel,
  cancelReason,
  cancelReasonError,
  isCancelling,
  isLoading,
  onCancelReasonChange,
  onRequestCancellation,
  sale
}: SaleDetailPanelProps) {
  if (isLoading && !sale) {
    return (
      <Card>
        <CardContent className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Cargando detalle de venta...
        </CardContent>
      </Card>
    );
  }

  if (!sale) {
    return (
      <Card>
        <CardContent>
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardCheck aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Selecciona una venta</EmptyTitle>
              <EmptyDescription>El detalle mostrará el pago, la caja, los productos y los lotes descontados.</EmptyDescription>
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
            <CardTitle>{sale.correlativeCode}</CardTitle>
            <CardDescription>
              Caja {sale.cashSessionCorrelativeCode} · {formatDateTime(sale.confirmedAt)}
            </CardDescription>
          </div>
          <SaleStatusBadge sale={sale} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <SaleInfo label="Vendedor" value={`${sale.sellerUser.fullName} · ${sale.sellerUser.email}`} />
          <SaleInfo label="Anulación" value={canCancel ? "Permitida" : getSaleCancellationBlockMessage(sale)} />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <AmountLine label="Total" value={formatMoney(sale.totalAmount)} />
          <AmountLine label="Recibido" value={formatMoney(sale.payment.receivedAmount)} />
          <AmountLine label="Cambio" value={formatMoney(sale.payment.changeAmount)} />
        </div>

        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2">
            <WalletCards aria-hidden="true" className="size-4 text-muted-foreground" />
            <p className="font-medium text-foreground">Pago</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <SaleInfo label="Método" value={sale.payment.method === "cash" ? "Efectivo" : sale.payment.method} />
            <SaleInfo label="Estado" value={paymentStatusLabels[sale.payment.status]} />
            <SaleInfo label="Pagado" value={formatDateTime(sale.payment.paidAt)} />
            {sale.payment.reversedAt ? <SaleInfo label="Anulado" value={formatDateTime(sale.payment.reversedAt)} /> : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="w-[76px] text-right">Cantidad</TableHead>
                <TableHead className="w-[110px] text-right">Unitario</TableHead>
                <TableHead className="w-[116px] text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
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
                  <TableCell className="text-right">{formatMoney(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <StockConsumptionList sale={sale} />

        {sale.cancelledAt ? (
          <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">Datos de la anulación</p>
            <SaleInfo label="Fecha" value={formatDateTime(sale.cancelledAt)} />
            <SaleInfo label="Motivo" value={sale.cancelReason ?? "Sin motivo"} />
            {sale.cancelledByUser ? <SaleInfo label="Usuario" value={`${sale.cancelledByUser.fullName} · ${sale.cancelledByUser.email}`} /> : null}
          </div>
        ) : null}

        <form className="grid gap-3 rounded-md border p-3" onSubmit={onRequestCancellation}>
          <Field>
            <FieldLabel>Motivo de anulación</FieldLabel>
            <Textarea
              disabled={!canCancel || isCancelling}
              maxLength={240}
              placeholder="Ej. error de cobro detectado antes del cierre de caja"
              value={cancelReason}
              onChange={(event) => onCancelReasonChange(event.currentTarget.value)}
            />
            <FieldDescription>{canCancel ? "Obligatorio. Quedará guardado en el historial." : getSaleCancellationBlockMessage(sale)}</FieldDescription>
            <FieldError>{cancelReasonError}</FieldError>
          </Field>
          <Button disabled={!canCancel || isCancelling} type="submit" variant="destructive">
            {isCancelling ? <Spinner /> : <Ban aria-hidden="true" />}
            Anular venta
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StockConsumptionList({ sale }: { sale: CancelableSale }) {
  const rows = sale.items.flatMap((item) =>
    item.consumptions.map((consumption) => ({
      batchNumber: consumption.batchNumber,
      expirationDate: consumption.expirationDate,
      id: consumption.id,
      productName: item.commercialName,
      quantity: consumption.quantity,
      totalCost: consumption.totalCost
    }))
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        No hay consumos de lote expuestos para esta venta.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Boxes aria-hidden="true" className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Consumos de lote</p>
      </div>
      <div className="grid gap-2">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-1 rounded-md border bg-background px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_110px_118px]">
            <p className="truncate font-medium text-foreground" title={row.productName}>
              {row.productName}
            </p>
            <p className="text-muted-foreground">{row.batchNumber ?? "Sin lote"}</p>
            <p className="text-muted-foreground">
              {quantityFormatter.format(row.quantity)} uds. · {formatDate(row.expirationDate)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaleStatusBadge({ sale }: { sale: CancelableSale | CancelableSaleSummary }) {
  if (sale.status === "cancelled") {
    return <Badge variant="destructive">{saleStatusLabels.cancelled}</Badge>;
  }

  if (sale.canCancel) {
    return <Badge variant="default">Anulable</Badge>;
  }

  return <Badge variant="secondary">{saleStatusLabels[sale.status]}</Badge>;
}

function SaleInfo({ label, value }: { label: string; value: string }) {
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
    <div className="rounded-lg border bg-card px-3.5 py-3 shadow-xs">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold tabular-nums tracking-[-0.02em] text-foreground" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function AmountLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Sin vencimiento";
  }

  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
