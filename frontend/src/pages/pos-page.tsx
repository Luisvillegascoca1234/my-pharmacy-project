import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { PosProduct, Sale, SaleReceipt } from "@pharmacy-pos/shared";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  BadgeCheck,
  Banknote,
  Barcode,
  Boxes,
  CalendarClock,
  ClipboardList,
  Eye,
  FileClock,
  Minus,
  PackageSearch,
  Plus,
  ReceiptText,
  RefreshCcw,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  Undo2,
  WalletCards,
  X
} from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCashSession } from "@/modules/cash";
import {
  type PendingCart,
  type PendingCartDataError,
  type PendingCartDataErrorCode,
  type PendingCartItem,
  type PendingCartRevalidationIssue,
  usePendingCarts
} from "@/modules/pending-carts";
import { type PosCartItem, type PosDataError, type PosDataErrorCode, usePos } from "@/modules/pos";
import { SALES_CANCELLATIONS_PATH } from "@/routes/navigation";

const POS_SEARCH_DEBOUNCE_MS = 300;
const NEAR_EXPIRATION_DAYS = 30;

const moneyFormatter = new Intl.NumberFormat("es-BO", { currency: "BOB", maximumFractionDigits: 2, style: "currency" });
const dateFormatter = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" });
const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });

const errorMessages: Record<PosDataErrorCode, string> = {
  "cart-empty": "Agrega al menos un producto antes de cobrar.",
  "cash-session-closed": "Abre una caja propia para confirmar ventas de mostrador.",
  "cash-session-invalid": "La caja abierta no corresponde a tu usuario o ya no está operativa.",
  "payment-insufficient": "El monto recibido debe cubrir el total de la venta.",
  "product-not-saleable": "El producto ya no está disponible para venta. Retíralo del carrito y vuelve a buscarlo.",
  "session-invalid": "Tu sesión no permite operar ventas en este momento. Vuelve a iniciar sesión.",
  "stock-insufficient": "La cantidad solicitada supera el stock vendible disponible.",
  unknown: "No se pudo completar la operación POS. Intenta nuevamente."
};

const pendingErrorMessages: Record<PendingCartDataErrorCode, string> = {
  "cash-session-closed": "Abre una caja propia para cobrar este pendiente.",
  forbidden: "No tienes permiso para operar este pendiente.",
  "pending-expired": "Este pendiente expiró y no puede cobrarse.",
  "price-changed": "El precio cambió. Revisa el total vigente antes de cobrar.",
  "product-not-saleable": "Un producto del pendiente ya no está disponible para venta.",
  "session-invalid": "Tu sesión no permite operar pendientes en este momento. Vuelve a iniciar sesión.",
  "stock-insufficient": "El stock actual no alcanza para cobrar este pendiente.",
  validation: "Revisa el nombre, nota e ítems del pendiente.",
  "not-found": "No se encontró el pendiente seleccionado.",
  unknown: "No se pudo completar la operación con el pendiente. Intenta nuevamente."
};

type PosPageProps = {
  focus?: "pos" | "pending";
};

