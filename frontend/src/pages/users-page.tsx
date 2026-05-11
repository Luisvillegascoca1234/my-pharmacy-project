import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CreateUser, UpdateUser, User, UserStatus } from "@pharmacy-pos/shared";
import { Edit3, KeyRound, Lock, RefreshCcw, Save, Search, ShieldAlert, UserCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsersAdmin } from "@/modules/users";

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
  const [form, setForm] = useState<UserFormState>(emptyUserForm);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const selectedUser = useMemo(() => admin.users.find((user) => user.id === selectedUserId) ?? null, [admin.users, selectedUserId]);
  const defaultRoleId = admin.roles[0]?.id ?? "";

  useEffect(() => {
    if (!selectedUser) {
      setForm((currentForm) => ({
        ...currentForm,
        roleId: currentForm.roleId || defaultRoleId
      }));
      return;
    }

    setForm({
      email: selectedUser.email,
      fullName: selectedUser.fullName,
      password: "",
      roleId: selectedUser.roleId
    });
  }, [defaultRoleId, selectedUser]);

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

        await admin.saveUser(input, selectedUser.id);
      } else {
        const input: CreateUser = {
          email: form.email,
          fullName: form.fullName,
          roleId: form.roleId,
          password: form.password
        };

        await admin.saveUser(input);
      }

      setSelectedUserId(null);
      setForm({
        ...emptyUserForm,
        roleId: defaultRoleId
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar el usuario.");
    }
  }

  async function handleStatusChange(userId: string, status: UserStatus) {
    setSubmitError(null);

    try {
      await admin.updateStatus(userId, status);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo cambiar el estado del usuario.");
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
      setPasswordError(error instanceof Error ? error.message : "No se pudo resetear la contraseña.");
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Administración
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Usuarios</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Gestión de accesos, roles operativos y estados de cuenta para el sistema.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[520px]">
          <Metric label="Total" value={summary.total} />
          <Metric label="Activos" value={summary.active} />
          <Metric label="Bloqueados" value={summary.blocked} />
        </div>
      </div>

      {admin.error || submitError ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <ShieldAlert aria-hidden="true" className="size-4" />
          {submitError ?? admin.error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
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
              <NativeSelect className="w-full" value={admin.roleId} onChange={(event) => admin.setRoleId(event.target.value)}>
                <NativeSelectOption value="all">Todos los roles</NativeSelectOption>
                {admin.roles.map((role) => (
                  <NativeSelectOption key={role.id} value={role.id}>
                    {role.displayName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
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
                    <TableCell>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("es-BO") : "Sin ingreso"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedUserId(user.id)}>
                          <Edit3 aria-hidden="true" />
                          Editar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPasswordUser(user)}>
                          <KeyRound aria-hidden="true" />
                          Resetear
                        </Button>
                        {user.status !== "active" ? (
                          <Button size="sm" variant="outline" onClick={() => void handleStatusChange(user.id, "active")}>
                            <UserCheck aria-hidden="true" />
                            Activar
                          </Button>
                        ) : null}
                        {user.status !== "inactive" ? (
                          <Button size="sm" variant="outline" onClick={() => void handleStatusChange(user.id, "inactive")}>
                            <UserMinus aria-hidden="true" />
                            Desactivar
                          </Button>
                        ) : null}
                        {user.status !== "blocked" ? (
                          <Button size="sm" variant="outline" onClick={() => void handleStatusChange(user.id, "blocked")}>
                            <Lock aria-hidden="true" />
                            Bloquear
                          </Button>
                        ) : null}
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

        <Card>
          <CardHeader>
            <CardTitle>{selectedUser ? "Editar usuario" : "Nuevo usuario"}</CardTitle>
            <CardDescription>Asigna el rol operativo y el estado inicial de acceso.</CardDescription>
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
                      setForm({ ...emptyUserForm, roleId: defaultRoleId });
                    }}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(passwordUser)} onOpenChange={(open) => (!open ? setPasswordUser(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear contraseña</DialogTitle>
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
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users aria-hidden="true" className="size-4" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
