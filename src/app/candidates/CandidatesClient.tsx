"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { CandidateModal } from "./CandidateModal";
import {
  Candidate,
  Status,
  TextField,
  ADD_NEW_CATEGORY,
  ADD_NEW_STATUS,
  BUILT_IN_STATUSES,
  statusLabel,
  statusStyle,
} from "./types";

export function CandidatesClient() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [uploadedByFilter, setUploadedByFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>(BUILT_IN_STATUSES);
  const [hrUsers, setHrUsers] = useState<{ id: string; name: string }[]>([]);
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

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/skill-categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
    }
  }, []);

  const loadStatuses = useCallback(async () => {
    const res = await fetch("/api/candidate-statuses");
    if (res.ok) {
      const data = await res.json();
      setStatuses(data.statuses);
    }
  }, []);

  const loadHrUsers = useCallback(async () => {
    const res = await fetch("/api/hr-users");
    if (res.ok) {
      const data = await res.json();
      setHrUsers(data.hrUsers);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
    loadCategories();
    loadStatuses();
    loadHrUsers();
  }, [loadCandidates, loadCategories, loadStatuses, loadHrUsers]);

  function localDateStr(iso: string): string {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = dateFrom || dateTo || null;
    const to = dateTo || dateFrom || null;

    return candidates.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && c.skillCategory !== categoryFilter) return false;
      if (uploadedByFilter !== "ALL" && c.uploadedBy?.id !== uploadedByFilter) return false;
      if (from && to) {
        const updated = localDateStr(c.updatedAt);
        if (updated < from || updated > to) return false;
      }
      if (query) {
        const haystack = `${c.name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [candidates, statusFilter, categoryFilter, uploadedByFilter, dateFrom, dateTo, search]);

  const selectedCandidate = candidates.find((c) => c.id === selectedId) ?? null;

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

  async function updateStatus(id: string, rawStatus: Status, statusReason: string) {
    let status = rawStatus;

    if (rawStatus === ADD_NEW_STATUS) {
      const input = window.prompt("New status name:");
      if (!input?.trim()) return;
      status = input.trim();
    }

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

    const savedStatus: string = data.candidate.status;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: savedStatus,
              statusReason: data.candidate.statusReason,
              reviewedBy: data.candidate.reviewedBy,
              updatedAt: data.candidate.updatedAt,
            }
          : c,
      ),
    );
    setStatuses((prev) =>
      prev.some((s) => s.toLowerCase() === savedStatus.toLowerCase()) ? prev : [...prev, savedStatus],
    );
  }

  async function updateCategory(id: string, rawCategory: string) {
    let category = rawCategory;

    if (rawCategory === ADD_NEW_CATEGORY) {
      const input = window.prompt("New category name:");
      if (!input?.trim()) return;
      category = input.trim();
    }

    const res = await fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillCategory: category }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Failed to update category");
      return;
    }

    const savedCategory: string = data.candidate.skillCategory;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, skillCategory: savedCategory, updatedAt: data.candidate.updatedAt } : c,
      ),
    );
    setCategories((prev) =>
      prev.some((c) => c.toLowerCase() === savedCategory.toLowerCase())
        ? prev
        : [...prev, savedCategory].sort((a, b) => a.localeCompare(b)),
    );
  }

  async function updateTextField(id: string, field: TextField, value: string) {
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Failed to update");
      return;
    }

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, [field]: data.candidate[field], updatedAt: data.candidate.updatedAt } : c,
      ),
    );
  }

  async function updateWorkLinks(id: string, links: string[]) {
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workLinks: links }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Failed to update links");
      return;
    }

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, workLinks: data.candidate.workLinks, updatedAt: data.candidate.updatedAt }
          : c,
      ),
    );
  }

  async function addRemark(id: string, text: string) {
    const res = await fetch(`/api/candidates/${id}/remarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Failed to add remark");
      return;
    }

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, remarks: [data.remark, ...c.remarks], updatedAt: data.updatedAt }
          : c,
      ),
    );
  }

  function handleJdSent(id: string, remark: { id: string; text: string }) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, remarks: [remark, ...c.remarks] } : c)),
    );
    loadCandidates();
  }

  async function deleteCandidate(id: string, name: string | null): Promise<boolean> {
    if (!confirm(`Delete ${name ?? "this candidate"}? This can't be undone.`)) return false;

    const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete candidate");
      return false;
    }

    setCandidates((prev) => prev.filter((c) => c.id !== id));
    return true;
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

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[240px] flex-1 rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-1.5 text-sm"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="ALL">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
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

        <select
          value={uploadedByFilter}
          onChange={(e) => setUploadedByFilter(e.target.value)}
          className="rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="ALL">Uploaded by: anyone</option>
          {hrUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 text-sm">
          <span className="opacity-70">Changed</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
          />
          <span className="opacity-70">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="text-xs opacity-60 hover:opacity-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm opacity-70">No candidates yet. Upload a resume to get started.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 rounded-lg border border-black/10 dark:border-white/15 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium truncate">{c.name ?? "Unnamed candidate"}</h3>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${statusStyle(c.status)}`}
                >
                  {statusLabel(c.status)}
                </span>
              </div>

              <p className="text-sm truncate">{c.email ?? "—"}</p>
              <p className="text-sm">{c.phone ?? "—"}</p>
              <p className="text-sm opacity-70">{c.skillCategory ?? "Uncategorized"}</p>
              {c.uploadedBy && (
                <p className="text-xs opacity-50">Uploaded by {c.uploadedBy.name}</p>
              )}
              <p className="text-xs opacity-50">
                Last changed {new Date(c.updatedAt).toLocaleDateString("en-GB")}
              </p>

              <button
                onClick={() => setSelectedId(c.id)}
                className="mt-2 rounded bg-foreground text-background px-3 py-1.5 text-sm font-medium"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          categories={categories}
          statuses={statuses}
          onClose={() => setSelectedId(null)}
          onUpdateStatus={updateStatus}
          onUpdateCategory={updateCategory}
          onUpdateTextField={updateTextField}
          onUpdateWorkLinks={updateWorkLinks}
          onAddRemark={addRemark}
          onJdSent={handleJdSent}
          onDelete={deleteCandidate}
        />
      )}
    </div>
  );
}
