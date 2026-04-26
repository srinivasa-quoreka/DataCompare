"use client";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await login(username, password); }
    catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-extrabold">Data Compare</h1>
        <p className="mb-4 text-sm text-slate-500">Sign in to continue.</p>
        <label className="block text-xs font-semibold text-slate-700">Username</label>
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="block text-xs font-semibold text-slate-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
