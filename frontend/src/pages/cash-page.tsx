import { type FormEvent, useMemo, useState } from "react";
import type { CashDataErrorCode, CashSession } from "@/modules/cash";
import { AlertCircle, BadgeCheck, Banknote, LockKeyhole, RefreshCcw, WalletCards } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCashSession } from "@/modules/cash";

const moneyFormatter = new Intl.NumberFormat("es-BO", { currency: "BOB", maximumFractionDigits: 2, style: "currency" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short"
});

const cashStatusLabels: Record<CashSession["status"], string> = {
  closed: "Cerrada",
  open: "Abierta"
};

const errorMessages: Record<CashDataErrorCode, string> = {
  "already-closed": "La caja ya fue cerrada. Actualiza el estado antes de continuar.",
  "already-open": "Ya tienes una caja abierta. Cierra la caja actual antes de abrir otra.",
  "amount-invalid": "Revisa los montos ingresados. Deben ser números mayores o iguales a cero con hasta dos decimales.",
  forbidden: "No tienes permiso para cerrar esta caja.",
  "not-found": "No se encontró una caja abierta para completar la operación.",
  "session-invalid": "Tu sesión no permite operar caja en este momento. Vuelve a iniciar sesión.",
  unknown: "No se pudo completar la operación de caja. Intenta nuevamente."
};

