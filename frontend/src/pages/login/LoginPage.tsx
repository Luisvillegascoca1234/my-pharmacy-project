import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Cross, LockKeyhole, PillBottle, ShieldCheck } from "lucide-react";
import { LoginRequestSchema } from "@pharmacy-pos/shared";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { selectAuthErrorCode, selectAuthStatus, selectAuthUser, useAuthStore } from "@/modules/auth";
import { getAuthErrorMessage } from "./auth-error-messages";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore(selectAuthStatus);
  const user = useAuthStore(selectAuthUser);
  const authErrorCode = useAuthStore(selectAuthErrorCode);
  const authError = getAuthErrorMessage(authErrorCode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const isLoading = status === "loading";

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = LoginRequestSchema.safeParse({ email, password });

    if (!result.success) {
      setValidationError("Ingresa un correo electrónico y una contraseña válidos.");
      return;
    }

    setValidationError(null);
    await login(result.data);
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background lg:grid-cols-[minmax(24rem,0.85fr)_minmax(32rem,1.15fr)]">
      <section className="relative hidden overflow-hidden border-r border-primary/15 bg-primary px-12 py-10 text-primary-foreground lg:flex lg:flex-col">
        <div aria-hidden="true" className="absolute -left-24 -top-24 size-96 rounded-full border border-primary-foreground/10" />
        <div aria-hidden="true" className="absolute -left-10 -top-10 size-64 rounded-full border border-primary-foreground/10" />
        <div className="relative flex items-center gap-3">
          <span className="relative flex size-11 items-center justify-center rounded-xl bg-primary-foreground/12 ring-1 ring-primary-foreground/20">
            <PillBottle aria-hidden="true" className="size-5" />
            <Cross aria-hidden="true" className="absolute -right-1 -top-1 size-3 rounded-sm bg-primary-foreground p-0.5 text-primary" />
          </span>
          <div><p className="text-lg font-semibold tracking-[-0.02em]">Farmacia POS</p><p className="text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground/65">Ventas e inventario</p></div>
        </div>

        <div className="relative my-auto max-w-lg space-y-8">
          <div className="space-y-4">
            <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground" variant="outline">Trabajo diario</Badge>
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.035em]">Todo el trabajo de la farmacia en un solo lugar.</h1>
            <p className="max-w-md text-base leading-7 text-primary-foreground/72">Abre caja, registra ventas y controla el inventario.</p>
          </div>
          <div className="grid gap-3">
            {["Abre y cierra la caja", "Registra ventas de mostrador", "Controla lotes y vencimientos"].map((benefit) => (
              <div className="flex items-center gap-3 text-sm font-medium" key={benefit}><CheckCircle2 aria-hidden="true" className="size-4 text-primary-foreground/70" />{benefit}</div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-foreground/55">Acceso exclusivo para personal autorizado.</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div aria-hidden="true" className="absolute right-0 top-0 h-56 w-56 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_70%)]" />
        <Card className="relative w-full max-w-md gap-6 px-1 py-6 shadow-md">
          <CardHeader className="gap-4 px-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden"><PillBottle aria-hidden="true" className="size-5" /></div>
            <div className="space-y-1.5">
              <CardTitle className="text-xl">Iniciar sesión</CardTitle>
              <CardDescription>Ingresa tu correo y contraseña.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <form className="grid gap-5" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Input
                  autoComplete="email"
                  id="email"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <div className="relative"><LockKeyhole aria-hidden="true" className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input
                  className="pl-9"
                  autoComplete="current-password"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                /></div>
              </Field>
            </FieldGroup>

            {validationError ? <FieldError>{validationError}</FieldError> : null}

            {authError ? (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle>No se pudo iniciar sesión</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            ) : null}

            <Button className="mt-1 w-full" disabled={isLoading} size="lg" type="submit">
              <ShieldCheck aria-hidden="true" />
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">Tus acciones pueden quedar registradas.</p>
        </CardContent>
      </Card>
      </section>
    </main>
  );
}
