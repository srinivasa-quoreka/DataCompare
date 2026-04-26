"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface XmlDiffJob { id: string; name: string; status: string; createdAt: string }

export default function XmlDiffPage() {
  const { data } = useQuery({ queryKey: ["xml-diff"], queryFn: () => api<XmlDiffJob[]>("/xml-diff") });
  return (
    <div className="p-6">
      <h1 className="text-xl font-extrabold mb-4">XML Diff</h1>
      <p className="text-sm text-slate-500 mb-4">Before/After XML comparison.</p>
      <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
        {(data ?? []).map((j) => (
          <li key={j.id} className="px-3 py-2 text-sm flex justify-between">
            <span className="font-medium">{j.name}</span>
            <span className="text-slate-500">{j.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
