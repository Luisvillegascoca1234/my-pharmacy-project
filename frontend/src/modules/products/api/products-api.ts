import {
  type CreateProduct,
  type CreateProductCategory,
  type Product,
  type ProductCategory,
  type UpdateProduct,
  type UpdateProductUnits
} from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const productsApi = {
  async listProductCategories(signal?: AbortSignal): Promise<ProductCategory[]> {
    const response = await axiosApi.get<ProductCategory[]>("/product-categories", {
      signal
    });

    return response.data;
  },

  async createProductCategory(input: CreateProductCategory): Promise<ProductCategory> {
    const response = await axiosApi.post<ProductCategory>("/product-categories", input);

    return response.data;
  },

  async listProducts(search?: string, signal?: AbortSignal): Promise<Product[]> {
    const response = await axiosApi.get<Product[]>("/products", {
      params: search ? { search } : undefined,
      signal
    });

    return response.data;
  },

  async createProduct(input: CreateProduct): Promise<Product> {
    const response = await axiosApi.post<Product>("/products", input);

    return response.data;
  },

  async updateProduct(productId: string, input: UpdateProduct): Promise<Product> {
    const response = await axiosApi.patch<Product>(`/products/${productId}`, input);

    return response.data;
  },

  async updateProductUnits(productId: string, input: UpdateProductUnits): Promise<Product> {
    const response = await axiosApi.put<Product>(`/products/${productId}/units`, input);

    return response.data;
  }
};