export function PosPage({ focus = "pos" }: PosPageProps) {
  const navigate = useNavigate();
  const cash = useCashSession();
  const isCashOpen = cash.current.isOpen && Boolean(cash.current.cashSession);
  const pos = usePos({ autoSearchProducts: isCashOpen });
  const pending = usePendingCarts();
  const [searchInput, setSearchInput] = useState(pos.search);
  const [codeInput, setCodeInput] = useState(pos.code);
  const [receivedAmountInput, setReceivedAmountInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<string | null>(null);
  const [isPendingSaveDialogOpen, setPendingSaveDialogOpen] = useState(false);
  const [pendingNameInput, setPendingNameInput] = useState("");
  const [pendingNoteInput, setPendingNoteInput] = useState("");
  const [discardTarget, setDiscardTarget] = useState<PendingCart | null>(null);
  const debouncedSearchInput = useDebouncedValue(searchInput, POS_SEARCH_DEBOUNCE_MS);
  const debouncedCodeInput = useDebouncedValue(codeInput, POS_SEARCH_DEBOUNCE_MS);

  const isLoadingCash = cash.currentStatus === "loading";
  const isSearching = pos.searchStatus === "loading";
  const isConfirming = pos.saleStatus === "loading";
  const isSavingPending = pending.saveStatus === "loading";
  const isConvertingPending = pending.convertStatus === "loading";
  const isDiscardingPending = pending.discardStatus === "loading";
  const isCartBusy = isConfirming || isSavingPending || isConvertingPending;
  const isSearchLocked = !pos.canSell;
  const isCheckoutLocked = !pos.canSell || !isCashOpen;
  const activePendingCart = pending.selectedCart?.status === "active" || pending.selectedCart?.status === "expired" ? pending.selectedCart : null;
  const hasActivePendingCart = Boolean(activePendingCart);
  const isActivePendingExpired = activePendingCart ? isPendingCartExpired(activePendingCart) : false;
  const hasBlockingPendingIssue = activePendingCart ? hasBlockingIssuesForCart(activePendingCart, pos.cartItems) : false;
  const hasPendingOperationError =
    isPendingRequestFailure(pending.saveStatus) || isPendingRequestFailure(pending.convertStatus) || isPendingRequestFailure(pending.discardStatus);
  const visiblePendingCarts = useMemo(() => pending.items.filter((cart) => cart.status === "active" || cart.status === "expired"), [pending.items]);
  const hasInvalidCartQuantity = pos.cartItems.some((item) => item.quantity <= 0 || !Number.isInteger(item.quantity));
  const receivedAmount = toNonNegativeNumber(receivedAmountInput);
  const isPaymentInsufficient = receivedAmount < pos.cartTotals.totalAmount;
  const canConfirmSale =
    !isCheckoutLocked &&
    pos.cartItems.length > 0 &&
    !hasInvalidCartQuantity &&
    !isPaymentInsufficient &&
    !isConfirming &&
    !isConvertingPending &&
    !isActivePendingExpired &&
    !hasBlockingPendingIssue;
  const visibleError =
    localError ?? (hasPendingOperationError ? getPendingCartErrorMessage(pending.error, activePendingCart, pos.cartItems) : null) ?? getPosErrorMessage(pos.error, pos.cartItems);

  const summary = useMemo(
    () => ({
      changeAmount: Math.max(0, receivedAmount - pos.cartTotals.totalAmount),
      totalAmount: pos.cartTotals.totalAmount,
      totalQuantity: pos.cartTotals.totalQuantity
    }),
    [pos.cartTotals.totalAmount, pos.cartTotals.totalQuantity, receivedAmount]
  );
  const pageCopy =
    focus === "pending"
      ? {
          badge: "Atenciones pausadas",
          description: "Carritos propios para retomar, corregir, descartar o cobrar con caja abierta.",
          title: "Pendientes POS"
        }
      : {
          badge: "Venta rápida de mostrador",
          description: "Búsqueda de productos vendibles, carrito consolidado y cobro efectivo para consumidor final.",
          title: "Punto de venta"
        };

  useEffect(() => {
    setSearchInput(pos.search);
  }, [pos.search]);

  useEffect(() => {
    setCodeInput(pos.code);
  }, [pos.code]);

  useEffect(() => {
    if (pending.canUse && pending.status !== "all") {
      pending.setStatus("all");
    }
  }, [pending]);

  useEffect(() => {
    if (debouncedSearchInput === pos.search) {
      return;
    }

    pos.setSearch(debouncedSearchInput);
  }, [debouncedSearchInput, pos]);

  useEffect(() => {
    if (debouncedCodeInput === pos.code) {
      return;
    }

    pos.setCode(debouncedCodeInput);
  }, [debouncedCodeInput, pos]);

  useEffect(() => {
    if (pos.saleStatus === "success") {
      setReceivedAmountInput("");
    }
  }, [pos.saleStatus]);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    setPendingFeedback(null);

    if (isSearchLocked) {
      setLocalError("La búsqueda requiere permiso de venta de mostrador.");
      return;
    }

    pos.setSearch(searchInput);
    pos.setCode(codeInput);
    await pos.searchProducts();
  }

  async function submitCashSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    setPendingFeedback(null);

    if (!isCashOpen) {
      setLocalError(errorMessages["cash-session-closed"]);
      return;
    }

    if (pos.cartItems.length === 0) {
      setLocalError(errorMessages["cart-empty"]);
      return;
    }

    if (hasInvalidCartQuantity) {
      setLocalError("Todas las cantidades deben ser enteras positivas.");
      return;
    }

    if (isPaymentInsufficient) {
      setLocalError(errorMessages["payment-insufficient"]);
      return;
    }

    if (isActivePendingExpired) {
      setLocalError(pendingErrorMessages["pending-expired"]);
      return;
    }

    if (hasBlockingPendingIssue) {
      setLocalError("Corrige los productos no vendibles o sin stock antes de cobrar este pendiente.");
      return;
    }

    if (activePendingCart) {
      pending.setDraft(buildPendingDraftFromCart(pos.cartItems, pending.draft.name, pending.draft.note));

      const savedPendingCart = await pending.saveDraft(activePendingCart.id);

      if (!savedPendingCart) {
        return;
      }

      const convertedPendingCart = await pending.convertSelectedCart(receivedAmount);

      if (convertedPendingCart) {
        if (convertedPendingCart.convertedSale) {
          pos.setConfirmedSale(convertedPendingCart.convertedSale);
        } else {
          pos.clearCart();
        }

        setReceivedAmountInput("");
        setPendingFeedback("Pendiente cobrado correctamente. La atención quedó confirmada como venta.");
        pending.clearDraft();
        await pending.reload();
      }

      return;
    }

    const sale = await pos.confirmCashSale(receivedAmount);

    if (sale) {
      setLocalError(null);
    }
  }

  function dismissReceipt() {
    setLocalError(null);
    setPendingFeedback(null);
    pos.resetCheckout();
  }

  function startNewSale() {
    setLocalError(null);
    setPendingFeedback(null);
    setReceivedAmountInput("");
    pos.clearCart();
    pos.resetCheckout();
    pending.clearDraft();
  }

  function openPendingSaveDialog() {
    setLocalError(null);
    setPendingFeedback(null);

    if (isActivePendingExpired) {
      setLocalError("Este pendiente expiró. Puedes revisarlo o descartarlo, pero no actualizarlo ni cobrarlo.");
      return;
    }

    if (pos.cartItems.length === 0) {
      setLocalError(errorMessages["cart-empty"]);
      return;
    }

    setPendingNameInput(activePendingCart ? pending.draft.name : "");
    setPendingNoteInput(activePendingCart ? pending.draft.note : "");
    setPendingSaveDialogOpen(true);
  }

  async function savePendingCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    setPendingFeedback(null);

    if (pos.cartItems.length === 0) {
      setLocalError(errorMessages["cart-empty"]);
      return;
    }

    const pendingCartId = activePendingCart?.status === "active" ? activePendingCart.id : undefined;

    pending.setDraft(buildPendingDraftFromCart(pos.cartItems, pendingNameInput, pendingNoteInput));
    const savedPendingCart = await pending.saveDraft(pendingCartId);

    if (!savedPendingCart) {
      return;
    }

    setPendingSaveDialogOpen(false);
    await pending.reload();

    if (pendingCartId) {
      pending.retakeCart(savedPendingCart);
      pos.replaceCartItems(mapPendingCartToPosCartItems(savedPendingCart));
      setPendingFeedback("Pendiente actualizado con las cantidades actuales.");
      return;
    }

    pos.clearCart();
    pending.clearDraft();
    setPendingFeedback("Carrito guardado como pendiente. No se reservó stock ni precio.");
  }

  function retakePendingCart(pendingCart: PendingCart) {
    setLocalError(null);
    setPendingFeedback(null);
    setReceivedAmountInput("");
    pending.retakeCart(pendingCart);
    pos.replaceCartItems(mapPendingCartToPosCartItems(pendingCart));
  }

  function openConfirmedSaleDetail() {
    if (!pos.confirmedSale) {
      return;
    }

    navigate(`${SALES_CANCELLATIONS_PATH}?saleId=${encodeURIComponent(pos.confirmedSale.id)}`);
  }

  async function discardPendingCart() {
    if (!discardTarget) {
      return;
    }

    setLocalError(null);
    setPendingFeedback(null);

    const discardedCart = await pending.discardCart(discardTarget.id, { discardReason: "Descartado desde POS" });

    if (!discardedCart) {
      return;
    }

    if (activePendingCart?.id === discardTarget.id) {
      pos.clearCart();
      pending.clearDraft();
    }

    setDiscardTarget(null);
    setPendingFeedback("Pendiente descartado. El carrito no afectó inventario ni caja.");
    await pending.reload();
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            {pageCopy.badge}
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{pageCopy.title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{pageCopy.description}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[560px]">
          <Metric label="Productos" value={pos.cartTotals.itemCount} />
          <Metric label="Unidades" value={summary.totalQuantity} />
          <Metric label="Total" value={formatMoney(summary.totalAmount)} />
        </div>
      </div>

      {!pos.canSell ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Permiso insuficiente</AlertTitle>
          <AlertDescription>Tu usuario no tiene permisos para operar ventas de mostrador.</AlertDescription>
        </Alert>
      ) : null}

      {pos.canSell && !isCashOpen ? (
        <Alert>
          <WalletCards aria-hidden="true" />
          <AlertTitle>Caja requerida</AlertTitle>
          <AlertDescription>
            {isLoadingCash ? "Verificando caja actual..." : "Puedes preparar o retomar carritos sin caja abierta; para cobrar necesitas abrir una caja propia."}
          </AlertDescription>
        </Alert>
      ) : null}

      {pendingFeedback ? (
        <Alert>
          <BadgeCheck aria-hidden="true" />
          <AlertTitle>Flujo de pendiente actualizado</AlertTitle>
          <AlertDescription>{pendingFeedback}</AlertDescription>
        </Alert>
      ) : null}

      {visibleError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudo completar la operación</AlertTitle>
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      {activePendingCart ? (
        <PendingCartActiveNotice cart={activePendingCart} cartItems={pos.cartItems} />
      ) : null}

      {pos.receipt ? (
        <SaleReceiptPanel
          receipt={pos.receipt}
          sale={pos.confirmedSale}
          onDismiss={dismissReceipt}
          onNewSale={startNewSale}
          onOpenSaleDetail={openConfirmedSaleDetail}
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Productos vendibles</CardTitle>
                <CardDescription>Consulta por nombre, código interno o código de barras con stock FEFO disponible.</CardDescription>
              </div>
              <Button disabled={isSearchLocked || isSearching} size="sm" variant="outline" onClick={() => void pos.searchProducts()}>
                {isSearching ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
                Actualizar
              </Button>
            </div>
            <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_auto]" onSubmit={submitSearch}>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  disabled={isSearchLocked}
                  placeholder="Nombre comercial, principio activo o texto"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              <div className="relative">
                <Barcode aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  disabled={isSearchLocked}
                  placeholder="Código o barras exacto"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                />
              </div>
              <Button disabled={isSearchLocked || isSearching} type="submit">
                {isSearching ? <Spinner /> : <PackageSearch aria-hidden="true" />}
                Buscar
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[104px]">Código</TableHead>
                  <TableHead className="w-[34%]">Producto</TableHead>
                  <TableHead className="w-[116px]">Precio</TableHead>
                  <TableHead className="w-[112px]">Stock</TableHead>
                  <TableHead className="w-[132px]">Vence</TableHead>
                  <TableHead className="w-[92px] text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.searchResults.map((product) => (
                  <ProductRow key={product.id} disabled={isSearchLocked || isCartBusy} product={product} onAdd={() => pos.addCartItem(product)} />
                ))}
                {pos.searchResults.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-48" colSpan={6}>
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            {isSearching ? <Spinner /> : <PackageSearch aria-hidden="true" />}
                          </EmptyMedia>
                          <EmptyTitle>{isSearching ? "Cargando productos vendibles" : "Sin resultados"}</EmptyTitle>
                          <EmptyDescription>
                            {isSearching
                              ? "Buscando existencias FEFO disponibles para mostrador."
                              : "No hay productos vendibles para el nombre, código o barras ingresado."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            {pos.pagination.totalPages > 1 ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {pos.pagination.page} de {pos.pagination.totalPages}, {pos.pagination.total} resultados.
                </p>
                <div className="flex gap-2">
                  <Button disabled={isSearchLocked || pos.pagination.page <= 1} size="sm" variant="outline" onClick={() => pos.setPage(pos.pagination.page - 1)}>
                    Anterior
                  </Button>
                  <Button
                    disabled={isSearchLocked || pos.pagination.page >= pos.pagination.totalPages}
                    size="sm"
                    variant="outline"
                    onClick={() => pos.setPage(pos.pagination.page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid h-fit gap-5">
          {focus === "pending" ? (
            <PendingCartsPanel
              activeCartId={activePendingCart?.id ?? null}
              carts={visiblePendingCarts}
              hasError={isPendingRequestFailure(pending.listStatus)}
              isDiscarding={isDiscardingPending}
              isLoading={pending.listStatus === "loading"}
              onDiscard={setDiscardTarget}
              onReload={() => void pending.reload()}
              onRetake={retakePendingCart}
            />
          ) : null}

          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Carrito</CardTitle>
                  <CardDescription>
                    {hasActivePendingCart
                      ? "Atención retomada desde pendientes; puedes ajustar ítems antes del cobro."
                      : "Los productos repetidos se consolidan en una sola línea."}
                  </CardDescription>
                </div>
                <Button
                  disabled={!pos.canSell || pos.cartItems.length === 0 || isCartBusy || isActivePendingExpired}
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={openPendingSaveDialog}
                >
                  {isSavingPending ? <Spinner /> : <Save aria-hidden="true" />}
                  {hasActivePendingCart ? "Actualizar pendiente" : "Guardar pendiente"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {pos.cartItems.length > 0 ? (
                <>
                  <div className="grid gap-3">
                    {pos.cartItems.map((item) => (
                      <CartItemRow
                        key={item.productId}
                        disabled={!pos.canSell || isCartBusy}
                        item={item}
                        onRemove={() => pos.removeCartItem(item.productId)}
                        onUpdateQuantity={(quantity) => pos.updateCartItemQuantity(item.productId, quantity)}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Total carrito</span>
                    <span className="text-lg font-semibold text-foreground">{formatMoney(pos.cartTotals.totalAmount)}</span>
                  </div>
                  <Button disabled={!pos.canSell || isCartBusy} type="button" variant="outline" onClick={() => pos.clearCart()}>
                    <Trash2 aria-hidden="true" />
                    Vaciar carrito
                  </Button>
                </>
              ) : (
                <Empty className="min-h-64">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShoppingCart aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>Carrito vacío</EmptyTitle>
                    <EmptyDescription>Agrega productos vendibles para iniciar una venta anónima o consumidor final.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          {focus === "pos" ? (
            <PendingCartsPanel
              activeCartId={activePendingCart?.id ?? null}
              carts={visiblePendingCarts}
              hasError={isPendingRequestFailure(pending.listStatus)}
              isDiscarding={isDiscardingPending}
              isLoading={pending.listStatus === "loading"}
              onDiscard={setDiscardTarget}
              onReload={() => void pending.reload()}
              onRetake={retakePendingCart}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{hasActivePendingCart ? "Cobro de pendiente" : "Cobro efectivo"}</CardTitle>
              <CardDescription>
                {hasActivePendingCart
                  ? "Revalida el pendiente, cobra con caja abierta y lo remueve de la lista si la venta queda confirmada."
                  : "Confirmación para consumidor final con selección FEFO resuelta por backend."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={submitCashSale}>
                <div className="grid gap-3">
                  <AmountLine label="Total" value={formatMoney(pos.cartTotals.totalAmount)} />
                  <AmountLine label="Recibido" value={formatMoney(receivedAmount)} />
                  {pos.cartItems.length > 0 && !isPaymentInsufficient ? <AmountLine label="Cambio" value={formatMoney(summary.changeAmount)} /> : null}
                </div>
                <Field>
                  <FieldLabel>Monto recibido</FieldLabel>
                  <Input
                    disabled={isCheckoutLocked || isConfirming || isConvertingPending}
                    min="0"
                    step="0.01"
                    type="number"
                    value={receivedAmountInput}
                    onChange={(event) => setReceivedAmountInput(event.target.value)}
                  />
                  <FieldDescription>
                    {isCashOpen ? "Solo pago efectivo para venta anónima o consumidor final." : "El cobro queda bloqueado hasta abrir una caja propia."}
                  </FieldDescription>
                  <FieldError>
                    {pos.cartItems.length > 0 && isPaymentInsufficient ? "El monto recibido no cubre el total de la venta." : null}
                    {isActivePendingExpired ? "Este pendiente está expirado y no se puede cobrar." : null}
                    {hasBlockingPendingIssue ? "Corrige los ítems bloqueados antes de cobrar." : null}
                  </FieldError>
                </Field>
                <Button disabled={!canConfirmSale} type="submit">
                  {isConfirming || isConvertingPending ? <Spinner /> : <Banknote aria-hidden="true" />}
                  {hasActivePendingCart ? "Cobrar pendiente" : "Confirmar cobro"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isPendingSaveDialogOpen} onOpenChange={setPendingSaveDialogOpen}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={savePendingCart}>
            <DialogHeader>
              <DialogTitle>{hasActivePendingCart ? "Actualizar pendiente" : "Guardar carrito pendiente"}</DialogTitle>
              <DialogDescription>El pendiente conserva productos y cantidades, pero no reserva stock ni congela precio.</DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel>Nombre corto</FieldLabel>
              <Input
                maxLength={80}
                placeholder="Ej. Cliente volverá por antibiótico"
                value={pendingNameInput}
                onChange={(event) => setPendingNameInput(event.target.value)}
              />
              <FieldDescription>Opcional, útil para reconocer la atención en mostrador.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Nota</FieldLabel>
              <Textarea
                maxLength={300}
                placeholder="Detalle operativo para retomar la atención"
                value={pendingNoteInput}
                onChange={(event) => setPendingNoteInput(event.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button disabled={isSavingPending} type="button" variant="outline" onClick={() => setPendingSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={isSavingPending || pos.cartItems.length === 0} type="submit">
                {isSavingPending ? <Spinner /> : <Save aria-hidden="true" />}
                {hasActivePendingCart ? "Guardar cambios" : "Guardar pendiente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(discardTarget)} onOpenChange={(open) => !open && setDiscardTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Descartar pendiente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción descarta el carrito pendiente seleccionado. No afecta inventario ni caja porque todavía no existe venta confirmada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDiscardingPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={isDiscardingPending} variant="destructive" onClick={(event) => {
              event.preventDefault();
              void discardPendingCart();
            }}>
              {isDiscardingPending ? <Spinner /> : <Trash2 aria-hidden="true" />}
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

type ProductRowProps = {
  disabled: boolean;
  product: PosProduct;
  onAdd: () => void;
};

type PendingCartsPanelProps = {
  activeCartId: string | null;
  carts: PendingCart[];
  hasError: boolean;
  isDiscarding: boolean;
  isLoading: boolean;
  onDiscard: (cart: PendingCart) => void;
  onReload: () => void;
  onRetake: (cart: PendingCart) => void;
};

function PendingCartsPanel({ activeCartId, carts, hasError, isDiscarding, isLoading, onDiscard, onReload, onRetake }: PendingCartsPanelProps) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Carritos pendientes</CardTitle>
            <CardDescription>Pendientes propios para pausar, retomar o descartar atenciones de mostrador.</CardDescription>
          </div>
          <Button disabled={isLoading} size="sm" type="button" variant="outline" onClick={onReload}>
            {isLoading ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {carts.length > 0 ? (
          carts.map((cart) => (
            <PendingCartRow
              key={cart.id}
              cart={cart}
              isActive={activeCartId === cart.id}
              isDiscarding={isDiscarding}
              onDiscard={() => onDiscard(cart)}
              onRetake={() => onRetake(cart)}
            />
          ))
        ) : (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyMedia variant="icon">{isLoading ? <Spinner /> : hasError ? <AlertCircle aria-hidden="true" /> : <ClipboardList aria-hidden="true" />}</EmptyMedia>
              <EmptyTitle>{isLoading ? "Cargando pendientes" : hasError ? "No se pudieron cargar pendientes" : "Sin pendientes propios"}</EmptyTitle>
              <EmptyDescription>
                {hasError ? "Actualiza la lista o revisa la sesión antes de guardar una nueva atención." : "Guarda un carrito activo para retomarlo después sin reservar inventario."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

type PendingCartRowProps = {
  cart: PendingCart;
  isActive: boolean;
  isDiscarding: boolean;
  onDiscard: () => void;
  onRetake: () => void;
};

function PendingCartRow({ cart, isActive, isDiscarding, onDiscard, onRetake }: PendingCartRowProps) {
  const isExpired = isPendingCartExpired(cart);
  const issueCount = collectPendingCartIssues(cart).length;
  const displayName = cart.name?.trim() || cart.note?.trim() || `Pendiente ${cart.id.slice(0, 8)}`;

  return (
    <div className="grid gap-3 rounded-md border bg-background p-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground" title={displayName}>
              {displayName}
            </p>
            <Badge variant={isExpired ? "destructive" : isActive ? "default" : "secondary"}>
              {isExpired ? "Expirado" : isActive ? "En carrito" : "Activo"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {cart.items.length} ítems · {formatMoney(cart.currentTotalAmount ?? cart.referenceTotalAmount)} · {formatPendingExpiration(cart)}
          </p>
          {issueCount > 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {issueCount} advertencia{issueCount === 1 ? "" : "s"} de revalidación
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button aria-label="Retomar pendiente" disabled={isActive} size="icon" type="button" variant="ghost" onClick={onRetake}>
            <Undo2 aria-hidden="true" />
          </Button>
          <Button aria-label="Descartar pendiente" disabled={isDiscarding} size="icon" type="button" variant="ghost" onClick={onDiscard}>
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
      {cart.note && cart.name ? <p className="line-clamp-2 text-xs text-muted-foreground">{cart.note}</p> : null}
    </div>
  );
}

type PendingCartActiveNoticeProps = {
  cart: PendingCart;
  cartItems: PosCartItem[];
};

function PendingCartActiveNotice({ cart, cartItems }: PendingCartActiveNoticeProps) {
  const issues = collectPendingCartIssues(cart);
  const isExpired = isPendingCartExpired(cart);
  const hasBlockingIssue = hasBlockingIssuesForCart(cart, cartItems);

  return (
    <Alert variant={isExpired || hasBlockingIssue ? "destructive" : "default"}>
      {isExpired ? <Ban aria-hidden="true" /> : hasBlockingIssue ? <AlertCircle aria-hidden="true" /> : <FileClock aria-hidden="true" />}
      <AlertTitle>{isExpired ? "Pendiente expirado" : hasBlockingIssue ? "Pendiente requiere corrección" : "Pendiente retomado"}</AlertTitle>
      <AlertDescription>
        <div className="grid gap-2">
          <p>
            {isExpired
              ? "Puedes revisarlo o descartarlo, pero no cobrarlo."
              : "Revisa precio vigente, stock y estado de productos antes de cobrar con caja abierta."}
          </p>
          {issues.length > 0 ? (
            <div className="grid gap-1">
              {issues.map((issue) => (
                <p key={`${issue.productId}-${issue.code}`} className="text-xs">
                  {getPendingIssueMessage(issue, cart)}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </AlertDescription>
    </Alert>
  );
}

function ProductRow({ disabled, product, onAdd }: ProductRowProps) {
  const isNearExpiration = isNearExpirationDate(product.nextExpirationDate);

  return (
    <TableRow>
      <TableCell className="min-w-0 font-mono text-xs">
        <span className="block truncate" title={product.internalCode}>
          {product.internalCode}
        </span>
        {product.barcode ? (
          <span className="block truncate text-muted-foreground" title={product.barcode}>
            {product.barcode}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="min-w-0 whitespace-normal">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium text-foreground" title={product.commercialName}>
            {product.commercialName}
          </p>
          <p className="truncate text-xs text-muted-foreground" title={product.genericName ?? product.baseUnit.name}>
            {product.genericName ?? product.baseUnit.name}
          </p>
        </div>
      </TableCell>
      <TableCell>{formatMoney(product.salePrice)}</TableCell>
      <TableCell>
        <Badge variant={product.saleableStock > 0 ? "default" : "secondary"}>
          {product.saleableStock} {product.baseUnit.abbreviation}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <span>{product.nextExpirationDate ? formatDate(product.nextExpirationDate) : "Sin venc."}</span>
          {isNearExpiration ? (
            <Badge variant="secondary">
              <CalendarClock aria-hidden="true" />
              Próx. venc.
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button disabled={disabled || product.saleableStock <= 0} size="sm" variant="outline" onClick={onAdd}>
          <Plus aria-hidden="true" />
          Agregar
        </Button>
      </TableCell>
    </TableRow>
  );
}

type CartItemRowProps = {
  disabled: boolean;
  item: PosCartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
};

function CartItemRow({ disabled, item, onRemove, onUpdateQuantity }: CartItemRowProps) {
  const isNearExpiration = isNearExpirationDate(item.nextExpirationDate);

  return (
    <div className="grid gap-3 rounded-md border p-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground" title={item.commercialName}>
            {item.commercialName}
          </p>
          <p className="truncate text-xs text-muted-foreground" title={item.internalCode}>
            {item.internalCode} · {formatMoney(item.unitPrice)} / {item.baseUnit.abbreviation}
          </p>
        </div>
        <Button aria-label="Quitar producto" disabled={disabled} size="icon" type="button" variant="ghost" onClick={onRemove}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="grid grid-cols-[104px_1fr] items-center gap-3">
        <div className="flex h-9 items-center rounded-md border">
          <Button
            aria-label="Disminuir cantidad"
            className="h-8 w-8"
            disabled={disabled || item.quantity <= 1}
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => onUpdateQuantity(item.quantity - 1)}
          >
            <Minus aria-hidden="true" />
          </Button>
          <Input
            className="h-8 border-0 px-1 text-center shadow-none focus-visible:ring-0"
            disabled={disabled}
            min="1"
            max={item.saleableStock}
            step="1"
            type="number"
            value={item.quantity}
            onChange={(event) => onUpdateQuantity(toPositiveInteger(event.currentTarget.valueAsNumber))}
          />
          <Button
            aria-label="Aumentar cantidad"
            className="h-8 w-8"
            disabled={disabled || item.quantity >= item.saleableStock}
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{formatMoney(item.subtotal)}</p>
          <p className="text-xs text-muted-foreground">Stock: {item.saleableStock}</p>
        </div>
      </div>
      {isNearExpiration ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock aria-hidden="true" className="size-3.5" />
          Próximo vencimiento: {formatDate(item.nextExpirationDate)}. Producto vendible, no bloquea el cobro.
        </p>
      ) : null}
    </div>
  );
}

type SaleReceiptPanelProps = {
  onDismiss: () => void;
  onNewSale: () => void;
  onOpenSaleDetail: () => void;
  receipt: SaleReceipt;
  sale: Sale | null;
};

type StockConsumptionRow = {
  batchNumber?: string;
  expirationDate?: string;
  id: string;
  productName: string;
  quantity: number;
};

function SaleReceiptPanel({ onDismiss, onNewSale, onOpenSaleDetail, receipt, sale }: SaleReceiptPanelProps) {
  const stockRows = buildStockConsumptionRows(sale);
  const canShowChange = receipt.receivedAmount >= receipt.totalAmount;

  return (
    <Card className="border-primary/30">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit" variant="secondary">
              <BadgeCheck aria-hidden="true" />
              Venta confirmada
            </Badge>
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ReceiptText aria-hidden="true" className="size-5" />
                Comprobante interno {receipt.saleCorrelativeCode}
              </CardTitle>
              <CardDescription>
                Emitido el {formatDateTime(receipt.issuedAt)} por {receipt.sellerName}. Caja {receipt.cashSessionCorrelativeCode}.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!sale} size="sm" type="button" variant="outline" onClick={onOpenSaleDetail}>
              <Eye aria-hidden="true" />
              Ver detalle
            </Button>
            <Button size="sm" type="button" variant="outline" onClick={onNewSale}>
              <ShoppingCart aria-hidden="true" />
              Nueva venta
            </Button>
            <Button aria-label="Descartar comprobante" size="icon" type="button" variant="ghost" onClick={onDismiss}>
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <AmountLine label="Total" value={formatMoney(receipt.totalAmount)} />
          <AmountLine label="Efectivo recibido" value={formatMoney(receipt.receivedAmount)} />
          {canShowChange ? <AmountLine label="Cambio a entregar" value={formatMoney(receipt.changeAmount)} /> : null}
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item vendido</TableHead>
                <TableHead className="w-[96px] text-right">Cant.</TableHead>
                <TableHead className="w-[132px] text-right">Unitario</TableHead>
                <TableHead className="w-[132px] text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipt.items.map((item) => (
                <TableRow key={`${item.productName}-${item.quantity}-${item.subtotal}`}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">{quantityFormatter.format(item.quantity)}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {stockRows.length > 0 ? (
          <div className="grid gap-3 rounded-md border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Boxes aria-hidden="true" className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Stock consumido por FEFO</p>
            </div>
            <div className="grid gap-2">
              {stockRows.map((row) => (
                <div key={row.id} className="grid gap-1 rounded-md border bg-background px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_120px_132px] sm:items-center">
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
        ) : null}
      </CardContent>
    </Card>
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

function AmountLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function buildPendingDraftFromCart(items: PosCartItem[], name: string, note: string) {
  return {
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    })),
    name,
    note
  };
}

function mapPendingCartToPosCartItems(cart: PendingCart): PosCartItem[] {
  return cart.items.map((item) => {
    const saleableStock = getPendingCartItemSaleableStock(item);
    const unitPrice = item.currentUnitPrice ?? item.referenceUnitPrice;

    return {
      barcode: item.barcode,
      baseUnit: item.baseUnit,
      commercialName: item.commercialName,
      genericName: item.genericName,
      internalCode: item.internalCode,
      nextExpirationDate: item.nextExpirationDate,
      productId: item.productId,
      quantity: item.quantity,
      saleableStock,
      subtotal: roundMoney(unitPrice * item.quantity),
      unitPrice
    };
  });
}

function getPendingCartItemSaleableStock(item: PendingCartItem) {
  if (item.isSaleable === false) {
    return 0;
  }

  const stockIssue = item.revalidationIssues?.find((issue) => issue.code === "stock-insufficient" && typeof issue.saleableStock === "number");

  return stockIssue?.saleableStock ?? item.saleableStock ?? Math.max(item.quantity, 1);
}

function collectPendingCartIssues(cart: PendingCart): PendingCartRevalidationIssue[] {
  return cart.revalidationIssues ?? cart.items.flatMap((item) => item.revalidationIssues ?? []);
}

function hasBlockingIssuesForCart(cart: PendingCart, cartItems: PosCartItem[]) {
  return collectPendingCartIssues(cart).some((issue) => {
    const cartItem = cartItems.find((item) => item.productId === issue.productId);

    if (!cartItem) {
      return false;
    }

    if (issue.code === "product-not-saleable") {
      return true;
    }

    if (issue.code === "stock-insufficient") {
      return cartItem.quantity > (issue.saleableStock ?? cartItem.saleableStock);
    }

    return false;
  });
}

function getPendingIssueMessage(issue: PendingCartRevalidationIssue, cart: PendingCart) {
  const item = cart.items.find((cartItem) => cartItem.productId === issue.productId);
  const productName = item?.commercialName ?? "Producto";

  if (issue.code === "price-changed") {
    return `${productName}: precio actualizado de ${formatMoney(issue.referenceUnitPrice ?? item?.referenceUnitPrice ?? 0)} a ${formatMoney(
      issue.currentUnitPrice ?? item?.currentUnitPrice ?? item?.referenceUnitPrice ?? 0
    )}.`;
  }

  if (issue.code === "stock-insufficient") {
    return `${productName}: stock actual ${issue.saleableStock ?? item?.saleableStock ?? 0}, solicitado ${issue.requestedQuantity ?? item?.quantity ?? 0}.`;
  }

  return `${productName}: producto no vendible; retíralo para poder cobrar.`;
}

function getPendingCartErrorMessage(error: PendingCartDataError | null, selectedCart: PendingCart | null, cartItems: PosCartItem[]) {
  if (!error) {
    return null;
  }

  if (error.productId) {
    const cartItem = cartItems.find((item) => item.productId === error.productId);
    const pendingItem = selectedCart?.items.find((item) => item.productId === error.productId);
    const productName = cartItem?.commercialName ?? pendingItem?.commercialName;

    if (productName && (error.code === "stock-insufficient" || error.code === "product-not-saleable" || error.code === "price-changed")) {
      return `${pendingErrorMessages[error.code]} Producto: ${productName}.`;
    }
  }

  return pendingErrorMessages[error.code];
}

function isPendingRequestFailure(status: string) {
  return status === "error" || status === "forbidden" || status === "expired";
}

function getPosErrorMessage(error: PosDataError | null, cartItems: PosCartItem[]) {
  if (!error) {
    return null;
  }

  if (error.code === "stock-insufficient" && error.productId) {
    const item = cartItems.find((cartItem) => cartItem.productId === error.productId);

    if (item) {
      return `Stock insuficiente para ${item.commercialName}. Conserva el carrito, ajusta la cantidad y vuelve a cobrar.`;
    }
  }

  return errorMessages[error.code];
}

function buildStockConsumptionRows(sale: Sale | null): StockConsumptionRow[] {
  if (!sale) {
    return [];
  }

  return sale.items.flatMap((item) =>
    item.consumptions.map((consumption) => ({
      batchNumber: consumption.batchNumber,
      expirationDate: consumption.expirationDate,
      id: consumption.id,
      productName: item.commercialName,
      quantity: consumption.quantity
    }))
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

function formatPendingExpiration(cart: PendingCart) {
  return `${isPendingCartExpired(cart) ? "Expiró" : "Expira"} ${formatDateTime(cart.expiresAt)}`;
}

function isPendingCartExpired(cart: PendingCart) {
  return cart.status === "expired" || new Date(cart.expiresAt).getTime() <= Date.now();
}

function isNearExpirationDate(value?: string) {
  if (!value) {
    return false;
  }

  const expirationTime = new Date(`${value}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warningLimit = new Date(today);
  warningLimit.setDate(warningLimit.getDate() + NEAR_EXPIRATION_DAYS);

  return expirationTime >= today.getTime() && expirationTime <= warningLimit.getTime();
}

function toNonNegativeNumber(value: string) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
}

function toPositiveInteger(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 1;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
