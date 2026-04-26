"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";
import { LogOut, Workflow, ArrowLeftRight, FileCode2, Settings } from "lucide-react";
import { clsx } from "clsx";

const NAV = [
  { href: "/metal-apis", label: "Metal APIs", icon: Workflow },
  { href: "/reconciliation", label: "Reconciliation", icon: ArrowLeftRight },
  { href: "/xml-diff", label: "XML Diff", icon: FileCode2 },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["admin", "superadmin"] as const },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="text-sm font-extrabold tracking-tight">Data Compare</div>
          <div className="text-xs text-slate-500">Validation suite</div>
        </div>
        <nav className="flex-1 p-2">
          {NAV.filter((n) => !("roles" in n) || n.roles!.includes(user.role as typeof n.roles[number])).map((n) => {
            const Icon = n.icon;
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <Icon size={16} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>{user.username} <span className="text-slate-400">({user.role})</span></span>
          <button onClick={logout} className="text-slate-500 hover:text-slate-900" aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
