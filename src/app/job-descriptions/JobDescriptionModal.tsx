"use client";

import { useState } from "react";

export interface JobDescription {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
}

interface JobDescriptionModalProps {
  jobDescription: JobDescription | null;
  isOwner: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<boolean>;
  onDelete?: () => Promise<void>;
}

export function JobDescriptionModal({
  jobDescription,
  isOwner,
  onClose,
  onSave,
  onDelete,
}: JobDescriptionModalProps) {
  const isCreate = !jobDescription;
  const editable = isCreate || isOwner;

  const [title, setTitle] = useState(jobDescription?.title ?? "");
  const [content, setContent] = useState(jobDescription?.content ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(title, content);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-lg bg-white dark:bg-zinc-900 shadow-xl"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/15 px-4 py-3">
          <h2 className="text-lg font-semibold">
            {isCreate ? "Create Job Description" : editable ? "Edit Job Description" : "Job Description"}
          </h2>
          <button
            onClick={onClose}
            className="rounded border border-black/15 dark:border-white/20 px-3 py-1 text-xs"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {editable ? (
            <input
              type="text"
              placeholder="Job title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm font-medium"
            />
          ) : (
            <h3 className="font-medium">{jobDescription?.title}</h3>
          )}

          {!isCreate && (
            <p className="text-xs opacity-60">
              Created by {jobDescription!.createdBy.name} ·{" "}
              {new Date(jobDescription!.createdAt).toLocaleDateString("en-GB")}
              {jobDescription!.updatedAt !== jobDescription!.createdAt &&
                ` · updated ${new Date(jobDescription!.updatedAt).toLocaleDateString("en-GB")}`}
            </p>
          )}

          {editable ? (
            <textarea
              placeholder="Job description details…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="w-full rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm">{jobDescription?.content}</p>
          )}
        </div>

        {editable && (
          <div className="flex items-center justify-between border-t border-black/10 dark:border-white/15 p-4">
            {onDelete && !isCreate ? (
              <button
                onClick={async () => {
                  if (!confirm("Delete this job description? This can't be undone.")) return;
                  await onDelete();
                  onClose();
                }}
                className="rounded border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-1.5 text-sm"
              >
                Delete
              </button>
            ) : (
              <span />
            )}

            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="rounded bg-foreground text-background px-4 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
