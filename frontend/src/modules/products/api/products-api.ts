import {
  CreateProductCategorySchema,
  CreateProductSchema,
  ProductCategorySchema,
  ProductSchema,
  UpdateProductSchema,
  UpdateProductUnitsSchema,
  type CreateProduct,
  type CreateProductCategory,
  type Product,
  type ProductCategory,
  type UpdateProduct,
  type UpdateProductUnits
} from "@pharmacy-pos/shared";
import { apiRequest } from "@/api/client";

export async function listProductCategories(token: string, signal?: AbortSignal): Promise<ProductCategory[]> {
  const payload = await apiRequest<ProductCategory[]>("/product-categories", {
    token,
    signal
  });

  return ProductCategorySchema.array().parse(payload);
}

export async function createProductCategory(token: string, input: CreateProductCategory): Promise<ProductCategory> {
  const payload = await apiRequest<ProductCategory>("/product-categories", {
    method: "POST",
    token,
    body: CreateProductCategorySchema.parse(input)
  });

  return ProductCategorySchema.parse(payload);
}

export async function listProducts(token: string, search?: string, signal?: AbortSignal): Promise<Product[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const payload = await apiRequest<Product[]>(`/products${params}`, {
    token,
    signal
  });

  return ProductSchema.array().parse(payload);
}

export async function createProduct(token: string, input: CreateProduct): Promise<Product> {
  const payload = await apiRequest<Product>("/products", {
    method: "POST",
    token,
    body: CreateProductSchema.parse(input)
  });

  return ProductSchema.parse(payload);
}

export async function updateProduct(token: string, productId: string, input: UpdateProduct): Promise<Product> {
  const payload = await apiRequest<Product>(`/products/${productId}`, {
    method: "PATCH",
    token,
    body: UpdateProductSchema.parse(input)
  });

  return ProductSchema.parse(payload);
}

export async function updateProductUnits(token: string, productId: string, input: UpdateProductUnits): Promise<Product> {
  const payload = await apiRequest<Product>(`/products/${productId}/units`, {
    method: "PUT",
    token,
    body: UpdateProductUnitsSchema.parse(input)
  });

  return ProductSchema.parse(payload);
}
