/**
 * Thin fetch wrapper that adds the JWT bearer token from localStorage.
 * The token is set by AuthProvider on login.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const TOKEN_KEY = "dc.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const t = getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  const res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  if (!res.ok) {
    let msg: string;
    try { msg = (await res.json()).message ?? res.statusText; } catch { msg = res.statusText; }
    throw new Error(`${res.status} ${msg}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
