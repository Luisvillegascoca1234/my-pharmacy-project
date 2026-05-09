import type {
  CreateProduct,
  CreateProductCategory,
  Product,
  ProductCategory,
  UpdateProduct,
  UpdateProductUnits
} from "@pharmacy-pos/shared";
import { productsApi } from "../api/products-api";

export const productsFacade = {
  create(input: CreateProduct): Promise<Product> {
    return productsApi.createProduct(input);
  },

  createCategory(input: CreateProductCategory): Promise<ProductCategory> {
    return productsApi.createProductCategory(input);
  },

  getAll(search?: string, signal?: AbortSignal): Promise<Product[]> {
    return productsApi.listProducts(search, signal);
  },

  getCategories(signal?: AbortSignal): Promise<ProductCategory[]> {
    return productsApi.listProductCategories(signal);
  },

  update(productId: string, input: UpdateProduct): Promise<Product> {
    return productsApi.updateProduct(productId, input);
  },

  updateUnits(productId: string, input: UpdateProductUnits): Promise<Product> {
    return productsApi.updateProductUnits(productId, input);
  }
};