export function CashPage() {
  const {
    canUseCash,
    closeOwnCashSession,
    closeStatus,
    current,
    currentStatus,
    error,
    lastClosedCashSession,
    loadCurrentCashSession,
    openCashSession,
    openStatus
  } = useCashSession();
  const currentCashSession = current.cashSession;
  const [openingAmount, setOpeningAmount] = useState("0");
  const [openingNote, setOpeningNote] = useState("");
  const [countedAmount, setCountedAmount] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const isLoadingCurrent = currentStatus === "loading";
  const isOpening = openStatus === "loading";
  const isClosing = closeStatus === "loading";
  const isBusy = isLoadingCurrent || isOpening || isClosing;
  const visibleError = localError ?? (error ? errorMessages[error.code] : null);
  const summarySession = currentCashSession ?? lastClosedCashSession;
  const netSalesAmount = useMemo(() => {
    if (!summarySession) {
      return 0;
    }

    return summarySession.expectedAmount - summarySession.initialAmount;
  }, [summarySession]);

  async function submitOpenCashSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (current.isOpen) {
      setLocalError(errorMessages["already-open"]);
      return;
    }

    const parsedOpeningAmount = Number(openingAmount);

    if (!Number.isFinite(parsedOpeningAmount) || parsedOpeningAmount < 0) {
      setLocalError("El monto inicial debe ser un número mayor o igual a cero.");
      return;
    }

    const result = await openCashSession({
      initialAmount: parsedOpeningAmount,
      openingNote
    });

    if (result) {
      setOpeningAmount("0");
      setOpeningNote("");
    }
  }

  async function submitCloseCashSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!currentCashSession) {
      setLocalError(errorMessages["not-found"]);
      return;
    }

    const parsedCountedAmount = Number(countedAmount);

    if (!Number.isFinite(parsedCountedAmount) || parsedCountedAmount < 0) {
      setLocalError("El monto contado final debe ser un número mayor o igual a cero.");
      return;
    }

    const result = await closeOwnCashSession({
      closingNote,
      countedAmount: parsedCountedAmount
    });

    if (result) {
      setCountedAmount("");
      setClosingNote("");
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Caja de turno
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Caja</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Apertura, control operativo y cierre de la caja asociada al usuario autenticado.
            </p>
          </div>
        </div>
        <Button disabled={isBusy || !canUseCash} size="sm" variant="outline" onClick={() => void loadCurrentCashSession()}>
          {isLoadingCurrent ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
          Actualizar
        </Button>
      </div>

      {!canUseCash ? (
        <Alert variant="destructive">
          <LockKeyhole aria-hidden="true" />
          <AlertTitle>Permiso insuficiente</AlertTitle>
          <AlertDescription>Tu usuario no tiene permisos para operar caja.</AlertDescription>
        </Alert>
      ) : null}

      {visibleError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudo completar la operación</AlertTitle>
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      {lastClosedCashSession && !currentCashSession ? (
        <Alert>
          <BadgeCheck aria-hidden="true" />
          <AlertTitle>Caja cerrada</AlertTitle>
          <AlertDescription>
            Diferencia final: {formatMoney(lastClosedCashSession.differenceAmount ?? 0)} sobre esperado de{" "}
            {formatMoney(lastClosedCashSession.expectedAmount)}.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Estado operativo</CardTitle>
            <CardDescription>Importes principales para cuadrar el efectivo del turno.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCurrent && !summarySession ? (
              <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Cargando caja...
              </div>
            ) : summarySession ? (
              <div className="grid gap-5">
                <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Código de caja</p>
                    <p className="text-xl font-semibold text-foreground">{summarySession.correlativeCode}</p>
                    <p className="text-sm text-muted-foreground">Responsable: {summarySession.openedByUser.fullName}</p>
                  </div>
                  <Badge variant={summarySession.status === "open" ? "default" : "secondary"}>{cashStatusLabels[summarySession.status]}</Badge>
                </div>

                <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <CashAmount label="Monto inicial" value={formatMoney(summarySession.initialAmount)} />
                  <CashAmount label="Ventas netas cobradas" value={formatMoney(netSalesAmount)} />
                  <CashAmount label="Esperado" value={formatMoney(summarySession.expectedAmount)} />
                  <CashAmount label="Contado" value={summarySession.countedAmount === undefined ? "Pendiente" : formatMoney(summarySession.countedAmount)} />
                  <CashAmount
                    label="Diferencia"
                    value={summarySession.differenceAmount === undefined ? "Pendiente" : formatMoney(summarySession.differenceAmount)}
                    variant={summarySession.differenceAmount && summarySession.differenceAmount !== 0 ? "destructive" : "default"}
                  />
                  <CashAmount label="Estado" value={cashStatusLabels[summarySession.status]} />
                </dl>

                <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                  <div>
                    <p className="font-medium text-foreground">Apertura</p>
                    <p>{formatDateTime(summarySession.openedAt)}</p>
                    {summarySession.openingNote ? <p>Nota: {summarySession.openingNote}</p> : null}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Cierre</p>
                    <p>{summarySession.closedAt ? formatDateTime(summarySession.closedAt) : "Pendiente"}</p>
                    {summarySession.closingNote ? <p>Nota: {summarySession.closingNote}</p> : null}
                  </div>
                </div>
              </div>
            ) : (
              <Empty className="min-h-72">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <WalletCards aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Sin caja abierta</EmptyTitle>
                  <EmptyDescription>Registra el monto inicial para comenzar el turno de mostrador.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <div className="grid h-fit gap-5">
          {currentCashSession ? (
            <Card>
              <CardHeader>
                <CardTitle>Cierre propio</CardTitle>
                <CardDescription>Ingresa el efectivo contado al finalizar el turno.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" onSubmit={submitCloseCashSession}>
                  <Field>
                    <FieldLabel>Monto contado final</FieldLabel>
                    <Input
                      disabled={isBusy || !canUseCash}
                      min="0"
                      step="0.01"
                      type="number"
                      value={countedAmount}
                      onChange={(event) => setCountedAmount(event.target.value)}
                    />
                    <FieldDescription>Esperado actual: {formatMoney(currentCashSession.expectedAmount)}</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel>Nota de cierre</FieldLabel>
                    <Textarea
                      disabled={isBusy || !canUseCash}
                      maxLength={240}
                      placeholder="Ej. diferencia por redondeo operativo"
                      value={closingNote}
                      onChange={(event) => setClosingNote(event.target.value)}
                    />
                    <FieldDescription>Opcional, queda asociada al arqueo de caja.</FieldDescription>
                    <FieldError>{localError}</FieldError>
                  </Field>
                  <Button disabled={isBusy || !canUseCash} type="submit">
                    {isClosing ? <Spinner /> : <Banknote aria-hidden="true" />}
                    Cerrar caja
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Apertura manual</CardTitle>
                <CardDescription>El monto inicial puede ser cero o mayor.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" onSubmit={submitOpenCashSession}>
                  <Field>
                    <FieldLabel>Monto inicial</FieldLabel>
                    <Input
                      disabled={isBusy || !canUseCash}
                      min="0"
                      step="0.01"
                      type="number"
                      value={openingAmount}
                      onChange={(event) => setOpeningAmount(event.target.value)}
                    />
                    <FieldDescription>Fondo físico disponible al iniciar el turno.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel>Nota de apertura</FieldLabel>
                    <Textarea
                      disabled={isBusy || !canUseCash}
                      maxLength={240}
                      placeholder="Ej. fondo fijo recibido"
                      value={openingNote}
                      onChange={(event) => setOpeningNote(event.target.value)}
                    />
                    <FieldDescription>Opcional, útil para observaciones del turno.</FieldDescription>
                    <FieldError>{localError}</FieldError>
                  </Field>
                  <Button disabled={isBusy || !canUseCash || current.isOpen} type="submit">
                    {isOpening ? <Spinner /> : <WalletCards aria-hidden="true" />}
                    Abrir caja
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

type CashAmountProps = {
  label: string;
  value: string;
  variant?: "default" | "destructive";
};

function CashAmount({ label, value, variant = "default" }: CashAmountProps) {
  return (
    <div className="rounded-md border p-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={variant === "destructive" ? "mt-1 text-lg font-semibold text-destructive" : "mt-1 text-lg font-semibold text-foreground"}>
        {value}
      </dd>
    </div>
  );
}

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
