import type { RolesRequestStatus, RoleScopeLevel, RolesCatalogResponse } from "@/modules/roles";
import { AlertCircle, ArrowRight, CircleCheck, ClipboardCheck, RefreshCcw, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRolesCatalog } from "@/modules/roles";

const scopeLabels: Record<RoleScopeLevel, string> = {
  full_access: "Acceso total",
  operational_access: "Acceso operativo",
  own_records_only: "Solo registros propios",
  no_access: "Sin acceso"
};

const scopeExplanations: Record<RoleScopeLevel, string> = {
  full_access: "Gestiona y supervisa el área completa.",
  operational_access: "Opera las funciones declaradas sin gobernar el sistema.",
  own_records_only: "Opera únicamente registros bajo su responsabilidad.",
  no_access: "El área permanece fuera de su alcance institucional."
};

const roleIcons = [ShieldCheck, ClipboardCheck, UserRoundCheck] as const;

export function RolesPage() {
  const catalog = useRolesCatalog();

  return <RolesPageView roles={catalog.roles} status={catalog.status} onRetry={() => void catalog.reload()} />;
}

export function RolesPageView({
  roles,
  status,
  onRetry
}: {
  roles: RolesCatalogResponse;
  status: RolesRequestStatus;
  onRetry: () => void;
}) {
  return (
    <section className="grid gap-8">
      <header className="relative overflow-hidden rounded-xl border bg-card px-5 py-7 sm:px-8 sm:py-9">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-2/5 border-l bg-muted/30 lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_0.52fr] lg:items-end">
          <div className="max-w-3xl space-y-4">
            <Badge className="gap-2" variant="outline">
              <CircleCheck aria-hidden="true" className="size-3.5" />
              Política institucional fija
            </Badge>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Roles y facultades</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Consulta cómo se distribuyen la operación farmacéutica, la supervisión y el gobierno del sistema entre los
                tres perfiles institucionales.
              </p>
            </div>
          </div>
          <div className="relative grid gap-2 border-l-2 border-primary pl-4 text-sm">
            <span className="font-medium text-foreground">Superficie de consulta</span>
            <span className="leading-5 text-muted-foreground">Las facultades no se editan. Solo cambia el rol asignado a cada usuario.</span>
          </div>
        </div>
      </header>

      {status === "idle" || status === "loading" ? <RolesLoadingState /> : null}
      {status === "error" ? <RolesRequestError onRetry={onRetry} /> : null}
      {status === "invalid-configuration" ? <InvalidConfigurationState onRetry={onRetry} /> : null}
      {status === "success" ? <RolesCatalog roles={roles} /> : null}
    </section>
  );
}

