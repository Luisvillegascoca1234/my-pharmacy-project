import type { CreateProduct } from "@pharmacy-pos/shared";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export function createEmptyProductForm(overrides: Partial<CreateProduct> = {}): CreateProduct {
  return {
    barcode: undefined,
    commercialName: "",
    genericName: undefined,
    description: undefined,
    type: "medicine",
    categoryId: "",
    baseUnitId: "",
    supplierId: "",
    laboratoryName: undefined,
    sanitaryRegistration: undefined,
    isMedicine: true,
    isOverTheCounter: false,
    requiresPrescription: false,
    isInventoryTracked: true,
    requiresBatch: true,
    requiresExpiration: true,
    minimumStock: 0,
    salePrice: 0,
    ...overrides
  };
}

export type ProductFormUiState = {
  newProductForm: CreateProduct;
};

export type ProductFormUiActions = {
  patchNewProductForm: (patch: Partial<CreateProduct>) => void;
  resetNewProductForm: (defaults?: Partial<CreateProduct>) => void;
  setNewProductField: <Field extends keyof CreateProduct>(field: Field, value: CreateProduct[Field]) => void;
  setNewProductForm: (form: CreateProduct) => void;
};

export type ProductFormUiStore = ProductFormUiState & ProductFormUiActions;

export const initialProductFormUiState: ProductFormUiState = {
  newProductForm: createEmptyProductForm()
};

export const useProductFormUiStore = create<ProductFormUiStore>()(
  devtools(
    (set) => ({
      ...initialProductFormUiState,

      patchNewProductForm(patch) {
        set(
          (state) => ({
            newProductForm: {
              ...state.newProductForm,
              ...patch
            }
          }),
          false,
          "patchNewProductForm"
        );
      },

      resetNewProductForm(defaults) {
        set({ newProductForm: createEmptyProductForm(defaults) }, false, "resetNewProductForm");
      },

      setNewProductField(field, value) {
        set(
          (state) => ({
            newProductForm: {
              ...state.newProductForm,
              [field]: value
            }
          }),
          false,
          "setNewProductField"
        );
      },

      setNewProductForm(form) {
        set({ newProductForm: form }, false, "setNewProductForm");
      }
    }),
    { name: "ProductFormUiStore" }
  )
);

export const selectProductFormUiState = (state: ProductFormUiStore) => ({
  newProductForm: state.newProductForm
});

export const selectProductFormUiActions = (state: ProductFormUiStore) => ({
  patchNewProductForm: state.patchNewProductForm,
  resetNewProductForm: state.resetNewProductForm,
  setNewProductField: state.setNewProductField,
  setNewProductForm: state.setNewProductForm
});
