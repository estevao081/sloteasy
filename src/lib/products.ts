import { api } from "./api";

export interface Product {
  id?: number;
  code: string;
  name: string;
}

export const productService = {
  list(): Promise<Product[]> {
    return api<Product[]>("/products");
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
