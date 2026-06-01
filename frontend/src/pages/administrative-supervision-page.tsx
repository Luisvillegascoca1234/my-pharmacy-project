import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  Ban,
  Banknote,
  ClipboardList,
  Eye,
  FileSearch,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBasket,
  Trash2,
  WalletCards
} from "lucide-react";
import type { CashSupervisionDataErrorCode, SupervisableCashSession } from "@/modules/cash-supervision";
import { useCashSupervision } from "@/modules/cash-supervision";
import type {
  PendingCart,
  PendingCartDataErrorCode,
  PendingCartRevalidationIssueCode,
  PendingCartStatus,
  PendingCartStatusFilter
} from "@/modules/pending-carts";
import { usePendingCarts } from "@/modules/pending-carts";
import type {
  CancelableSale,
  CancelableSaleStatus,
  CancelableSaleSummary,
  SalesDataErrorCode,
  SalesStatusFilter
} from "@/modules/sales";
import { useSales } from "@/modules/sales";
import { SALES_CANCELLATIONS_PATH } from "@/routes/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const moneyFormatter = new Intl.NumberFormat("es-BO", { currency: "BOB", maximumFractionDigits: 2, style: "currency" });
const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" });

const cashStatusLabels: Record<"all" | SupervisableCashSession["status"], string> = {
  all: "Todas",
  closed: "Cerradas",
  open: "Abiertas"
};

const cashErrorMessages: Record<CashSupervisionDataErrorCode, string> = {
  "already-closed": "La caja ya fue cerrada. Actualiza la supervisión antes de continuar.",
  "amount-invalid": "El monto contado final debe ser mayor o igual a cero y tener hasta dos decimales.",
  "cash-session-closed": "La caja ya no está abierta para cierre administrativo.",
  forbidden: "No tienes permiso para supervisar o cerrar esta caja.",
  "not-found": "No se encontró la caja solicitada.",
  "session-invalid": "Tu sesión no permite supervisar caja. Vuelve a iniciar sesión.",
  unknown: "No se pudo completar la supervisión de caja. Intenta nuevamente."
};

const saleStatusLabels: Record<SalesStatusFilter, string> = {
  all: "Todas",
  cancelled: "Anuladas",
  confirmed: "Confirmadas"
};

const saleErrorMessages: Record<SalesDataErrorCode, string> = {
  "cash-session-closed": "La caja asociada ya fue cerrada.",
  forbidden: "No tienes permiso para consultar esta venta.",
  "not-current-day": "La venta ya no corresponde al turno permitido.",
  "not-found": "No se encontró la venta solicitada.",
  "sale-already-cancelled": "La venta ya fue anulada.",
  "sale-not-cancelable": "La venta no cumple las reglas vigentes de anulación.",
  "session-invalid": "Tu sesión no permite supervisar ventas. Vuelve a iniciar sesión.",
  unknown: "No se pudo completar la consulta de ventas.",
  validation: "Revisa los filtros ingresados."
};

const pendingStatusLabels: Record<PendingCartStatusFilter, string> = {
  active: "Activos",
  all: "Todos",
  converted: "Convertidos",
  discarded: "Descartados",
  expired: "Vencidos"
};

const pendingErrorMessages: Record<PendingCartDataErrorCode, string> = {
  "cash-session-closed": "La caja activa no permite completar esta operación.",
  forbidden: "No tienes permiso para supervisar pendientes.",
  "not-found": "No se encontró el pendiente solicitado.",
  "pending-expired": "El pendiente ya venció.",
  "price-changed": "El pendiente tiene cambios de precio pendientes de revisión.",
  "product-not-saleable": "El pendiente contiene productos no vendibles.",
  "session-invalid": "Tu sesión no permite supervisar pendientes. Vuelve a iniciar sesión.",
  "stock-insufficient": "El pendiente contiene productos sin stock suficiente.",
  unknown: "No se pudo completar la operación sobre pendientes.",
  validation: "Revisa los datos ingresados."
};

const pendingIssueLabels: Record<PendingCartRevalidationIssueCode, string> = {
  "price-changed": "Precio cambiado",
  "product-not-saleable": "Producto no vendible",
  "stock-insufficient": "Stock insuficiente"
};

const cashStatusOptions = ["all", "open", "closed"] as const;
const saleStatusOptions: SalesStatusFilter[] = ["all", "confirmed", "cancelled"];
const pendingStatusOptions: PendingCartStatusFilter[] = ["active", "expired", "all", "converted", "discarded"];

