import { api } from "./api";

export type UserRole = "USER" | "ADMIN";

export interface User {
  id?: number;
  name: string;
  drt: string;
  role: UserRole;
}

/**
 * Serviço de cadastro público (rota /cadastro). Diferente do userService,
 * que é usado pela área administrativa (/admin/users) e exige autenticação,
 * este endpoint é público e é usado por qualquer pessoa para criar sua
 * própria conta. A role nunca é escolhida pelo usuário: é sempre "USER".
 */
export const registrationService = {
  register(u: { name: string; drt: string; password: string }): Promise<User> {
    return api<User>("/auth/cadastro", {
      method: "POST",
      body: JSON.stringify({ ...u, role: "USER" as UserRole }),
    });
  },
};

export const userService = {
  list(): Promise<User[]> {
    return api<User[] | { content: User[] }>("/admin/users").then((res) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (Array.isArray((res as { content: User[] }).content)) {
        return (res as { content: User[] }).content;
      }
      return [];
    });
  },
  create(u: { name: string; drt: string; password: string; role: UserRole }): Promise<User> {
    return api<User>("/admin/users", {
      method: "POST",
      body: JSON.stringify(u),
    });
  },
  update(id: number, u: { name: string; drt: string; role: UserRole }): Promise<User> {
    return api<User>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(u),
    });
  },
  remove(id: number): Promise<void> {
    return api<void>(`/admin/users/${id}`, { method: "DELETE" });
  },
};
