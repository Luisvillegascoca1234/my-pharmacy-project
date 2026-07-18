import { isFeatureAllowed, type FeatureKey } from "@pharmacy-pos/shared";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  FileBarChart,
  FileCog,
  FileText,
  History,
  Home,
  Package,
  PackageSearch,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  Ruler,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Users,
  WalletCards,
  type LucideIcon
} from "lucide-react";

export type AppRouteKey = FeatureKey;

export type AppNavigationItem = {
  key: AppRouteKey;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
};

export type AppNavigationGroup = {
  label: string;
  items: AppNavigationItem[];
};

export const SALES_CANCELLATIONS_PATH = "/sales-cancellations";
export const PREPARED_INTERNAL_DOCUMENTS_PATH = "/invoices";
export const ADMINISTRATIVE_RETURNS_PATH = "/returns";
export const SIAT_SETTINGS_PATH = "/siat-settings";
export const REPORTS_PATH = "/reports";
export const EXPORTS_PATH = "/exports";
export const AUDIT_PATH = "/audit";

export const navigationGroups: AppNavigationGroup[] = [
  {
    label: "Inicio",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        icon: Home,
        description: "Indicadores operativos, alertas y salud del sistema."
      }
    ]
  },
  {
    label: "Operación",
    items: [
      {
        key: "pos",
        label: "Punto de venta",
        path: "/pos",
        icon: Store,
        description: "Registro de ventas, selección FEFO y cobro al contado."
      },
      {
        key: "pendingCarts",
        label: "Pendientes POS",
        path: "/pending-carts",
        icon: ClipboardList,
        description: "Carritos propios para retomar, editar, descartar o cobrar en mostrador."
      },
      {
        key: "cash",
        label: "Caja",
        path: "/cash",
        icon: WalletCards,
        description: "Apertura, cierre, pagos y diferencias de caja."
      },
      {
        key: "supervision",
        label: "Supervisión POS",
        path: "/supervision",
        icon: ShieldCheck,
        description: "Control administrativo de cajas, ventas anulables y pendientes de mostrador."
      },
      {
        key: "sales",
        label: "Ventas y anulaciones",
        path: SALES_CANCELLATIONS_PATH,
        icon: RefreshCcw,
        description: "Consulta de ventas recientes y anulación controlada mientras la caja siga abierta."
      },
      {
        key: "alerts",
        label: "Alertas",
        path: "/alerts",
        icon: AlertTriangle,
        description: "Stock bajo, vencimientos y cajas abiertas que requieren atención."
      }
    ]
  },
  {
    label: "Inventario",
    items: [
      {
        key: "products",
        label: "Productos",
        path: "/products",
        icon: Package,
        description: "Catálogo farmacéutico, precios, categorías y requisitos sanitarios."
      },
      {
        key: "units",
        label: "Unidades y conversiones",
        path: "/units",
        icon: Ruler,
        description: "Presentaciones comerciales y equivalencias hacia unidad base."
      },
      {
        key: "batches",
        label: "Lotes y stock",
        path: "/batches",
        icon: Boxes,
        description: "Existencias por lote, vencimiento y estado operativo."
      },
      {
        key: "movements",
        label: "Movimientos",
        path: "/movements",
        icon: History,
        description: "Trazabilidad de entradas, salidas, ajustes, devoluciones y mermas."
      },
      {
        key: "adjustments",
        label: "Ajustes manuales",
        path: "/adjustments",
        icon: ClipboardList,
        description: "Correcciones justificadas con auditoría y motivo obligatorio."
      }
    ]
  },
  {
    label: "Compras",
    items: [
      {
        key: "suppliers",
        label: "Proveedores",
        path: "/suppliers",
        icon: Truck,
        description: "Datos comerciales, NIT, contacto y estado de proveedores."
      },
      {
        key: "purchases",
        label: "Compras",
        path: "/purchases",
        icon: ShoppingCart,
        description: "Compras en borrador, recepción, lotes generados y anulaciones."
      }
    ]
  },
  {
    label: "Facturación",
    items: [
      {
        key: "invoices",
        label: "Comprobantes internos",
        path: PREPARED_INTERNAL_DOCUMENTS_PATH,
        icon: ReceiptText,
        description: "Preparación y cancelación administrativa de comprobantes internos desde ventas POS, sin emisión SIAT."
      },
      {
        key: "returns",
        label: "Devoluciones administrativas",
        path: ADMINISTRATIVE_RETURNS_PATH,
        icon: RotateCcw,
        description: "Devolución total posterior al cierre de caja; con caja abierta corresponde anulación POS."
      },
      {
        key: "siatSettings",
        label: "Configuración SIAT",
        path: SIAT_SETTINGS_PATH,
        icon: FileCog,
        description: "CUIS, CUFD, punto de venta, actividad económica y contingencia."
      }
    ]
  },
  {
    label: "Análisis",
    items: [
      {
        key: "reports",
        label: "Reportes operativos",
        path: REPORTS_PATH,
        icon: BarChart3,
        description: "Ventas diarias, valuacion de inventario disponible y proximos vencimientos; consulta visual sin auditoria de descarga."
      },
      {
        key: "exports",
        label: "Exportaciones CSV",
        path: EXPORTS_PATH,
        icon: FileText,
        description: "Descargas CSV auditadas de ventas POS y movimientos de inventario con filtros de fecha."
      },
      {
        key: "audit",
        label: "Registro de auditoria",
        path: AUDIT_PATH,
        icon: FileBarChart,
        description: "Consulta de acciones sensibles con filtros y metadata completa para investigacion superadmin."
      }
    ]
  },
  {
    label: "Administración",
    items: [
      {
        key: "users",
        label: "Usuarios",
        path: "/users",
        icon: Users,
        description: "Cuentas, estado de acceso y asignación inicial de roles."
      },
      {
        key: "roles",
        label: "Roles y facultades",
        path: "/roles",
        icon: Shield,
        description: "Responsabilidades y facultades institucionales de los tres roles fijos."
      },
      {
        key: "settings",
        label: "Configuración",
        path: "/settings",
        icon: Settings,
        description: "Parámetros globales de operación de la farmacia."
      }
    ]
  }
];

export const navigationItems = navigationGroups.flatMap((group) => group.items);

export function getVisibleNavigationGroups(roleName: string) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isRouteAllowedForRole(item, roleName))
    }))
    .filter((group) => group.items.length > 0);
}

export function getVisibleNavigationItems(roleName: string) {
  return navigationItems.filter((item) => isRouteAllowedForRole(item, roleName));
}

export function isRouteAllowedForRole(item: Pick<AppNavigationItem, "key"> | { key: string }, roleName: string) {
  return isFeatureAllowed(roleName, item.key);
}
