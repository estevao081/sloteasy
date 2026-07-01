import { api } from "./api";

export interface Product {
  id?: number;
  code: string;
  name: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const productService = {
  list(page: number = 0, size: number = 15): Promise<PageResponse<Product>> {
    return api<PageResponse<Product>>(`/products?page=${page}&item=${size}`);
  },
  getByCode(code: string): Promise<Product | null> {
    return api<Product>(`/products/code/${encodeURIComponent(code)}`).catch(() => null);
  },
  create(p: { code: string; name: string }): Promise<Product> {
    return api<Product>("/products", {
      method: "POST",
      body: JSON.stringify(p),
    });
  },
  update(id: number, p: { code: string; name: string }): Promise<Product> {
    return api<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(p),
    });
  },
  remove(id: number): Promise<void> {
    return api<void>(`/products/${id}`, { method: "DELETE" });
  },
};
