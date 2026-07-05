import { api } from "./api";

export type UserRole = "USER" | "ADMIN";

export interface User {
  id?: number;
  name: string;
  drt: string;
  role: UserRole;
}

export const userService = {
  list(): Promise<User[]> {
    return api<User[] | { content: User[] }>("/admin").then((res) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (Array.isArray((res as { content: User[] }).content)) {
        return (res as { content: User[] }).content;
      }
      return [];
    });
  },
  create(u: { drt: string; name: string; password: string }): Promise<User> {
    return api<User>("/admin", {
      method: "POST",
      body: JSON.stringify(u),
    });
  },
  update(id: number, u: { name: string; drt: string; role: UserRole }): Promise<User> {
    return api<User>(`/admin/${id}`, {
      method: "PUT",
      body: JSON.stringify(u),
    });
  },
  remove(id: number): Promise<void> {
    return api<void>(`/admin/${id}`, { method: "DELETE" });
  },
};
