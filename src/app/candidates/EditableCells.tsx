"use client";

import { useEffect, useState } from "react";

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
