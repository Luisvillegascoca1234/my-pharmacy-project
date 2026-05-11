import type { AuthenticatedUser } from "@pharmacy-pos/shared";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "@/pages/dashboard-page";
import { ModulePage } from "@/pages/module-page";
import { ProductsPage } from "@/pages/products-page";
import { UnitsPage } from "@/pages/units-page";
import { UsersPage } from "@/pages/users-page";
import { getVisibleNavigationItems, navigationItems } from "./navigation";

type AppRoutesProps = {
  user: AuthenticatedUser;
};

export function AppRoutes({ user }: AppRoutesProps) {
  const visibleItems = getVisibleNavigationItems(user.role.name);

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
      <Route element={<Navigate replace to={visibleItems[0]?.path ?? "/dashboard"} />} path="*" />
    </Routes>
  );
}

export function getRouteTitle(pathname: string) {
  return navigationItems.find((item) => item.path === pathname)?.label ?? "Dashboard";
}
