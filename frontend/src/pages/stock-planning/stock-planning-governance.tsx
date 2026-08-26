import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type {
  StockPlanningDataError,
  StockPlanningEngineState,
  StockPlanningExecution,
  StockPlanningGlobalConfiguration,
  UpdateStockPlanningGlobalConfiguration
} from "@/modules/stock-planning";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock3,
  History,
  Play,
  Save,
  ShieldCheck,
  TriangleAlert,
  XCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";

type Props = {
  canGovern: boolean;
  configuration: StockPlanningGlobalConfiguration | null;
  engineState: StockPlanningEngineState | null;
  error: StockPlanningDataError | null;
  executions: StockPlanningExecution[];
  operation: "idle" | "running" | "saving";
  onRun: () => Promise<boolean>;
  onSave: (input: UpdateStockPlanningGlobalConfiguration) => Promise<boolean>;
};

const weekdayLabels = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/La_Paz"
});

export function StockPlanningGovernance(props: Props) {
  const executionRunning = props.operation === "running" || props.engineState?.executionInProgress === true;

  return (
    <div className="grid gap-5">
      {props.engineState?.stale ? (
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>El resultado vigente está pendiente de actualización</AlertTitle>
          <AlertDescription>
            {props.engineState.staleReasons.includes("configuration_changed")
              ? "La configuración cambió después del último cálculo. La próxima actualización aplicará los nuevos criterios."
              : "La actualización programada todavía no produjo un resultado nuevo."}
          </AlertDescription>
        </Alert>
      ) : null}

      {props.error ? <GovernanceError error={props.error} /> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <StatusCard
          icon={props.engineState?.executionInProgress ? CircleDashed : CheckCircle2}
          label="Estado del cálculo"
          value={getEngineLabel(props.engineState)}
          detail={props.configuration?.engineEnabled === false ? "El historial diario continúa registrándose." : "Cálculo automático activado."}
        />
        <StatusCard
          icon={History}
          label="Último cálculo"
          value={formatDate(props.engineState?.latestExecution?.completedAt ?? props.engineState?.latestExecution?.startedAt)}
          detail={props.engineState?.latestExecution ? getStatusLabel(props.engineState.latestExecution.status) : "Aún no hay cálculos."}
        />
        <StatusCard
          icon={CalendarClock}
          label="Próxima actualización"
          value={formatDate(props.engineState?.nextExpectedAt)}
          detail={getScheduleLabel(props.configuration)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        {props.canGovern && props.configuration ? (
          <ConfigurationForm
            configuration={props.configuration}
            saving={props.operation === "saving"}
            onSave={props.onSave}
          />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                <CardTitle>Configuración del cálculo</CardTitle>
              </div>
              <CardDescription>Puedes consultar estos valores, pero no modificarlos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <ReadOnlyRow label="Estado" value={props.configuration?.engineEnabled ? "Activo" : "Desactivado"} />
              <ReadOnlyRow label="Frecuencia" value={getScheduleLabel(props.configuration)} />
              <ReadOnlyRow label="Cobertura general" value={`${props.configuration?.coverageDays ?? "—"} días`} />
              <p className="rounded-lg border bg-muted/35 p-3 text-muted-foreground">
                Solo el superadministrador puede modificar esta política o solicitar un recálculo.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Historial de cálculos</CardTitle>
                <CardDescription>Consulta cuándo se calculó cada resultado y si terminó correctamente.</CardDescription>
              </div>
              {props.canGovern ? (
                <Button disabled={executionRunning || props.operation === "saving"} type="button" onClick={() => void props.onRun()}>
                  {executionRunning ? <Spinner /> : <Play aria-hidden="true" />}
                  {executionRunning ? "Cálculo en curso" : "Recalcular ahora"}
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <ExecutionHistory executions={props.executions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConfigurationForm({
  configuration,
  saving,
  onSave
}: {
  configuration: StockPlanningGlobalConfiguration;
  saving: boolean;
  onSave: Props["onSave"];
}) {
  const [form, setForm] = useState(() => toForm(configuration));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => setForm(toForm(configuration)), [configuration]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = toInput(form);
    const error = validate(input);
    setValidationError(error);
    if (!error) void onSave(input);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del cálculo</CardTitle>
        <CardDescription>
          Define cuándo se actualiza y cuántos días debe cubrir. Horario de Bolivia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={submit}>
          {validationError ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Revisa la configuración</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="engine-enabled">Cálculo predictivo activo</Label>
              <p className="mt-1 text-xs text-muted-foreground">Al desactivarlo, la captura diaria de inventario continúa.</p>
            </div>
            <Switch id="engine-enabled" checked={form.engineEnabled} onCheckedChange={(checked) => setForm({ ...form, engineEnabled: checked })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Frecuencia">
              <NativeSelect value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value as "daily" | "weekly" })}>
                <NativeSelectOption value="daily">Diaria</NativeSelectOption>
                <NativeSelectOption value="weekly">Semanal</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field label="Día de actualización">
              <NativeSelect disabled={form.frequency === "daily"} value={String(form.weekday)} onChange={(event) => setForm({ ...form, weekday: Number(event.target.value) })}>
                {weekdayLabels.map((label, index) => <NativeSelectOption key={label} value={String(index)}>{label}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            <Field label="Hora">
              <Input type="time" value={form.localTime} onChange={(event) => setForm({ ...form, localTime: event.target.value })} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cobertura general (días)">
              <Input min={1} max={365} type="number" value={form.coverageDays} onChange={(event) => setForm({ ...form, coverageDays: event.target.value })} />
            </Field>
            <Field label="Historia mínima (semanas)">
              <Input min={1} max={520} type="number" value={form.minimumHistoryWeeks} onChange={(event) => setForm({ ...form, minimumHistoryWeeks: event.target.value })} />
            </Field>
          </div>

          <fieldset className="grid gap-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">Nivel de protección por criticidad</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <PercentField label="Normal" value={form.normalLevel} onChange={(value) => setForm({ ...form, normalLevel: value })} />
              <PercentField label="Alta" value={form.highLevel} onChange={(value) => setForm({ ...form, highLevel: value })} />
              <PercentField label="Crítica" value={form.criticalLevel} onChange={(value) => setForm({ ...form, criticalLevel: value })} />
            </div>
          </fieldset>

          <fieldset className="grid gap-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">Umbrales de madurez</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Días con demanda para iniciar">
                <Input min={1} max={3650} type="number" value={form.minimumDemandDays} onChange={(event) => setForm({ ...form, minimumDemandDays: event.target.value })} />
              </Field>
              <Field label="Días con ventas para considerar suficientes">
                <Input min={2} max={3650} type="number" value={form.operationalDemandDays} onChange={(event) => setForm({ ...form, operationalDemandDays: event.target.value })} />
              </Field>
            </div>
          </fieldset>

          <Button className="justify-self-end" disabled={saving} type="submit">
            {saving ? <Spinner /> : <Save aria-hidden="true" />}
            {saving ? "Guardando…" : "Guardar política"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type FormState = ReturnType<typeof toForm>;

function toForm(configuration: StockPlanningGlobalConfiguration) {
  return {
    engineEnabled: configuration.engineEnabled,
    frequency: configuration.frequency,
    weekday: configuration.weekday ?? 1,
    localTime: configuration.localTime,
    coverageDays: String(configuration.coverageDays),
    normalLevel: String(configuration.serviceLevels.normal * 100),
    highLevel: String(configuration.serviceLevels.high * 100),
    criticalLevel: String(configuration.serviceLevels.critical * 100),
    minimumHistoryWeeks: String(configuration.maturityThresholds.minimumHistoryWeeks),
    minimumDemandDays: String(configuration.maturityThresholds.minimumDemandDays),
    operationalDemandDays: String(configuration.maturityThresholds.operationalDemandDays)
  };
}

function toInput(form: FormState): UpdateStockPlanningGlobalConfiguration {
  return {
    engineEnabled: form.engineEnabled,
    frequency: form.frequency,
    weekday: form.frequency === "weekly" ? form.weekday : null,
    localTime: form.localTime,
    coverageDays: Number(form.coverageDays),
    serviceLevels: {
      normal: Number(form.normalLevel) / 100,
      high: Number(form.highLevel) / 100,
      critical: Number(form.criticalLevel) / 100
    },
    maturityThresholds: {
      minimumHistoryWeeks: Number(form.minimumHistoryWeeks),
      minimumDemandDays: Number(form.minimumDemandDays),
      operationalDemandDays: Number(form.operationalDemandDays)
    }
  };
}

function validate(input: UpdateStockPlanningGlobalConfiguration) {
  if (!Number.isInteger(input.coverageDays) || input.coverageDays < 1 || input.coverageDays > 365) return "La cobertura general debe estar entre 1 y 365 días.";
  if (!(input.serviceLevels.normal < input.serviceLevels.high && input.serviceLevels.high < input.serviceLevels.critical)) return "Los niveles de protección deben aumentar de Normal a Alta y Crítica.";
  if (Object.values(input.serviceLevels).some((level) => level < 0.5 || level > 0.999)) return "Cada nivel de protección debe estar entre 50% y 99,9%.";
  if (input.maturityThresholds.operationalDemandDays <= input.maturityThresholds.minimumDemandDays) return "El nivel suficiente debe requerir más días con ventas que el nivel inicial.";
  return null;
}

function ExecutionHistory({ executions }: { executions: StockPlanningExecution[] }) {
  if (executions.length === 0) return <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Aún no hay cálculos registrados.</p>;
  return (
    <ol className="grid gap-3">
      {executions.map((execution) => {
        const Icon = execution.status === "failed" ? XCircle : execution.status === "succeeded_with_warnings" ? TriangleAlert : execution.status === "running" ? CircleDashed : CheckCircle2;
        return (
          <li className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg border p-3" key={execution.id}>
            <Icon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">{getStatusLabel(execution.status)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(execution.startedAt)} · {getTriggerLabel(execution.trigger)}</p>
              {execution.globalError ? <p className="mt-2 text-xs text-destructive">El cálculo terminó con un error.</p> : null}
              {execution.warnings.length > 0 ? <p className="mt-2 text-xs text-muted-foreground">Advertencias: {execution.warnings.length}.</p> : null}
            </div>
            <Badge variant={execution.status === "failed" ? "destructive" : execution.status === "succeeded_with_warnings" ? "outline" : "secondary"}>v{execution.configurationVersion}</Badge>
          </li>
        );
      })}
    </ol>
  );
}

function GovernanceError({ error }: { error: StockPlanningDataError }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{error.code === "conflict" ? "Ya existe un cálculo en curso" : "No se completó la operación"}</AlertTitle>
      <AlertDescription>{error.code === "conflict" ? "Espera a que finalice antes de solicitar otro recálculo." : "Conservamos los datos visibles. Intenta nuevamente."}</AlertDescription>
    </Alert>
  );
}

function StatusCard({ icon: Icon, label, value, detail }: { icon: typeof Clock3; label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent><p className="font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}

function PercentField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={`${label} (%)`}><Input min={50} max={99.9} step={0.1} type="number" value={value} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b pb-3"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

function formatDate(value?: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "Sin cálculo";
}

function getEngineLabel(state: StockPlanningEngineState | null) {
  if (!state) return "Consultando";
  if (state.executionInProgress) return "Calculando";
  return state.configuration.engineEnabled ? "Activo" : "Desactivado";
}

function getScheduleLabel(configuration: StockPlanningGlobalConfiguration | null) {
  if (!configuration) return "Programación pendiente";
  const time = configuration.localTime;
  return configuration.frequency === "weekly" ? `${weekdayLabels[configuration.weekday ?? 1]} a las ${time}` : `Todos los días a las ${time}`;
}

function getStatusLabel(status: StockPlanningExecution["status"]) {
  return { failed: "Fallida", running: "En curso", succeeded: "Exitosa", succeeded_with_warnings: "Con advertencias" }[status];
}

function getTriggerLabel(trigger: StockPlanningExecution["trigger"]) {
  return { manual: "Solicitud manual", recovery: "Recuperación programada", scheduled: "Programada" }[trigger];
}
