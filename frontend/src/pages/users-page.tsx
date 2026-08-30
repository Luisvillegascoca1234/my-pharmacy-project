import { FormEvent, useEffect, useMemo, useState } from "react";
import { administrationNavigation, ContextNavigation } from "@/components/context-navigation";
import type { CreateUser, UpdateUser, User, UserStatus } from "@pharmacy-pos/shared";
import { Edit3, KeyRound, Lock, MoreHorizontal, RefreshCcw, Save, Search, ShieldAlert, UserCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsersAdmin } from "@/modules/users";
import { getUserManagementErrorMessage, getUsersLoadErrorMessage } from "./users/user-management-errors";

type UserFormState = {
  email: string;
  fullName: string;
  password: string;
  roleId: string;
};

type PasswordFormState = {
  password: string;
  confirmPassword: string;
};

const emptyUserForm: UserFormState = {
  email: "",
  fullName: "",
  password: "",
  roleId: ""
};

const emptyPasswordForm: PasswordFormState = {
  password: "",
  confirmPassword: ""
};

const userStatusLabels: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  blocked: "Bloqueado"
};

const userStatusBadgeVariant: Record<UserStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  inactive: "secondary",
  blocked: "destructive"
};

export function UsersPage() {
  const admin = useUsersAdmin();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"form" | "list">("list");
  const [form, setForm] = useState<UserFormState>(emptyUserForm);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const loadError = getUsersLoadErrorMessage(admin.errorCode);

  const selectedUser = useMemo(() => admin.users.find((user) => user.id === selectedUserId) ?? null, [admin.users, selectedUserId]);
  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    setForm({
      email: selectedUser.email,
      fullName: selectedUser.fullName,
      password: "",
      roleId: selectedUser.roleId
    });
  }, [selectedUser]);

  const summary = useMemo(
    () => ({
      total: admin.users.length,
      active: admin.users.filter((user) => user.status === "active").length,
      blocked: admin.users.filter((user) => user.status === "blocked").length
    }),
    [admin.users]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    try {
      if (selectedUser) {
        const input: UpdateUser = {
          email: form.email,
          fullName: form.fullName,
          roleId: form.roleId
        };

        await admin.updateUser(selectedUser.id, input);
      } else {
        const input: CreateUser = {
          email: form.email,
          fullName: form.fullName,
          roleId: form.roleId,
          password: form.password
        };

        await admin.createUser(input);
      }

      setSelectedUserId(null);
      setForm(emptyUserForm);
      setActivePanel("list");
    } catch (error) {
      setSubmitError(getUserManagementErrorMessage(error, "No se pudo guardar el usuario."));
    }
  }

  async function handleStatusChange(userId: string, status: UserStatus) {
    setSubmitError(null);

    try {
      await admin.updateStatus(userId, status);
    } catch (error) {
      setSubmitError(getUserManagementErrorMessage(error, "No se pudo cambiar el estado del usuario."));
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordUser) {
      return;
    }

    setPasswordError(null);

    try {
      await admin.resetPassword(passwordUser.id, passwordForm);
      setPasswordUser(null);
      setPasswordForm(emptyPasswordForm);
    } catch (error) {
      setPasswordError(getUserManagementErrorMessage(error, "No se pudo restablecer la contraseña."));
    }
  }

  return (
    <section className="grid gap-5">
      <ContextNavigation ariaLabel="Opciones de administración" items={administrationNavigation} />
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Usuarios</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Crea usuarios y define qué pueden hacer en la farmacia.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[520px]">
          <Metric label="Total" value={summary.total} />
          <Metric label="Activos" value={summary.active} />
          <Metric label="Bloqueados" value={summary.blocked} />
        </div>
      </div>

      {loadError || submitError ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <ShieldAlert aria-hidden="true" className="size-4" />
          {submitError ?? loadError}
        </div>
      ) : null}

      <Tabs value={activePanel} onValueChange={(value) => setActivePanel(value as "form" | "list")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">Lista de usuarios</TabsTrigger>
          <TabsTrigger
            value="form"
            onClick={() => {
              if (activePanel === "list") {
                setSelectedUserId(null);
                setForm(emptyUserForm);
              }
            }}
          >
            {selectedUser ? "Editar usuario" : "Nuevo usuario"}
          </TabsTrigger>
        </TabsList>
        <TabsContent className="mt-5" value="list">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Lista de usuarios</CardTitle>
                <CardDescription>Filtra por nombre, correo, rol o estado de acceso.</CardDescription>
              </div>
              <Button variant="outline" onClick={() => void admin.reload()}>
                <RefreshCcw aria-hidden="true" />
                Actualizar
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Buscar usuario" value={admin.search} onChange={(event) => admin.setSearch(event.target.value)} />
              </div>
              <NativeSelect aria-label="Filtrar por rol" className="w-full" value={admin.roleId} onChange={(event) => admin.setRoleId(event.target.value)}>
                <NativeSelectOption value="all">Todos los roles</NativeSelectOption>
                {admin.roles.map((role) => (
                  <NativeSelectOption key={role.id} value={role.id}>
                    {role.displayName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                aria-label="Filtrar por estado"
                className="w-full"
                value={admin.statusFilter}
                onChange={(event) => admin.setStatusFilter(event.target.value as UserStatus | "all")}
              >
                <NativeSelectOption value="all">Todos los estados</NativeSelectOption>
                <NativeSelectOption value="active">Activos</NativeSelectOption>
                <NativeSelectOption value="inactive">Inactivos</NativeSelectOption>
                <NativeSelectOption value="blocked">Bloqueados</NativeSelectOption>
              </NativeSelect>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último ingreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admin.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.role.displayName}</TableCell>
                    <TableCell>
                      <Badge variant={userStatusBadgeVariant[user.status]}>{userStatusLabels[user.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString("es-BO", { timeZone: "America/La_Paz" })
                        : "Sin ingreso"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setActivePanel("form");
                          }}
                        >
                          <Edit3 aria-hidden="true" />
                          Editar
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-label={`Más acciones para ${user.fullName}`} size="icon-sm" variant="outline">
                              <MoreHorizontal aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onSelect={() => setPasswordUser(user)}>
                              <KeyRound aria-hidden="true" /> Restablecer contraseña
                            </DropdownMenuItem>
                            {user.status !== "active" ? (
                              <DropdownMenuItem onSelect={() => void handleStatusChange(user.id, "active")}>
                                <UserCheck aria-hidden="true" /> Activar acceso
                              </DropdownMenuItem>
                            ) : null}
                            {user.status !== "inactive" ? (
                              <DropdownMenuItem onSelect={() => void handleStatusChange(user.id, "inactive")}>
                                <UserMinus aria-hidden="true" /> Desactivar acceso
                              </DropdownMenuItem>
                            ) : null}
                            {user.status !== "blocked" ? (
                              <DropdownMenuItem variant="destructive" onSelect={() => void handleStatusChange(user.id, "blocked")}>
                                <Lock aria-hidden="true" /> Bloquear acceso
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {admin.users.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-32 text-center text-muted-foreground" colSpan={5}>
                      {admin.status === "loading" ? "Cargando usuarios..." : "No hay usuarios con los filtros actuales."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </TabsContent>
        <TabsContent className="mt-5 max-w-2xl" value="form">
        <Card>
          <CardHeader>
            <CardTitle>{selectedUser ? "Editar usuario" : "Nuevo usuario"}</CardTitle>
            <CardDescription>Completa sus datos y elige el tipo de acceso que necesita.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Field>
                <FieldLabel>Nombre completo</FieldLabel>
                <Input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
              </Field>
              <Field>
                <FieldLabel>Correo electrónico</FieldLabel>
                <Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field>
                <FieldLabel>Rol</FieldLabel>
                <NativeSelect className="w-full" required value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })}>
                  <NativeSelectOption value="" disabled>
                    Selecciona un rol
                  </NativeSelectOption>
                  {admin.roles.map((role) => (
                    <NativeSelectOption key={role.id} value={role.id}>
                      {role.displayName}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              {!selectedUser ? (
                <Field>
                  <FieldLabel>Contraseña inicial</FieldLabel>
                  <Input
                    required
                    minLength={6}
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                  />
                </Field>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button disabled={!admin.canManage || !form.roleId} type="submit">
                  {selectedUser ? <Save aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
                  {selectedUser ? "Guardar cambios" : "Crear usuario"}
                </Button>
                {selectedUser ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedUserId(null);
                      setForm(emptyUserForm);
                    }}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(passwordUser)} onOpenChange={(open) => (!open ? setPasswordUser(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>{passwordUser ? `Define una nueva contraseña para ${passwordUser.fullName}.` : ""}</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handlePasswordSubmit}>
            {passwordError ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <ShieldAlert aria-hidden="true" className="size-4" />
                {passwordError}
              </div>
            ) : null}
            <Field>
              <FieldLabel>Nueva contraseña</FieldLabel>
              <Input
                required
                minLength={6}
                type="password"
                value={passwordForm.password}
                onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Confirmar contraseña</FieldLabel>
              <Input
                required
                minLength={6}
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              />
            </Field>
            <DialogFooter>
              <Button type="submit">
                <KeyRound aria-hidden="true" />
                Guardar contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-3.5 py-3 shadow-xs">
      <div className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        <Users aria-hidden="true" className="size-4" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.025em]">{value}</p>
    </div>
  );
}