export function AdministrativeSupervisionPage() {
  const navigate = useNavigate();
  const cash = useCashSupervision();
  const sales = useSales();
  const pending = usePendingCarts({ includeAllForSupervision: true });
  const [cashSellerInput, setCashSellerInput] = useState(cash.openedByUserId);
  const [salesSearchInput, setSalesSearchInput] = useState(sales.search);
  const [salesSellerInput, setSalesSellerInput] = useState(sales.sellerUserId);
  const [salesCashInput, setSalesCashInput] = useState(sales.cashSessionId);
  const [pendingSearchInput, setPendingSearchInput] = useState(pending.search);
  const [closeAmountInput, setCloseAmountInput] = useState("");
  const [closeNoteInput, setCloseNoteInput] = useState("");
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [discardTarget, setDiscardTarget] = useState<PendingCart | null>(null);
  const [discardReasonInput, setDiscardReasonInput] = useState("");
  const [discardError, setDiscardError] = useState<string | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const selectedCashSession = cash.selectedCashSession;
  const selectedSale = sales.selectedSale;
  const selectedPendingCart = pending.selectedCart;
  const isClosingCash = cash.closeStatus === "loading";
  const isDiscardingPending = pending.discardStatus === "loading";
  const closeDifference = useMemo(() => {
    if (!selectedCashSession) {
      return null;
    }

    const parsedAmount = Number(closeAmountInput);

    return Number.isFinite(parsedAmount) ? parsedAmount - selectedCashSession.expectedAmount : null;
  }, [closeAmountInput, selectedCashSession]);
  const cashSummary = useMemo(
    () => ({
      closed: cash.items.filter((item) => item.status === "closed").length,
      differences: cash.items.filter((item) => (item.differenceAmount ?? 0) !== 0).length,
      open: cash.items.filter((item) => item.status === "open").length
    }),
    [cash.items]
  );
  const salesSummary = useMemo(
    () => ({
      cancelable: sales.items.filter((item) => item.canCancel).length,
      cancelled: sales.items.filter((item) => item.status === "cancelled").length,
      totalAmount: sales.items.reduce((total, item) => total + item.totalAmount, 0)
    }),
    [sales.items]
  );
  const pendingSummary = useMemo(
    () => ({
      active: pending.items.filter((item) => item.status === "active").length,
      expired: pending.items.filter((item) => isPendingCartExpired(item)).length,
      withIssues: pending.items.filter((item) => getPendingCartIssues(item).length > 0).length
    }),
    [pending.items]
  );
  const cashError = closeError ?? (cash.error ? cashErrorMessages[cash.error.code] : null);
  const salesError = sales.error ? saleErrorMessages[sales.error.code] : null;
  const pendingError = discardError ?? (pending.error ? pendingErrorMessages[pending.error.code] : null);
  const canUseAdministrativeViews = cash.canSupervise && sales.canSupervise && pending.canSupervise;

  function applyCashFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cash.setOpenedByUserId(cashSellerInput);
  }

  function clearCashFilters() {
    setCashSellerInput("");
    cash.setOpenedByUserId("");
    cash.setFromDate("");
    cash.setToDate("");
    cash.setStatus("open");
  }

  function requestCloseCashSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCloseError(null);

    if (!selectedCashSession) {
      setCloseError("Selecciona una caja abierta para cierre administrativo.");
      return;
    }

    if (selectedCashSession.status !== "open" || selectedCashSession.canClose === false) {
      setCloseError("Esta caja no está habilitada para cierre administrativo.");
      return;
    }

    const parsedAmount = Number(closeAmountInput);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setCloseError("El monto contado final debe ser un número mayor o igual a cero.");
      return;
    }

    setCloseDialogOpen(true);
  }

  async function confirmCloseCashSession() {
    if (!selectedCashSession) {
      return;
    }

    const parsedAmount = Number(closeAmountInput);
    const closedCashSession = await cash.closeCashSession(selectedCashSession.id, {
      closingNote: closeNoteInput,
      countedAmount: parsedAmount
    });

    if (closedCashSession) {
      setCloseAmountInput("");
      setCloseNoteInput("");
      setCloseDialogOpen(false);
    }
  }

  function applySalesFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sales.setSearch(salesSearchInput);
    sales.setSellerUserId(salesSellerInput);
    sales.setCashSessionId(salesCashInput);
  }

  function clearSalesFilters() {
    setSalesSearchInput("");
    setSalesSellerInput("");
    setSalesCashInput("");
    sales.setSearch("");
    sales.setSellerUserId("");
    sales.setCashSessionId("");
    sales.setFromDate("");
    sales.setToDate("");
    sales.setStatus("all");
  }

  async function openSaleDetail(saleId: string) {
    sales.selectSale(saleId);
    await sales.loadSale(saleId);
  }

  function openCancellationFlow(saleId: string) {
    navigate(`${SALES_CANCELLATIONS_PATH}?saleId=${encodeURIComponent(saleId)}`);
  }

  function applyPendingFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pending.setSearch(pendingSearchInput);
  }

  function clearPendingFilters() {
    setPendingSearchInput("");
    pending.setSearch("");
    pending.setStatus("active");
  }

  function requestDiscardPendingCart(cart: PendingCart) {
    setDiscardTarget(cart);
    setDiscardReasonInput("");
    setDiscardError(null);
    setDiscardDialogOpen(true);
  }

  async function confirmDiscardPendingCart() {
    if (!discardTarget) {
      return;
    }

    const discardedCart = await pending.discardCart(discardTarget.id, {
      discardReason: discardReasonInput
    });

    if (discardedCart) {
      setDiscardDialogOpen(false);
      setDiscardReasonInput("");
      await pending.reload();
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Intervención administrativa
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Supervisión POS</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Control de cajas de vendedores, ventas anulables y pendientes obsoletos en mostrador.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[620px]">
          <Metric label="Cajas abiertas" value={cashSummary.open} />
          <Metric label="Ventas anulables" value={salesSummary.cancelable} />
          <Metric label="Pendientes vencidos" value={pendingSummary.expired} />
        </div>
      </div>

      {!canUseAdministrativeViews ? (
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>Tu usuario no tiene permisos para supervisión administrativa de caja, ventas y pendientes.</AlertDescription>
        </Alert>
      ) : null}

      {cash.lastClosedCashSession ? (
        <Alert>
          <BadgeCheck aria-hidden="true" />
          <AlertTitle>Caja cerrada administrativamente</AlertTitle>
          <AlertDescription>
            {cash.lastClosedCashSession.correlativeCode} quedó cerrada con diferencia{" "}
            {formatMoney(cash.lastClosedCashSession.differenceAmount ?? 0)}
            {cash.lastClosedCashSession.closedByUser ? ` por ${cash.lastClosedCashSession.closedByUser.fullName}.` : "."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs className="gap-4" defaultValue="cash">
        <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="cash">
            <WalletCards aria-hidden="true" />
            Cajas
          </TabsTrigger>
          <TabsTrigger value="sales">
            <ClipboardList aria-hidden="true" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="pending">
            <ShoppingBasket aria-hidden="true" />
            Pendientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cash">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <Card>
              <CardHeader className="gap-4">
                <HeaderWithRefresh
                  description="Estado, responsable, apertura, esperado y diferencia de cajas de vendedores."
                  disabled={!cash.canSupervise || cash.listStatus === "loading"}
                  isLoading={cash.listStatus === "loading"}
                  title="Cajas supervisables"
                  onRefresh={() => void cash.reload()}
                />
                <form className="grid gap-3 lg:grid-cols-[160px_160px_160px_minmax(0,1fr)_auto_auto]" onSubmit={applyCashFilters}>
                  <Input disabled={!cash.canSupervise} type="date" value={cash.fromDate} onChange={(event) => cash.setFromDate(event.currentTarget.value)} />
                  <Input disabled={!cash.canSupervise} type="date" value={cash.toDate} onChange={(event) => cash.setToDate(event.currentTarget.value)} />
                  <NativeSelect
                    className="w-full"
                    disabled={!cash.canSupervise}
                    value={cash.status}
                    onChange={(event) => cash.setStatus(event.currentTarget.value as (typeof cashStatusOptions)[number])}
                  >
                    {cashStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {cashStatusLabels[option]}
                      </option>
                    ))}
                  </NativeSelect>
                  <Input
                    disabled={!cash.canSupervise}
                    placeholder="ID de vendedor"
                    value={cashSellerInput}
                    onChange={(event) => setCashSellerInput(event.currentTarget.value)}
                  />
                  <Button disabled={!cash.canSupervise || cash.listStatus === "loading"} type="submit">
                    <Search aria-hidden="true" />
                    Filtrar
                  </Button>
                  <Button disabled={!cash.canSupervise || cash.listStatus === "loading"} type="button" variant="outline" onClick={clearCashFilters}>
                    Limpiar
                  </Button>
                </form>
              </CardHeader>
              <CardContent className="grid gap-4">
                {cashError ? (
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle>No se pudo operar caja</AlertTitle>
                    <AlertDescription>{cashError}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[136px]">Caja</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="w-[148px]">Apertura</TableHead>
                        <TableHead className="w-[116px] text-right">Esperado</TableHead>
                        <TableHead className="w-[116px] text-right">Diferencia</TableHead>
                        <TableHead className="w-[104px]">Estado</TableHead>
                        <TableHead className="w-[84px] text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cash.items.map((cashSession) => (
                        <CashSessionRow
                          key={cashSession.id}
                          cashSession={cashSession}
                          isSelected={cashSession.id === cash.selectedCashSessionId}
                          onSelect={() => cash.selectCashSession(cashSession.id)}
                        />
                      ))}
                      {cash.items.length === 0 ? (
                        <EmptyTableRow
                          colSpan={7}
                          description={
                            cash.listStatus === "loading"
                              ? "Consultando cajas según filtros administrativos."
                              : "No hay cajas visibles para los filtros actuales."
                          }
                          icon={cash.listStatus === "loading" ? <Spinner /> : <FileSearch aria-hidden="true" />}
                          title={cash.listStatus === "loading" ? "Cargando cajas" : "Sin cajas"}
                        />
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
                <PaginationFooter
                  disabled={!cash.canSupervise || cash.listStatus === "loading"}
                  page={cash.pagination.page}
                  totalPages={cash.pagination.totalPages}
                  onNext={() => cash.setPage(cash.pagination.page + 1)}
                  onPrevious={() => cash.setPage(cash.pagination.page - 1)}
                >
                  Abiertas: {cashSummary.open}. Cerradas: {cashSummary.closed}. Con diferencia: {cashSummary.differences}.
                </PaginationFooter>
              </CardContent>
            </Card>

            <CashClosePanel
              closeAmount={closeAmountInput}
              closeDifference={closeDifference}
              closeError={closeError}
              closeNote={closeNoteInput}
              isClosing={isClosingCash}
              selectedCashSession={selectedCashSession}
              onCloseAmountChange={setCloseAmountInput}
              onCloseNoteChange={setCloseNoteInput}
              onRequestClose={requestCloseCashSession}
            />
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <Card>
              <CardHeader className="gap-4">
                <HeaderWithRefresh
                  description="Ventas de mostrador con filtros de fecha, vendedor, caja y estado."
                  disabled={!sales.canSupervise || sales.listStatus === "loading"}
                  isLoading={sales.listStatus === "loading"}
                  title="Ventas supervisables"
                  onRefresh={() => void sales.reload()}
                />
                <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_150px_auto_auto]" onSubmit={applySalesFilters}>
                  <div className="relative">
                    <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      disabled={!sales.canSupervise}
                      placeholder="Correlativo o texto de venta"
                      value={salesSearchInput}
                      onChange={(event) => setSalesSearchInput(event.currentTarget.value)}
                    />
                  </div>
                  <Input
                    disabled={!sales.canSupervise}
                    type="date"
                    value={sales.fromDate}
                    onChange={(event) => sales.setFromDate(event.currentTarget.value)}
                  />
                  <Input
                    disabled={!sales.canSupervise}
                    type="date"
                    value={sales.toDate}
                    onChange={(event) => sales.setToDate(event.currentTarget.value)}
                  />
                  <NativeSelect
                    className="w-full"
                    disabled={!sales.canSupervise}
                    value={sales.status}
                    onChange={(event) => sales.setStatus(event.currentTarget.value as SalesStatusFilter)}
                  >
                    {saleStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {saleStatusLabels[option]}
                      </option>
                    ))}
                  </NativeSelect>
                  <Button disabled={!sales.canSupervise || sales.listStatus === "loading"} type="submit">
                    <Search aria-hidden="true" />
                    Filtrar
                  </Button>
                  <Button disabled={!sales.canSupervise || sales.listStatus === "loading"} type="button" variant="outline" onClick={clearSalesFilters}>
                    Limpiar
                  </Button>
                </form>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    disabled={!sales.canSupervise}
                    placeholder="ID de vendedor"
                    value={salesSellerInput}
                    onChange={(event) => setSalesSellerInput(event.currentTarget.value)}
                  />
                  <Input
                    disabled={!sales.canSupervise}
                    placeholder="ID de caja"
                    value={salesCashInput}
                    onChange={(event) => setSalesCashInput(event.currentTarget.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {salesError ? (
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle>No se pudo consultar ventas</AlertTitle>
                    <AlertDescription>{salesError}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[136px]">Venta</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="w-[136px]">Caja</TableHead>
                        <TableHead className="w-[148px]">Fecha</TableHead>
                        <TableHead className="w-[118px] text-right">Total</TableHead>
                        <TableHead className="w-[116px]">Estado</TableHead>
                        <TableHead className="w-[84px] text-right">Detalle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.items.map((sale) => (
                        <SalesSupervisionRow
                          key={sale.id}
                          isSelected={sale.id === sales.selectedSaleId}
                          sale={sale}
                          onOpen={() => void openSaleDetail(sale.id)}
                        />
                      ))}
                      {sales.items.length === 0 ? (
                        <EmptyTableRow
                          colSpan={7}
                          description={
                            sales.listStatus === "loading"
                              ? "Consultando ventas según filtros administrativos."
                              : "No hay ventas visibles para los filtros actuales."
                          }
                          icon={sales.listStatus === "loading" ? <Spinner /> : <FileSearch aria-hidden="true" />}
                          title={sales.listStatus === "loading" ? "Cargando ventas" : "Sin ventas"}
                        />
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
                <PaginationFooter
                  disabled={!sales.canSupervise || sales.listStatus === "loading"}
                  page={sales.pagination.page}
                  totalPages={sales.pagination.totalPages}
                  onNext={() => sales.setPage(sales.pagination.page + 1)}
                  onPrevious={() => sales.setPage(sales.pagination.page - 1)}
                >
                  Anulables: {salesSummary.cancelable}. Anuladas: {salesSummary.cancelled}. Importe visible: {formatMoney(salesSummary.totalAmount)}.
                </PaginationFooter>
              </CardContent>
            </Card>

            <SaleSupervisionDetailPanel
              isLoading={sales.detailStatus === "loading"}
              sale={selectedSale}
              onOpenCancellationFlow={openCancellationFlow}
            />
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <Card>
              <CardHeader className="gap-4">
                <HeaderWithRefresh
                  description="Pendientes de todos los vendedores, expiración y descarte supervisado."
                  disabled={!pending.canSupervise || pending.listStatus === "loading"}
                  isLoading={pending.listStatus === "loading"}
                  title="Pendientes globales"
                  onRefresh={() => void pending.reload()}
                />
                <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_auto_auto]" onSubmit={applyPendingFilters}>
                  <div className="relative">
                    <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      disabled={!pending.canSupervise}
                      placeholder="Nombre, nota o vendedor"
                      value={pendingSearchInput}
                      onChange={(event) => setPendingSearchInput(event.currentTarget.value)}
                    />
                  </div>
                  <NativeSelect
                    className="w-full"
                    disabled={!pending.canSupervise}
                    value={pending.status}
                    onChange={(event) => pending.setStatus(event.currentTarget.value as PendingCartStatusFilter)}
                  >
                    {pendingStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {pendingStatusLabels[option]}
                      </option>
                    ))}
                  </NativeSelect>
                  <Button disabled={!pending.canSupervise || pending.listStatus === "loading"} type="submit">
                    <Search aria-hidden="true" />
                    Filtrar
                  </Button>
                  <Button disabled={!pending.canSupervise || pending.listStatus === "loading"} type="button" variant="outline" onClick={clearPendingFilters}>
                    Limpiar
                  </Button>
                </form>
              </CardHeader>
              <CardContent className="grid gap-4">
                {pendingError ? (
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle>No se pudo operar pendientes</AlertTitle>
                    <AlertDescription>{pendingError}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pendiente</TableHead>
                        <TableHead className="w-[170px]">Vendedor</TableHead>
                        <TableHead className="w-[138px]">Expiración</TableHead>
                        <TableHead className="w-[118px] text-right">Total</TableHead>
                        <TableHead className="w-[118px]">Estado</TableHead>
                        <TableHead className="w-[104px] text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.items.map((cart) => (
                        <PendingCartRow
                          key={cart.id}
                          cart={cart}
                          isDiscarding={isDiscardingPending && discardTarget?.id === cart.id}
                          isSelected={cart.id === pending.selectedCartId}
                          onDiscard={() => requestDiscardPendingCart(cart)}
                          onSelect={() => pending.selectCart(cart.id)}
                        />
                      ))}
                      {pending.items.length === 0 ? (
                        <EmptyTableRow
                          colSpan={6}
                          description={
                            pending.listStatus === "loading"
                              ? "Consultando pendientes de todos los vendedores."
                              : "No hay pendientes visibles para los filtros actuales."
                          }
                          icon={pending.listStatus === "loading" ? <Spinner /> : <FileSearch aria-hidden="true" />}
                          title={pending.listStatus === "loading" ? "Cargando pendientes" : "Sin pendientes"}
                        />
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
                <PaginationFooter
                  disabled={!pending.canSupervise || pending.listStatus === "loading"}
                  page={pending.pagination.page}
                  totalPages={pending.pagination.totalPages}
                  onNext={() => pending.setPage(pending.pagination.page + 1)}
                  onPrevious={() => pending.setPage(pending.pagination.page - 1)}
                >
                  Activos: {pendingSummary.active}. Vencidos: {pendingSummary.expired}. Con observaciones: {pendingSummary.withIssues}.
                </PaginationFooter>
              </CardContent>
            </Card>

            <PendingCartDetailPanel cart={selectedPendingCart} />
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Banknote aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Confirmar cierre administrativo</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCashSession
                ? `Cerrarás ${selectedCashSession.correlativeCode} de ${selectedCashSession.openedByUser.fullName} con contado final ${formatMoney(Number(closeAmountInput || 0))}.`
                : "Selecciona una caja abierta antes de confirmar."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClosingCash}>Volver</AlertDialogCancel>
            <AlertDialogAction
              disabled={isClosingCash}
              onClick={(event) => {
                event.preventDefault();
                void confirmCloseCashSession();
              }}
            >
              {isClosingCash ? <Spinner /> : <Banknote aria-hidden="true" />}
              Cerrar caja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Descartar pendiente</AlertDialogTitle>
            <AlertDialogDescription>
              {discardTarget
                ? `El pendiente ${getPendingCartDisplayName(discardTarget)} quedará descartado y no podrá cobrarse desde POS.`
                : "Selecciona un pendiente antes de confirmar."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field>
            <FieldLabel>Motivo de descarte</FieldLabel>
            <Textarea
              disabled={isDiscardingPending}
              maxLength={240}
              placeholder="Ej. pendiente vencido o pedido duplicado"
              value={discardReasonInput}
              onChange={(event) => setDiscardReasonInput(event.currentTarget.value)}
            />
            <FieldDescription>Opcional, queda asociado al pendiente supervisado.</FieldDescription>
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDiscardingPending}>Volver</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDiscardingPending}
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void confirmDiscardPendingCart();
              }}
            >
              {isDiscardingPending ? <Spinner /> : <Trash2 aria-hidden="true" />}
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

