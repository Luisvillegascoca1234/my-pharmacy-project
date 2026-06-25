import { resetBillingStore } from "@/modules/billing";
import { resetCashStore } from "@/modules/cash";
import { resetCashSupervisionStore } from "@/modules/cash-supervision";
import { resetHealthStatusStore } from "@/modules/health";
import { resetPendingCartsStore } from "@/modules/pending-carts";
import { resetPosStore } from "@/modules/pos";
import { resetProductsCatalogStore } from "@/modules/products";
import { resetPurchasesStore } from "@/modules/purchases";
import { resetReturnsStore } from "@/modules/returns";
import { resetSalesStore } from "@/modules/sales";
import { resetSuppliersStore } from "@/modules/suppliers";
import { resetUnitsCatalogStore } from "@/modules/units";
import { resetUsersAdminStore } from "@/modules/users";

export function resetSessionScopedState(): void {
  resetBillingStore();
  resetCashStore();
  resetCashSupervisionStore();
  resetPendingCartsStore();
  resetPosStore();
  resetProductsCatalogStore();
  resetPurchasesStore();
  resetReturnsStore();
  resetSalesStore();
  resetSuppliersStore();
  resetUnitsCatalogStore();
  resetHealthStatusStore();
  resetUsersAdminStore();
}
