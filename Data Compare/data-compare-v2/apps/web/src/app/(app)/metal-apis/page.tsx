"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Story } from "@data-compare/shared";
import Link from "next/link";
import type { Route } from "next";

export default function MetalApisPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => api<Story[]>("/stories"),
  });

  const run = useMutation({
    mutationFn: (id: string) => api(`/stories/${id}/run`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stories"] }),
  });

  return (
    <div className="p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Metal APIs</h1>
          <p className="text-sm text-slate-500">5-step API validation stories.</p>
        </div>
        <Link href={"/metal-apis/new" as Route} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">
          + New story
        </Link>
      </header>

      {isLoading && <div className="text-slate-500">Loading…</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data ?? []).map((s) => (
          <article key={s.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-1 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {s.key}
            </div>
            <h2 className="font-bold">{s.title}</h2>
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{s.description}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => run.mutate(s.id)}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
              >
                Run
              </button>
              <Link
                href={`/metal-apis/${s.id}` as Route}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
              >
                Open
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
