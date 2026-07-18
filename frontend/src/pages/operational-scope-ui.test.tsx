import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CancelableSale } from "@/modules/sales";
import { OperationalScopeNotice, SupervisionOnly } from "@/components/operational-scope-notice";
import {
  getSaleCancellationBlockMessage,
  getSupervisedSellerFilter,
  isSaleCancellationAllowed
} from "./sales-cancellation-policy";

describe("operational ownership and supervision UI", () => {
  it("communicates own-record scope to sellers without exposing supervision", () => {
    const markup = renderToStaticMarkup(
      <OperationalScopeNotice
        canSupervise={false}
        ownRecordsDescription="La consulta está limitada por el servidor a tu caja, ventas y pendientes."
        supervisionDescription="Puedes supervisar registros de otros vendedores."
      />
    );

    expect(markup).toContain("Solo registros propios");
    expect(markup).toContain("limitada por el servidor");
    expect(markup).not.toContain("Supervisión administrativa");
    expect(markup).not.toContain("otros vendedores");
  });

  it("shows administrative supervision only for an administrative role decision", () => {
    const markup = renderToStaticMarkup(
      <OperationalScopeNotice
        canSupervise
        ownRecordsDescription="Solo registros propios."
        supervisionDescription="Puedes consultar registros ajenos en las superficies de supervisión declaradas."
      />
    );

    expect(markup).toContain("Supervisión administrativa");
    expect(markup).toContain("registros ajenos");
    expect(markup).not.toContain(">Solo registros propios<");
  });

  it("hides supervision filters and actions from the seller experience", () => {
    const hiddenMarkup = renderToStaticMarkup(
      <SupervisionOnly allowed={false}>
        <button type="button">Cerrar caja ajena</button>
      </SupervisionOnly>
    );
    const visibleMarkup = renderToStaticMarkup(
      <SupervisionOnly allowed>
        <button type="button">Cerrar caja ajena</button>
      </SupervisionOnly>
    );

    expect(hiddenMarkup).toBe("");
    expect(visibleMarkup).toContain("Cerrar caja ajena");
    expect(getSupervisedSellerFilter(false, "seller-2")).toBe("");
    expect(getSupervisedSellerFilter(true, "seller-2")).toBe("seller-2");
  });

  it("enables cancellation only when the effective response explicitly allows it", () => {
    expect(isSaleCancellationAllowed(buildSale({ canCancel: true }))).toBe(true);
    expect(isSaleCancellationAllowed(buildSale({ canCancel: false }))).toBe(false);
  });

  it.each([
    ["cash-session-closed", "caja asociada está cerrada"],
    ["forbidden", "pertenece a otro usuario"],
    ["not-current-day", "día operativo actual"],
    ["already-cancelled", "ya fue anulada"],
    ["unknown", "estado actual"]
  ] as const)("explains the %s block reason in Spanish", (reason, expectedText) => {
    expect(getSaleCancellationBlockMessage(buildSale({ canCancel: false, cancellationBlockedReason: reason }))).toContain(expectedText);
  });
});

function buildSale(overrides: Partial<CancelableSale>): CancelableSale {
  return {
    canCancel: false,
    cashSessionCorrelativeCode: "CAJ-001",
    cashSessionId: "cash-1",
    confirmedAt: "2026-07-18T12:00:00.000Z",
    correlativeCode: "VEN-001",
    createdAt: "2026-07-18T12:00:00.000Z",
    id: "sale-1",
    items: [],
    payment: {
      cashSessionId: "cash-1",
      changeAmount: 0,
      createdAt: "2026-07-18T12:00:00.000Z",
      id: "payment-1",
      method: "cash",
      paidAt: "2026-07-18T12:00:00.000Z",
      receivedAmount: 10,
      saleId: "sale-1",
      saleTotal: 10,
      status: "paid",
      updatedAt: "2026-07-18T12:00:00.000Z"
    },
    receipt: {
      cashSessionCorrelativeCode: "CAJ-001",
      changeAmount: 0,
      items: [],
      issuedAt: "2026-07-18T12:00:00.000Z",
      receivedAmount: 10,
      saleCorrelativeCode: "VEN-001",
      saleId: "sale-1",
      sellerName: "Vendedor Uno",
      totalAmount: 10
    },
    sellerUser: { email: "seller@example.com", fullName: "Vendedor Uno", id: "seller-1" },
    sellerUserId: "seller-1",
    status: "confirmed",
    totalAmount: 10,
    totalCost: 8,
    totalMargin: 2,
    updatedAt: "2026-07-18T12:00:00.000Z",
    ...overrides
  };
}
