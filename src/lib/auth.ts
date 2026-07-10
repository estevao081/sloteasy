import { api } from "./api";

const TOKEN_KEY = "sloteasy_token";
const USER_KEY = "sloteasy_user";

export interface CurrentUser {
  name?: string;
  drt?: string;
  role?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(pad);
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function extractUser(token: string): CurrentUser {
  const p = (decodeJwt(token) ?? {}) as Record<string, unknown>;
  const asStr = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    name: asStr(p.name) ?? asStr(p.fullName),
    drt: asStr(p.drt) ?? asStr(p.sub) ?? asStr(p.username),
    role: asStr(p.role) ?? asStr(p.authority),
  };
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      /* ignore */
    }
  }
  const t = getToken();
  if (!t) return null;
  const u = extractUser(t);
  window.localStorage.setItem(USER_KEY, JSON.stringify(u));
  return u;
}

interface LoginResponse {
  token: string;
  name?: string;
  drt?: string;
  role?: string;
  user?: CurrentUser;
}

export const authService = {
  async login(drt: string, password: string): Promise<void> {
    const res = await api<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ drt, password }),
    });
    setToken(res.token);
    const fromToken = extractUser(res.token);
    const user: CurrentUser = {
      name: res.user?.name ?? res.name ?? fromToken.name,
      drt: res.user?.drt ?? res.drt ?? fromToken.drt ?? drt,
      role: res.user?.role ?? res.role ?? fromToken.role,
    };
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout(): void {
    clearToken();
  },

  isAuthenticated,
  getCurrentUser,
};
