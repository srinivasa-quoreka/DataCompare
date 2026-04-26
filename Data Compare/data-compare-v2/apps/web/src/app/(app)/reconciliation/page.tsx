"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface ReconJob {
  id: string;
  name: string;
  mode: "row_compare" | "group_sum";
  status: string;
  createdAt: string;
}

export default function ReconciliationPage() {
  const { data } = useQuery({ queryKey: ["recon"], queryFn: () => api<ReconJob[]>("/reconciliation") });
  return (
    <div className="p-6">
      <h1 className="text-xl font-extrabold mb-4">Reconciliation</h1>
      <p className="text-sm text-slate-500 mb-4">
        Excel-to-Excel comparison. Upload a Before file, an After file, configure the match key and column mappings,
        then run.
      </p>
      <table className="w-full text-sm border border-slate-200 rounded-md overflow-hidden">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Mode</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((j) => (
            <tr key={j.id} className="border-t border-slate-200">
              <td className="px-3 py-2 font-medium">{j.name}</td>
              <td className="px-3 py-2">{j.mode}</td>
              <td className="px-3 py-2">{j.status}</td>
              <td className="px-3 py-2 text-slate-500">{new Date(j.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
