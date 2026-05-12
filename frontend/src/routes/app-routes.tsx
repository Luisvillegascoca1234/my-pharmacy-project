import type { AuthenticatedUser } from "@pharmacy-pos/shared";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "@/pages/dashboard-page";
import { ModulePage } from "@/pages/module-page";
import { ProductsPage } from "@/pages/products-page";
import { PurchaseFormPage } from "@/pages/purchase-form-page";
import { PurchasesPage } from "@/pages/purchases-page";
import { SupplierFormPage } from "@/pages/supplier-form-page";
import { SuppliersPage } from "@/pages/suppliers-page";
import { UnitsPage } from "@/pages/units-page";
import { UsersPage } from "@/pages/users-page";
import { getVisibleNavigationItems, navigationItems } from "./navigation";

type AppRoutesProps = {
  user: AuthenticatedUser;
};

export function AppRoutes({ user }: AppRoutesProps) {
  const visibleItems = getVisibleNavigationItems(user.role.name);
  const canAccessSuppliers = visibleItems.some((item) => item.key === "suppliers");
  const canAccessPurchases = visibleItems.some((item) => item.key === "purchases");

  return (
    <Routes>
      <Route element={<Navigate replace to="/dashboard" />} path="/" />
      {visibleItems.map((item) => (
        <Route
          key={item.key}
          element={
            item.key === "dashboard" ? (
              <DashboardPage />
            ) : item.key === "products" ? (
              <ProductsPage />
            ) : item.key === "suppliers" ? (
              <SuppliersPage />
            ) : item.key === "purchases" ? (
              <PurchasesPage />
            ) : item.key === "units" ? (
              <UnitsPage />
            ) : item.key === "users" ? (
              <UsersPage />
            ) : (
              <ModulePage description={item.description} icon={item.icon} title={item.label} />
            )
          }
          path={item.path}
        />
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
      <Route element={<Navigate replace to={visibleItems[0]?.path ?? "/dashboard"} />} path="*" />
    </Routes>
  );
}

export function getRouteTitle(pathname: string) {
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
