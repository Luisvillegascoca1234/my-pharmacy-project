import type { AuthenticatedUser } from "@pharmacy-pos/shared";
import type { ComponentType } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { AdjustmentsPage } from "@/pages/adjustments-page";
import { AdministrativeSupervisionPage } from "@/pages/administrative-supervision-page";
import { AlertsPage } from "@/pages/alerts-page";
import { BatchesPage } from "@/pages/batches-page";
import { CashPage } from "@/pages/cash-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { AuditPage } from "@/pages/audit-page";
import { ExportsPage } from "@/pages/exports-page";
import { InvoicesPage } from "@/pages/invoices-page";
import { ModulePage } from "@/pages/module-page";
import { MovementsPage } from "@/pages/movements-page";
import { PosPage } from "@/pages/pos-page";
import { ProductsPage } from "@/pages/products-page";
import { PurchaseFormPage } from "@/pages/purchase-form-page";
import { PurchasesPage } from "@/pages/purchases-page";
import { ReportsPage } from "@/pages/reports-page";
import { ReturnsPage } from "@/pages/returns-page";
import { SalesCancellationPage } from "@/pages/sales-cancellation-page";
import { SupplierFormPage } from "@/pages/supplier-form-page";
import { SuppliersPage } from "@/pages/suppliers-page";
import { UnitsPage } from "@/pages/units-page";
import { UsersPage } from "@/pages/users-page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ADMINISTRATIVE_RETURNS_PATH,
  PREPARED_INTERNAL_DOCUMENTS_PATH,
  SIAT_SETTINGS_PATH,
  isRouteAllowedForRole,
  navigationItems,
  type AppNavigationItem,
  type AppRouteKey
} from "./navigation";

type AppRoutesProps = {
  user: AuthenticatedUser;
};

const routePages: Partial<Record<AppRouteKey, ComponentType>> = {
  adjustments: AdjustmentsPage,
  alerts: AlertsPage,
  audit: AuditPage,
  batches: BatchesPage,
  cash: CashPage,
  dashboard: DashboardPage,
  exports: ExportsPage,
  invoices: InvoicesPage,
  movements: MovementsPage,
  pos: PosPage,
  products: ProductsPage,
  purchases: PurchasesPage,
  reports: ReportsPage,
  returns: ReturnsPage,
  salesCancellations: SalesCancellationPage,
  supervision: AdministrativeSupervisionPage,
  suppliers: SuppliersPage,
  units: UnitsPage,
  users: UsersPage
};

export function AppRoutes({ user }: AppRoutesProps) {
  const allowedItems = navigationItems.filter((item) => isRouteAllowedForRole(item, user.role.name));
  const blockedItems = navigationItems.filter((item) => !isRouteAllowedForRole(item, user.role.name));
  const canAccessSuppliers = allowedItems.some((item) => item.key === "suppliers");
  const canAccessPurchases = allowedItems.some((item) => item.key === "purchases");

  return (
    <Routes>
      <Route element={<Navigate replace to="/dashboard" />} path="/" />
      {allowedItems.map((item) => (
        <Route key={item.key} element={buildNavigationRouteElement(item)} path={item.path} />
      ))}
      {blockedItems.map((item) => (
        <Route key={item.key} element={<RouteAccessDeniedPage item={item} />} path={item.path} />
      ))}
      {canAccessSuppliers ? (
        <>
          <Route element={<SupplierFormPage mode="create" />} path="/suppliers/new" />
          <Route element={<SupplierFormPage mode="detail" />} path="/suppliers/:id" />
        </>
      ) : null}
      {canAccessPurchases ? (
        <>
          <Route element={<PurchaseFormPage mode="create" />} path="/purchases/new" />
          <Route element={<PurchaseFormPage mode="detail" />} path="/purchases/:id" />
        </>
      ) : null}
      <Route element={<Navigate replace to={allowedItems[0]?.path ?? "/dashboard"} />} path="*" />
    </Routes>
  );
}

function buildNavigationRouteElement(item: AppNavigationItem) {
  if (item.key === "pendingCarts") {
    return <PosPage focus="pending" />;
  }

  const Page = routePages[item.key];

  return Page ? <Page /> : <ModulePage description={item.description} icon={item.icon} title={item.label} />;
}

function RouteAccessDeniedPage({ item }: { item: AppNavigationItem }) {
  const navigate = useNavigate();

  return (
    <section className="mx-auto grid max-w-3xl gap-5">
      <Alert variant="destructive">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Acceso no autorizado</AlertTitle>
        <AlertDescription>Tu rol actual no permite abrir esta ruta operativa.</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{item.label}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
          <Button className="w-fit" type="button" variant="outline" onClick={() => navigate("/dashboard", { replace: true })}>
            Ir al dashboard
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

export function getRouteTitle(pathname: string) {
  if (pathname === PREPARED_INTERNAL_DOCUMENTS_PATH) {
    return "Comprobantes internos";
  }

  if (pathname === ADMINISTRATIVE_RETURNS_PATH) {
    return "Devoluciones administrativas";
  }

  if (pathname === SIAT_SETTINGS_PATH) {
    return "Configuración SIAT";
  }

  if (pathname === "/suppliers/new") {
    return "Nuevo proveedor";
  }

  if (pathname.startsWith("/suppliers/")) {
    return "Detalle de proveedor";
  }

  if (pathname === "/purchases/new") {
    return "Nueva compra";
  }

  if (pathname.startsWith("/purchases/")) {
    return "Detalle de compra";
  }

  return navigationItems.find((item) => item.path === pathname)?.label ?? "Dashboard";
}
