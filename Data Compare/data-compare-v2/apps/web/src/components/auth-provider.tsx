"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, getToken, setToken } from "@/lib/api-client";

interface SessionUser { id: string; username: string; role: "superadmin" | "admin" | "user"; email: string | null }
interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api<SessionUser>("/auth/me", { method: "POST" })
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") router.replace("/login");
    if (user && pathname === "/login") router.replace("/metal-apis");
  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string) => {
    const { accessToken, user } = await api<{ accessToken: string; user: SessionUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(accessToken);
    setUser(user);
    router.replace("/metal-apis");
  };
  const logout = () => { setToken(null); setUser(null); router.replace("/login"); };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
