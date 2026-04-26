"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";

interface UserRow { id: string; username: string; role: string; isActive: boolean; lastLoginAt: string | null }

export default function AdminPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<UserRow[]>("/users"),
    enabled: user?.role === "admin" || user?.role === "superadmin",
  });

  if (user?.role !== "admin" && user?.role !== "superadmin") {
    return <div className="p-6 text-slate-500">Admin access required.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-extrabold mb-4">User management</h1>
      <table className="w-full text-sm border border-slate-200 rounded-md overflow-hidden">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-3 py-2">Username</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Active</th>
            <th className="px-3 py-2">Last login</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((u) => (
            <tr key={u.id} className="border-t border-slate-200">
              <td className="px-3 py-2 font-medium">{u.username}</td>
              <td className="px-3 py-2">{u.role}</td>
              <td className="px-3 py-2">{u.isActive ? "Yes" : "No"}</td>
              <td className="px-3 py-2 text-slate-500">
                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
