import { FormEvent, useState } from "react";
import { AlertCircle, PillBottle } from "lucide-react";
import { LoginRequestSchema } from "@pharmacy-pos/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "../store/auth-store";

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const authError = useAuthStore((state) => state.error);
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("admin");
  const [validationError, setValidationError] = useState<string | null>(null);
  const isLoading = status === "loading";

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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-3">
            <Button aria-label="Punto de venta" size="icon-lg" type="button">
              <PillBottle aria-hidden="true" size={22} />
            </Button>
            <div>
              <CardTitle>Iniciar sesión</CardTitle>
              <CardDescription>Accede al espacio de trabajo del punto de venta.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                <Input
                  autoComplete="current-password"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
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

            <Button disabled={isLoading} type="submit">
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
