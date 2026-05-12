import { resetHealthStatusStore } from "@/modules/health";
import { resetProductsCatalogStore } from "@/modules/products";
import { resetSuppliersStore } from "@/modules/suppliers";
import { resetUnitsCatalogStore } from "@/modules/units";
import { resetUsersAdminStore } from "@/modules/users";

export function resetSessionScopedState(): void {
  resetProductsCatalogStore();
  resetSuppliersStore();
  resetUnitsCatalogStore();
  resetHealthStatusStore();
  resetUsersAdminStore();
}
