"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function EditableTextCell({
  value,
  onSave,
  placeholder,
}: {
  value: string | null;
  onSave: (value: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => setDraft(value ?? ""), [value]);

  return (
    <input
      type="text"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== (value ?? "")) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="w-full min-w-[110px] rounded border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-xs"
    />
  );
}

export function WorkLinksCell({
  links,
  onAdd,
  onRemove,
}: {
  links: string[];
  onAdd: (link: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-col gap-1 min-w-[180px]">
      {links.map((link, i) => (
        <div key={`${link}-${i}`} className="flex items-center gap-1">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate underline text-xs max-w-[150px]"
            title={link}
          >
            {link}
          </a>
          <button
            onClick={() => onRemove(i)}
            className="text-xs opacity-60 hover:opacity-100"
            aria-label="Remove link"
          >
            ×
          </button>
        </div>
      ))}
      <input
        type="text"
        placeholder="+ add link"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            onAdd(draft.trim());
            setDraft("");
          }
        }}
        className="w-full rounded border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-xs"
      />
    </div>
  );
}

interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
}

export function AttachmentsCell({ candidateId }: { candidateId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/candidates/${candidateId}/attachments`);
    if (res.ok) {
      const data = await res.json();
      setAttachments(data.attachments);
    }
    setLoading(false);
  }, [candidateId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    const res = await fetch(`/api/candidates/${candidateId}/attachments`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
    } else if (data.skipped?.length) {
      setError(
        `Skipped: ${data.skipped.map((s: { fileName: string; reason: string }) => `${s.fileName} (${s.reason})`).join(", ")}`,
      );
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this file?")) return;
    const res = await fetch(`/api/candidates/${candidateId}/attachments/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-1 min-w-[180px]">
      {loading ? (
        <span className="text-xs opacity-60">Loading…</span>
      ) : attachments.length === 0 ? (
        <span className="text-xs opacity-60">No additional files</span>
      ) : (
        attachments.map((a) => (
          <div key={a.id} className="flex items-center gap-1">
            <a
              href={`/api/candidates/${candidateId}/attachments/${a.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate underline text-xs max-w-[150px]"
              title={a.fileName}
            >
              {a.fileName}
            </a>
            <button
              onClick={() => handleDelete(a.id)}
              className="text-xs opacity-60 hover:opacity-100"
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
        ))
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
      <label className="text-xs underline cursor-pointer opacity-80 hover:opacity-100 w-fit">
        {uploading ? "Uploading…" : "+ add file"}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

export function RemarksCell({
  remarks,
  onAdd,
}: {
  remarks: { id: string; text: string }[];
  onAdd: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-col gap-1 min-w-[220px]">
      <div className="flex flex-wrap gap-1">
        {remarks.map((r) => (
          <span
            key={r.id}
            className="rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[11px]"
          >
            {r.text}
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Add remark…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            onAdd(draft.trim());
            setDraft("");
          }
        }}
        className="w-full rounded border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-xs"
      />
    </div>
  );
}
