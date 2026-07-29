"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";

type Status = "PENDING" | "SELECTED" | "REJECTED" | "WAITLIST";

interface Candidate {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  skillCategory: string | null;
  status: Status;
  statusReason: string | null;
  fileName: string;
  createdAt: string;
  reviewedBy: { name: string } | null;
}

const STATUS_OPTIONS: Status[] = ["PENDING", "SELECTED", "REJECTED", "WAITLIST"];

const STATUS_STYLES: Record<Status, string> = {
  PENDING: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
  SELECTED: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100",
  REJECTED: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
  WAITLIST: "bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100",
};

export function CandidatesClient() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [pendingReason, setPendingReason] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/candidates");
    if (res.ok) {
      const data = await res.json();
      setCandidates(data.candidates);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const categories = useMemo(() => {
    const set = new Set(candidates.map((c) => c.skillCategory).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [candidates]);

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && c.skillCategory !== categoryFilter) return false;
      return true;
    });
  }, [candidates, statusFilter, categoryFilter]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    const res = await fetch("/api/candidates", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setUploadError(data.error ?? "Upload failed");
    } else if (data.skipped?.length) {
      setUploadError(
        `Skipped: ${data.skipped.map((s: { fileName: string; reason: string }) => `${s.fileName} (${s.reason})`).join(", ")}`,
      );
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await loadCandidates();
  }

  async function updateStatus(id: string, status: Status, statusReason: string) {
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, statusReason }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Failed to update status");
      return;
    }

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: data.candidate.status, statusReason: data.candidate.statusReason, reviewedBy: data.candidate.reviewedBy }
          : c,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Candidates</h1>

        <div className="flex items-center gap-3">
          <label className="rounded bg-foreground text-background px-4 py-2 text-sm font-medium cursor-pointer">
            {uploading ? "Uploading…" : "Upload resumes"}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>

          <a
            href="/api/candidates/export"
            className="rounded border border-black/15 dark:border-white/20 px-4 py-2 text-sm font-medium"
          >
            Download Excel
          </a>
        </div>
      </div>

      {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "ALL")}
          className="rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="ALL">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm opacity-70">No candidates yet. Upload a resume to get started.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-black/10 dark:border-white/15">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Reviewed by</th>
                <th className="p-3">Resume</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const reasonRequired = c.status === "REJECTED" || c.status === "WAITLIST";
                const reasonValue = pendingReason[c.id] ?? c.statusReason ?? "";

                return (
                  <tr key={c.id} className="border-t border-black/10 dark:border-white/10 align-top">
                    <td className="p-3">{c.name ?? "—"}</td>
                    <td className="p-3">{c.email ?? "—"}</td>
                    <td className="p-3">{c.phone ?? "—"}</td>
                    <td className="p-3">{c.skillCategory ?? "—"}</td>
                    <td className="p-3">
                      <select
                        value={c.status}
                        onChange={(e) => {
                          const nextStatus = e.target.value as Status;
                          const reason = pendingReason[c.id] ?? c.statusReason ?? "";
                          if (
                            (nextStatus === "REJECTED" || nextStatus === "WAITLIST") &&
                            !reason.trim()
                          ) {
                            setCandidates((prev) =>
                              prev.map((x) => (x.id === c.id ? { ...x, status: nextStatus } : x)),
                            );
                            return;
                          }
                          updateStatus(c.id, nextStatus, reason);
                        }}
                        className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[c.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 min-w-[220px]">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={reasonRequired ? "Reason (required)" : "Reason (optional)"}
                          value={reasonValue}
                          onChange={(e) =>
                            setPendingReason((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          className="w-full rounded border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => updateStatus(c.id, c.status, reasonValue)}
                          className="rounded border border-black/15 dark:border-white/20 px-2 py-1 text-xs"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td className="p-3">{c.reviewedBy?.name ?? "—"}</td>
                    <td className="p-3">{c.fileName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
