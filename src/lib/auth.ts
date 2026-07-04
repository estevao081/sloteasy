import { api, getToken, setToken } from "./api";

function isJwtExpired(token: string): boolean {
  try {
    const part = token.split(".")[1];
    if (!part) return false;
    const payload = JSON.parse(
      atob(part.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (typeof payload.exp !== "number") return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

export interface SessionUser {
  email: string;
  name?: string;
}

const SESSION_KEY = "slotes:session";

function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function writeSession(s: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

interface LoginResponse {
  token: string;
}

export const authService = {
  getSession(): SessionUser | null {
    return readSession();
  },
  isAuthenticated(): boolean {
    const token = getToken();
    if (!token) return false;
    if (isJwtExpired(token)) {
      setToken(null);
      writeSession(null);
      return false;
    }
    return true;
  },
  async login(email: string, password: string): Promise<SessionUser> {
    const res = await api<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    const session: SessionUser = { email };
    writeSession(session);
    return session;
  },
  async register(name: string, email: string, password: string): Promise<SessionUser> {
    const res = await api<LoginResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ name, email, password }),
    });
    setToken(res.token);
    const session: SessionUser = { email, name };
    writeSession(session);
    return session;
  },
  logout() {
    setToken(null);
    writeSession(null);
  },
};
