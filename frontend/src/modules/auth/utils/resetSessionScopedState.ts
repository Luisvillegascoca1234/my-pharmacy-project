import { resetHealthStatusStore } from "@/modules/health";
import { resetProductsCatalogStore } from "@/modules/products";
import { resetPurchasesStore } from "@/modules/purchases";
import { resetSuppliersStore } from "@/modules/suppliers";
import { resetUnitsCatalogStore } from "@/modules/units";
import { resetUsersAdminStore } from "@/modules/users";

export function resetSessionScopedState(): void {
  resetProductsCatalogStore();
  resetPurchasesStore();
  resetSuppliersStore();
  resetUnitsCatalogStore();
  resetHealthStatusStore();
  resetUsersAdminStore();
}
