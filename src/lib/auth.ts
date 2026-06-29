export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

const USERS_KEY = "slotes:users";
const SESSION_KEY = "slotes:session";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const authService = {
  getUsers(): User[] {
    return read<User[]>(USERS_KEY, []);
  },
  getSession(): Omit<User, "password"> | null {
    return read<Omit<User, "password"> | null>(SESSION_KEY, null);
  },
  isAuthenticated(): boolean {
    return this.getSession() !== null;
  },
  login(email: string, password: string): Omit<User, "password"> {
    const users = this.getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!found) throw new Error("E-mail ou senha inválidos");
    const session = { id: found.id, name: found.name, email: found.email };
    write(SESSION_KEY, session);
    return session;
  },
  register(name: string, email: string, password: string): Omit<User, "password"> {
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("E-mail já cadastrado");
    }
    const user: User = { id: Date.now(), name, email, password };
    users.push(user);
    write(USERS_KEY, users);
    const session = { id: user.id, name: user.name, email: user.email };
    write(SESSION_KEY, session);
    return session;
  },
  logout() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SESSION_KEY);
  },
};
