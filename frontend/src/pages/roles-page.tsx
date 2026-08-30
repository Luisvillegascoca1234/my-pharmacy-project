import type { RolesRequestStatus, RoleScopeLevel, RolesCatalogResponse } from "@/modules/roles";
import { administrationNavigation, ContextNavigation } from "@/components/context-navigation";
import { AlertCircle, ArrowRight, ClipboardCheck, RefreshCcw, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRolesCatalog } from "@/modules/roles";

const scopeLabels: Record<RoleScopeLevel, string> = {
  full_access: "Acceso total",
  operational_access: "Puede trabajar",
  own_records_only: "Solo registros propios",
  no_access: "Sin acceso"
};

const scopeExplanations: Record<RoleScopeLevel, string> = {
  full_access: "Gestiona y supervisa el área completa.",
  operational_access: "Puede usar las funciones habituales del área.",
  own_records_only: "Solo puede trabajar con sus propios registros.",
  no_access: "No puede entrar a esta área."
};

const roleIcons = [ShieldCheck, ClipboardCheck, UserRoundCheck] as const;

const roleDescriptions: Record<string, string> = {
  admin: "Gestiona el trabajo diario y supervisa al equipo.",
  seller: "Atiende ventas y trabaja con sus propios registros.",
  superadmin: "Controla todas las áreas y administra usuarios."
};

const areaLabels: Record<string, string> = {
  administrative_closure_analysis: "Cierres y reportes",
  counter_operations: "Ventas y caja",
  inventory_traceability: "Inventario",
  pharmaceutical_catalog: "Productos",
  supply: "Compras y proveedores",
  system_governance: "Usuarios y auditoría"
};

export function RolesPage() {
  const catalog = useRolesCatalog();

  return (
    <div className="grid gap-5">
      <ContextNavigation ariaLabel="Opciones de administración" items={administrationNavigation} />
      <RolesPageView roles={catalog.roles} status={catalog.status} onRetry={() => void catalog.reload()} />
    </div>
  );
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
          <div className="max-w-3xl space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Roles y permisos</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Consulta qué puede hacer cada tipo de usuario.
            </p>
          </div>
          <div className="relative grid gap-2 border-l-2 border-primary pl-4 text-sm">
            <span className="font-medium text-foreground">Solo lectura</span>
            <span className="leading-5 text-muted-foreground">Los permisos son fijos. Para cambiar el acceso de una persona, asígnale otro rol.</span>
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
        <h2 id="role-summaries-title" className="text-xl font-semibold">Tipos de usuario</h2>
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
                  </div>
                  <div>
                    <CardTitle>{role.displayName}</CardTitle>
                    <CardDescription className="mt-2 leading-6">{roleDescriptions[role.name] ?? role.responsibility}</CardDescription>
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
          <h2 id="faculty-matrix-title" className="text-xl font-semibold">Permisos por área</h2>
        </div>
        <DesktopFacultyMatrix roles={roles} />
        <StackedFacultyMatrix roles={roles} />
      </section>

      <Alert>
        <ArrowRight aria-hidden="true" />
        <AlertTitle>Trabajo propio y supervisión</AlertTitle>
        <AlertDescription>
          El Vendedor trabaja con su propia caja y sus ventas. Administrador y Superadministrador también pueden revisar
          el trabajo del equipo.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ScopeLegend() {
  return (
    <section aria-labelledby="scope-legend-title" className="grid gap-4 rounded-xl border bg-muted/20 p-5 sm:p-6">
      <div>
        <h2 id="scope-legend-title" className="text-xl font-semibold">Niveles de acceso</h2>
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
            <TableHead className="w-[24%] px-5 py-4">Área</TableHead>
            {roles.map((role) => <TableHead className="px-5 py-4" key={role.id}>{role.displayName}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.map((area, areaIndex) => (
            <TableRow key={area.area}>
              <TableCell className="px-5 py-5 align-top font-semibold">{areaLabels[area.area] ?? area.areaLabel}</TableCell>
              {roles.map((role) => {
                const faculty = role.faculties[areaIndex];
                return (
                  <TableCell className="px-5 py-5 align-top" key={`${role.id}-${area.area}`}>
                    <div className="grid gap-2">
                      <ScopeBadge level={faculty.level} />
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
            <CardDescription>Permisos por área</CardDescription>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {role.faculties.map((faculty) => (
              <div className="grid gap-2 px-5 py-4" key={faculty.area}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{areaLabels[faculty.area] ?? faculty.areaLabel}</h3>
                  <ScopeBadge level={faculty.level} />
                </div>
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
    <div aria-label="Cargando roles y permisos" className="grid gap-6" role="status">
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <Skeleton className="h-48 rounded-xl" key={item} />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <span className="sr-only">Cargando roles y permisos.</span>
    </div>
  );
}

function RolesRequestError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>No se pudieron cargar los roles</AlertTitle>
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
      <AlertTitle>No se pueden mostrar los permisos</AlertTitle>
      <AlertDescription className="grid gap-4">
        <p>La información de roles está incompleta. Intenta cargarla nuevamente.</p>
        <Button className="w-fit" type="button" variant="outline" onClick={onRetry}>
          <RefreshCcw aria-hidden="true" /> Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  );
}
