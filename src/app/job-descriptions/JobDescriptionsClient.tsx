"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { JobDescriptionModal, JobDescription } from "./JobDescriptionModal";

export function JobDescriptionsClient() {
  const { data: session } = useSession();
  const [items, setItems] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/job-descriptions");
    if (res.ok) {
      const data = await res.json();
      setItems(data.jobDescriptions);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  async function createJobDescription(title: string, content: string): Promise<boolean> {
    const res = await fetch("/api/job-descriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Failed to create job description");
      return false;
    }

    setItems((prev) => [data.jobDescription, ...prev]);
    return true;
  }

  async function updateJobDescription(id: string, title: string, content: string): Promise<boolean> {
    const res = await fetch(`/api/job-descriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Failed to update job description");
      return false;
    }

    setItems((prev) => prev.map((i) => (i.id === id ? data.jobDescription : i)));
    return true;
  }

  async function deleteJobDescription(id: string) {
    const res = await fetch(`/api/job-descriptions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete job description");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Job Descriptions</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded bg-foreground text-background px-4 py-2 text-sm font-medium"
        >
          Create JD
        </button>
      </div>

      {loading ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm opacity-70">No job descriptions yet. Create one to get started.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((jd) => (
            <button
              key={jd.id}
              onClick={() => setSelectedId(jd.id)}
              className="text-left rounded-lg border border-black/10 dark:border-white/15 p-4 hover:border-black/25 dark:hover:border-white/30"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{jd.title}</h3>
                {jd.createdBy.id === session?.user?.id && (
                  <span className="shrink-0 rounded bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[11px]">
                    Yours
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm opacity-70">
                {jd.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
              </p>
              <p className="mt-2 text-xs opacity-50">
                By {jd.createdBy.name} · {new Date(jd.updatedAt).toLocaleDateString("en-GB")}
              </p>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <JobDescriptionModal
          jobDescription={null}
          isOwner={true}
          onClose={() => setCreating(false)}
          onSave={createJobDescription}
        />
      )}

      {selected && (
        <JobDescriptionModal
          jobDescription={selected}
          isOwner={selected.createdBy.id === session?.user?.id}
          onClose={() => setSelectedId(null)}
          onSave={(title, content) => updateJobDescription(selected.id, title, content)}
          onDelete={() => deleteJobDescription(selected.id)}
        />
      )}
    </div>
  );
}
