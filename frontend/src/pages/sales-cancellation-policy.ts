import type { CancelableSale, SaleCancellationBlockReason } from "@/modules/sales";

const cancellationBlockMessages: Record<SaleCancellationBlockReason, string> = {
  "already-cancelled": "La venta ya fue anulada y se conserva en el historial.",
  "cash-session-closed": "La caja asociada está cerrada; registra una devolución si corresponde.",
  forbidden: "La venta pertenece a otra persona y no puedes anularla.",
  "not-current-day": "La venta no corresponde a hoy y ya no puede anularla el vendedor.",
  unknown: "El estado actual de la venta no permite anularla."
};

export function isSaleCancellationAllowed(sale: CancelableSale | null) {
  return sale?.canCancel === true;
}

export function getSaleCancellationBlockMessage(sale: CancelableSale | null) {
  if (!sale) {
    return "Selecciona una venta para comprobar si se puede anular.";
  }

  return cancellationBlockMessages[sale.cancellationBlockedReason ?? "unknown"];
}

export function getSupervisedSellerFilter(canSupervise: boolean, sellerUserId: string) {
  return canSupervise ? sellerUserId : "";
}
