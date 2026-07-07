export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "https://sloteasy-api.onrender.com";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = options;
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers: h });
  } catch {
    throw new Error(`Não foi possível conectar à API (${API_BASE_URL}).`);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      (typeof data === "string" ? data : null) ||
      `Erro ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

function safeJson(t: string): any {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