function RolesCatalog({ roles }: { roles: RolesCatalogResponse }) {
  return (
    <div className="grid gap-8">
      <section aria-labelledby="role-summaries-title" className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">01 · Responsabilidades</p>
            <h2 id="role-summaries-title" className="mt-1 text-xl font-semibold">Tres perfiles, una política de acceso</h2>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">Catálogo institucional · Solo lectura</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {roles.map((role, index) => {
            const Icon = roleIcons[index] ?? ShieldCheck;

            return (
              <Card className="relative overflow-hidden" key={role.id}>
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-primary" />
                <CardHeader className="gap-4 pt-7">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-lg border bg-muted/40 text-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">ROL — {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <CardTitle>{role.displayName}</CardTitle>
                    <CardDescription className="mt-2 leading-6">{role.responsibility}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <ScopeLegend />

      <section aria-labelledby="faculty-matrix-title" className="grid gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">03 · Comparativa</p>
          <h2 id="faculty-matrix-title" className="mt-1 text-xl font-semibold">Facultades por área farmacéutica</h2>
        </div>
        <DesktopFacultyMatrix roles={roles} />
        <StackedFacultyMatrix roles={roles} />
      </section>

      <Alert>
        <ArrowRight aria-hidden="true" />
        <AlertTitle>Pertenencia y supervisión</AlertTitle>
        <AlertDescription>
          El Vendedor opera su propia caja, ventas y pendientes. Administrador y Superadministrador pueden supervisar
          registros ajenos cuando las reglas de estado y trazabilidad farmacéutica lo permiten.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ScopeLegend() {
  return (
    <section aria-labelledby="scope-legend-title" className="grid gap-4 rounded-xl border bg-muted/20 p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">02 · Claves de lectura</p>
        <h2 id="scope-legend-title" className="mt-1 text-xl font-semibold">Niveles de alcance</h2>
      </div>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(scopeLabels) as RoleScopeLevel[]).map((level) => (
          <div className="grid grid-cols-[auto_1fr] gap-3" key={level}>
            <ScopeMarker level={level} />
            <div>
              <p className="text-sm font-semibold text-foreground">{scopeLabels[level]}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{scopeExplanations[level]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DesktopFacultyMatrix({ roles }: { roles: RolesCatalogResponse }) {
  const areas = roles[0]?.faculties ?? [];

  return (
    <Card className="hidden overflow-hidden lg:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[24%] px-5 py-4">Área funcional</TableHead>
            {roles.map((role) => <TableHead className="px-5 py-4" key={role.id}>{role.displayName}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.map((area, areaIndex) => (
            <TableRow key={area.area}>
              <TableCell className="px-5 py-5 align-top font-semibold">{area.areaLabel}</TableCell>
              {roles.map((role) => {
                const faculty = role.faculties[areaIndex];
                return (
                  <TableCell className="px-5 py-5 align-top" key={`${role.id}-${area.area}`}>
                    <div className="grid gap-2">
                      <ScopeBadge level={faculty.level} />
                      <p className="text-xs leading-5 text-muted-foreground">{faculty.description}</p>
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function StackedFacultyMatrix({ roles }: { roles: RolesCatalogResponse }) {
  return (
    <div className="grid gap-4 lg:hidden">
      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>{role.displayName}</CardTitle>
            <CardDescription>Facultades institucionales por área</CardDescription>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {role.faculties.map((faculty) => (
              <div className="grid gap-2 px-5 py-4" key={faculty.area}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{faculty.areaLabel}</h3>
                  <ScopeBadge level={faculty.level} />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{faculty.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ScopeBadge({ level }: { level: RoleScopeLevel }) {
  return <Badge variant={level === "no_access" ? "outline" : level === "full_access" ? "default" : "secondary"}>{scopeLabels[level]}</Badge>;
}

function ScopeMarker({ level }: { level: RoleScopeLevel }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-1 size-3 rounded-full border-2 ${level === "full_access" ? "bg-primary" : level === "no_access" ? "bg-background" : "bg-muted-foreground"}`}
    />
  );
}

function RolesLoadingState() {
  return (
    <div aria-label="Cargando roles y facultades" className="grid gap-6" role="status">
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <Skeleton className="h-48 rounded-xl" key={item} />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <span className="sr-only">Cargando la política institucional de roles.</span>
    </div>
  );
}

function RolesRequestError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>No se pudo cargar la política de roles</AlertTitle>
      <AlertDescription className="grid gap-4">
        <p>La consulta no respondió. Puedes reintentar sin abandonar esta pantalla.</p>
        <Button className="w-fit" type="button" variant="outline" onClick={onRetry}>
          <RefreshCcw aria-hidden="true" /> Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function InvalidConfigurationState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>Inconsistencia de configuración</AlertTitle>
      <AlertDescription className="grid gap-4">
        <p>El catálogo recibido no contiene exactamente los tres roles institucionales y sus seis áreas. La matriz no puede mostrarse de forma segura.</p>
        <Button className="w-fit" type="button" variant="outline" onClick={onRetry}>
          <RefreshCcw aria-hidden="true" /> Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  );
}