type HeaderWithRefreshProps = {
  description: string;
  disabled: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  title: string;
};

function HeaderWithRefresh({ description, disabled, isLoading, onRefresh, title }: HeaderWithRefreshProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <Button disabled={disabled} size="sm" type="button" variant="outline" onClick={onRefresh}>
        {isLoading ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
        Actualizar
      </Button>
    </div>
  );
}

type CashSessionRowProps = {
  cashSession: SupervisableCashSession;
  isSelected: boolean;
  onSelect: () => void;
};

function CashSessionRow({ cashSession, isSelected, onSelect }: CashSessionRowProps) {
  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell className="min-w-0">
        <p className="truncate font-medium text-foreground" title={cashSession.correlativeCode}>
          {cashSession.correlativeCode}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={cashSession.id}>
          {cashSession.id}
        </p>
      </TableCell>
      <TableCell className="min-w-0">
        <p className="truncate" title={cashSession.openedByUser.fullName}>
          {cashSession.openedByUser.fullName}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={cashSession.openedByUser.email}>
          {cashSession.openedByUser.email}
        </p>
      </TableCell>
      <TableCell>{formatDateTime(cashSession.openedAt)}</TableCell>
      <TableCell className="text-right font-medium">{formatMoney(cashSession.expectedAmount)}</TableCell>
      <TableCell className={getDifferenceClassName(cashSession.differenceAmount)}>
        {cashSession.differenceAmount === undefined ? "Pendiente" : formatMoney(cashSession.differenceAmount)}
      </TableCell>
      <TableCell>
        <CashStatusBadge cashSession={cashSession} />
      </TableCell>
      <TableCell className="text-right">
        <Button aria-label={`Seleccionar ${cashSession.correlativeCode}`} size="icon" type="button" variant="ghost" onClick={onSelect}>
          <Eye aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

type CashClosePanelProps = {
  closeAmount: string;
  closeDifference: number | null;
  closeError: string | null;
  closeNote: string;
  isClosing: boolean;
  onCloseAmountChange: (value: string) => void;
  onCloseNoteChange: (value: string) => void;
  onRequestClose: (event: FormEvent<HTMLFormElement>) => void;
  selectedCashSession: SupervisableCashSession | null;
};

function CashClosePanel({
  closeAmount,
  closeDifference,
  closeError,
  closeNote,
  isClosing,
  onCloseAmountChange,
  onCloseNoteChange,
  onRequestClose,
  selectedCashSession
}: CashClosePanelProps) {
  if (!selectedCashSession) {
    return (
      <Card>
        <CardContent>
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WalletCards aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Selecciona una caja</EmptyTitle>
              <EmptyDescription>El cierre administrativo se habilita para cajas abiertas de vendedores.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  const canClose = selectedCashSession.status === "open" && selectedCashSession.canClose !== false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cierre administrativo</CardTitle>
        <CardDescription>
          {selectedCashSession.correlativeCode} abierta por {selectedCashSession.openedByUser.fullName}.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
          <DetailLine label="Apertura" value={formatDateTime(selectedCashSession.openedAt)} />
          <DetailLine label="Monto inicial" value={formatMoney(selectedCashSession.initialAmount)} />
          <DetailLine label="Esperado" value={formatMoney(selectedCashSession.expectedAmount)} />
          <DetailLine label="Responsable de apertura" value={`${selectedCashSession.openedByUser.fullName} · ${selectedCashSession.openedByUser.email}`} />
          {selectedCashSession.closedByUser ? (
            <DetailLine label="Responsable de cierre" value={`${selectedCashSession.closedByUser.fullName} · ${selectedCashSession.closedByUser.email}`} />
          ) : null}
        </div>

        <form className="grid gap-4" onSubmit={onRequestClose}>
          <Field>
            <FieldLabel>Monto contado final</FieldLabel>
            <Input
              disabled={!canClose || isClosing}
              min="0"
              step="0.01"
              type="number"
              value={closeAmount}
              onChange={(event) => onCloseAmountChange(event.currentTarget.value)}
            />
            <FieldDescription>
              {closeDifference === null ? "Ingresa el conteo físico final." : `Diferencia estimada: ${formatMoney(closeDifference)}.`}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Nota administrativa</FieldLabel>
            <Textarea
              disabled={!canClose || isClosing}
              maxLength={240}
              placeholder="Ej. cierre por ausencia del vendedor responsable"
              value={closeNote}
              onChange={(event) => onCloseNoteChange(event.currentTarget.value)}
            />
            <FieldDescription>Opcional, queda asociada al cierre de caja ajena.</FieldDescription>
            <FieldError>{closeError}</FieldError>
          </Field>
          <Button disabled={!canClose || isClosing} type="submit">
            {isClosing ? <Spinner /> : <Banknote aria-hidden="true" />}
            Preparar cierre
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type SalesSupervisionRowProps = {
  isSelected: boolean;
  onOpen: () => void;
  sale: CancelableSaleSummary;
};

function SalesSupervisionRow({ isSelected, onOpen, sale }: SalesSupervisionRowProps) {
  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
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
        <SaleStatusBadge sale={sale} />
      </TableCell>
      <TableCell className="text-right">
        <Button aria-label={`Abrir ${sale.correlativeCode}`} size="icon" type="button" variant="ghost" onClick={onOpen}>
          <Eye aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

type SaleSupervisionDetailPanelProps = {
  isLoading: boolean;
  onOpenCancellationFlow: (saleId: string) => void;
  sale: CancelableSale | null;
};

function SaleSupervisionDetailPanel({ isLoading, onOpenCancellationFlow, sale }: SaleSupervisionDetailPanelProps) {
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
                <ClipboardList aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Selecciona una venta</EmptyTitle>
              <EmptyDescription>El detalle administrativo mostrará caja, vendedor, pago y acceso a anulación permitida.</EmptyDescription>
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
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
          <DetailLine label="Vendedor" value={`${sale.sellerUser.fullName} · ${sale.sellerUser.email}`} />
          <DetailLine label="ID de caja" value={sale.cashSessionId} />
          <DetailLine label="Total" value={formatMoney(sale.totalAmount)} />
          <DetailLine label="Recibido" value={formatMoney(sale.payment.receivedAmount)} />
          <DetailLine label="Cambio" value={formatMoney(sale.payment.changeAmount)} />
          {sale.cancelledByUser ? <DetailLine label="Usuario que anuló" value={`${sale.cancelledByUser.fullName} · ${sale.cancelledByUser.email}`} /> : null}
          {sale.cancelReason ? <DetailLine label="Motivo de anulación" value={sale.cancelReason} /> : null}
        </div>
        <div className="grid gap-2">
          {sale.items.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
              <span className="min-w-0 truncate text-foreground" title={item.commercialName}>
                {item.commercialName}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {quantityFormatter.format(item.quantity)} · {formatMoney(item.subtotal)}
              </span>
            </div>
          ))}
          {sale.items.length > 4 ? <p className="text-xs text-muted-foreground">+{sale.items.length - 4} ítems adicionales.</p> : null}
        </div>
        <Button disabled={!sale.canCancel || sale.status === "cancelled"} type="button" onClick={() => onOpenCancellationFlow(sale.id)}>
          <Ban aria-hidden="true" />
          Abrir anulación
        </Button>
      </CardContent>
    </Card>
  );
}

type PendingCartRowProps = {
  cart: PendingCart;
  isDiscarding: boolean;
  isSelected: boolean;
  onDiscard: () => void;
  onSelect: () => void;
};

function PendingCartRow({ cart, isDiscarding, isSelected, onDiscard, onSelect }: PendingCartRowProps) {
  const canDiscard = cart.status === "active" || cart.status === "expired";
  const issues = getPendingCartIssues(cart);

  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell className="min-w-0">
        <button className="grid max-w-full text-left" type="button" onClick={onSelect}>
          <span className="truncate font-medium text-foreground" title={getPendingCartDisplayName(cart)}>
            {getPendingCartDisplayName(cart)}
          </span>
          <span className="truncate text-xs text-muted-foreground" title={cart.id}>
            {cart.items.length} ítems · {cart.id}
          </span>
        </button>
      </TableCell>
      <TableCell className="min-w-0">
        <p className="truncate" title={cart.ownerUser?.fullName ?? cart.ownerUserId}>
          {cart.ownerUser?.fullName ?? cart.ownerUserId}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={cart.ownerUser?.email ?? cart.ownerUserId}>
          {cart.ownerUser?.email ?? "Sin correo expuesto"}
        </p>
      </TableCell>
      <TableCell>
        <p className={isPendingCartExpired(cart) ? "font-medium text-destructive" : "text-muted-foreground"}>{getPendingExpirationText(cart)}</p>
      </TableCell>
      <TableCell className="text-right font-medium">{formatMoney(cart.currentTotalAmount ?? cart.referenceTotalAmount)}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <PendingStatusBadge status={cart.status} />
          {issues.length > 0 ? <span className="text-xs text-muted-foreground">{issues.length} obs.</span> : null}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button disabled={!canDiscard || isDiscarding} size="icon" type="button" variant="ghost" aria-label={`Descartar ${getPendingCartDisplayName(cart)}`} onClick={onDiscard}>
          {isDiscarding ? <Spinner /> : <Trash2 aria-hidden="true" />}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function PendingCartDetailPanel({ cart }: { cart: PendingCart | null }) {
  if (!cart) {
    return (
      <Card>
        <CardContent>
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBasket aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Selecciona un pendiente</EmptyTitle>
              <EmptyDescription>El detalle mostrará expiración, vendedor, totales y observaciones de revalidación.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  const issues = getPendingCartIssues(cart);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{getPendingCartDisplayName(cart)}</CardTitle>
            <CardDescription>{cart.ownerUser ? `${cart.ownerUser.fullName} · ${cart.ownerUser.email}` : cart.ownerUserId}</CardDescription>
          </div>
          <PendingStatusBadge status={cart.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
          <DetailLine label="Creado" value={formatDateTime(cart.createdAt)} />
          <DetailLine label="Expira" value={formatDateTime(cart.expiresAt)} />
          <DetailLine label="Total referencial" value={formatMoney(cart.referenceTotalAmount)} />
          <DetailLine label="Total actual" value={formatMoney(cart.currentTotalAmount ?? cart.referenceTotalAmount)} />
          {cart.discardReason ? <DetailLine label="Motivo de descarte" value={cart.discardReason} /> : null}
        </div>
        {cart.note ? <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">{cart.note}</div> : null}
        <div className="grid gap-2">
          {cart.items.map((item) => (
            <div key={item.productId} className="grid gap-1 rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-medium text-foreground" title={item.commercialName}>
                  {item.commercialName}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {quantityFormatter.format(item.quantity)} · {formatMoney(item.currentUnitPrice ?? item.referenceUnitPrice)}
                </span>
              </div>
              {item.revalidationIssues?.length ? (
                <p className="text-xs text-destructive">{item.revalidationIssues.map((issue) => pendingIssueLabels[issue.code]).join(", ")}</p>
              ) : null}
            </div>
          ))}
        </div>
        {issues.length > 0 ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Observaciones de revalidación</AlertTitle>
            <AlertDescription>{issues.map((issue) => pendingIssueLabels[issue.code]).join(", ")}.</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

type EmptyTableRowProps = {
  colSpan: number;
  description: string;
  icon: ReactNode;
  title: string;
};

function EmptyTableRow({ colSpan, description, icon, title }: EmptyTableRowProps) {
  return (
    <TableRow>
      <TableCell className="h-64" colSpan={colSpan}>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">{icon}</EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </TableCell>
    </TableRow>
  );
}

type PaginationFooterProps = {
  children: ReactNode;
  disabled: boolean;
  onNext: () => void;
  onPrevious: () => void;
  page: number;
  totalPages: number;
};

function PaginationFooter({ children, disabled, onNext, onPrevious, page, totalPages }: PaginationFooterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Página {page} de {Math.max(totalPages, 1)}. {children}
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

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-medium text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}

function CashStatusBadge({ cashSession }: { cashSession: SupervisableCashSession }) {
  if (cashSession.status === "open") {
    return <Badge variant={cashSession.canClose === false ? "secondary" : "default"}>Abierta</Badge>;
  }

  return <Badge variant="secondary">Cerrada</Badge>;
}

function SaleStatusBadge({ sale }: { sale: CancelableSale | CancelableSaleSummary }) {
  if (sale.status === "cancelled") {
    return <Badge variant="destructive">Anulada</Badge>;
  }

  if (sale.canCancel) {
    return <Badge variant="default">Anulable</Badge>;
  }

  return <Badge variant="secondary">{saleStatusLabels[sale.status as CancelableSaleStatus]}</Badge>;
}

function PendingStatusBadge({ status }: { status: PendingCartStatus }) {
  if (status === "expired") {
    return <Badge variant="destructive">Vencido</Badge>;
  }

  if (status === "active") {
    return <Badge variant="default">Activo</Badge>;
  }

  return <Badge variant="secondary">{pendingStatusLabels[status]}</Badge>;
}

function getDifferenceClassName(value?: number) {
  if (value === undefined) {
    return "text-right text-muted-foreground";
  }

  return value === 0 ? "text-right font-medium text-foreground" : "text-right font-semibold text-destructive";
}

function getPendingCartDisplayName(cart: PendingCart) {
  return cart.name?.trim() || `Pendiente ${cart.id.slice(0, 8)}`;
}

function getPendingCartIssues(cart: PendingCart) {
  return cart.revalidationIssues ?? cart.items.flatMap((item) => item.revalidationIssues ?? []);
}

function isPendingCartExpired(cart: PendingCart) {
  return cart.status === "expired" || new Date(cart.expiresAt).getTime() < Date.now();
}

function getPendingExpirationText(cart: PendingCart) {
  return isPendingCartExpired(cart) ? "Vencido" : formatDateTime(cart.expiresAt);
}

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
