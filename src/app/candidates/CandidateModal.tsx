"use client";

import { useRef, useState } from "react";
import { EditableTextCell, WorkLinksCell, RemarksCell } from "./EditableCells";
import { SendJdModal } from "./SendJdModal";
import {
  Candidate,
  Status,
  TextField,
  STATUSES_REQUIRING_REASON,
  ADD_NEW_CATEGORY,
  ADD_NEW_STATUS,
  statusLabel,
  statusStyle,
} from "./types";

interface CandidateModalProps {
  candidate: Candidate;
  categories: string[];
  statuses: string[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: Status, statusReason: string) => void;
  onUpdateCategory: (id: string, rawCategory: string) => void;
  onUpdateTextField: (id: string, field: TextField, value: string) => void;
  onUpdateWorkLinks: (id: string, links: string[]) => void;
  onAddRemark: (id: string, text: string) => void;
  onJdSent: (id: string, remark: { id: string; text: string }) => void;
  onDelete: (id: string, name: string | null) => Promise<boolean>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium opacity-70">{label}</span>
      {children}
    </div>
  );
}

export function CandidateModal({
  candidate: c,
  categories,
  statuses,
  onClose,
  onUpdateStatus,
  onUpdateCategory,
  onUpdateTextField,
  onUpdateWorkLinks,
  onAddRemark,
  onJdSent,
  onDelete,
}: CandidateModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [reason, setReason] = useState(c.statusReason ?? "");
  const [sendingJd, setSendingJd] = useState(false);
  const isPdf = c.mimeType === "application/pdf";
  const previewUrl = `/api/candidates/${c.id}/resume`;
  const downloadUrl = `/api/candidates/${c.id}/resume?mode=download`;
  const reasonRequired = STATUSES_REQUIRING_REASON.has(c.status);

  function handlePrint() {
    iframeRef.current?.contentWindow?.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[1600px] flex-col rounded-lg bg-white dark:bg-zinc-900 shadow-xl md:flex-row"
        style={{ height: "94vh", width: "95vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-black/10 dark:border-white/15 md:w-[62%]">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/15 px-4 py-3">
            <span className="truncate font-medium text-sm">{c.fileName}</span>
            <div className="flex items-center gap-2">
              {isPdf && (
                <button
                  onClick={handlePrint}
                  className="rounded border border-black/15 dark:border-white/20 px-3 py-1 text-xs"
                >
                  Print
                </button>
              )}
              <a
                href={downloadUrl}
                className="rounded border border-black/15 dark:border-white/20 px-3 py-1 text-xs"
              >
                Download
              </a>
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-[500px]">
            {isPdf ? (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="h-full w-full"
                style={{ minHeight: "500px" }}
                title={c.fileName}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm opacity-70">
                <p>Preview isn&apos;t available for Word documents in the browser.</p>
                <a
                  href={downloadUrl}
                  className="rounded bg-foreground text-background px-4 py-2 text-sm font-medium"
                >
                  Download to view
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:w-[38%] overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/15 px-4 py-3">
            <h2 className="text-lg font-semibold truncate">{c.name ?? "Candidate"}</h2>
            <button
              onClick={onClose}
              className="rounded border border-black/15 dark:border-white/20 px-3 py-1 text-xs"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Name">
                <EditableTextCell
                  value={c.name}
                  placeholder="Candidate name"
                  onSave={(v) => onUpdateTextField(c.id, "name", v)}
                />
              </Field>
              <Field label="Phone">
                <EditableTextCell
                  value={c.phone}
                  placeholder="Phone number"
                  onSave={(v) => onUpdateTextField(c.id, "phone", v)}
                />
              </Field>
              <Field label="Email">
                <EditableTextCell
                  value={c.email}
                  placeholder="Email address"
                  onSave={(v) => onUpdateTextField(c.id, "email", v)}
                />
              </Field>
              <Field label="Uploaded">
                <span>{new Date(c.createdAt).toLocaleDateString("en-GB")}</span>
              </Field>
              <Field label="Reviewed by">
                <span>{c.reviewedBy?.name ?? "—"}</span>
              </Field>
            </div>

            <Field label="Category">
              <select
                value={c.skillCategory ?? ""}
                onChange={(e) => onUpdateCategory(c.id, e.target.value)}
                className="rounded border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
              >
                {!c.skillCategory && <option value="">—</option>}
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value={ADD_NEW_CATEGORY}>+ Add new…</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                value={c.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as Status;
                  let nextReason = reason;

                  if (nextStatus !== ADD_NEW_STATUS && STATUSES_REQUIRING_REASON.has(nextStatus) && !reason.trim()) {
                    const input = window.prompt(
                      `A reason is required to set status to "${statusLabel(nextStatus)}":`,
                    );
                    if (!input?.trim()) return;
                    nextReason = input.trim();
                    setReason(nextReason);
                  }

                  onUpdateStatus(c.id, nextStatus, nextReason);
                }}
                className={`rounded px-2 py-1.5 text-sm font-medium ${statusStyle(c.status)}`}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
                <option value={ADD_NEW_STATUS}>+ Add new…</option>
              </select>
            </Field>

            <Field label="Reason">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={reasonRequired ? "Reason (required)" : "Reason (optional)"}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => onUpdateStatus(c.id, c.status, reason)}
                  className="rounded border border-black/15 dark:border-white/20 px-3 py-1.5 text-sm"
                >
                  Save
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Relevant Experience">
                <EditableTextCell
                  value={c.experience}
                  placeholder="e.g. 3 years"
                  onSave={(v) => onUpdateTextField(c.id, "experience", v)}
                />
              </Field>
              <Field label="Notice Period">
                <EditableTextCell
                  value={c.noticePeriod}
                  placeholder="e.g. 30 days"
                  onSave={(v) => onUpdateTextField(c.id, "noticePeriod", v)}
                />
              </Field>
              <Field label="Current CTC">
                <EditableTextCell
                  value={c.currentCtc}
                  placeholder="e.g. 8 LPA"
                  onSave={(v) => onUpdateTextField(c.id, "currentCtc", v)}
                />
              </Field>
              <Field label="Expected CTC">
                <EditableTextCell
                  value={c.expectedCtc}
                  placeholder="e.g. 12 LPA"
                  onSave={(v) => onUpdateTextField(c.id, "expectedCtc", v)}
                />
              </Field>
              <Field label="Location">
                <EditableTextCell
                  value={c.location}
                  placeholder="e.g. Bengaluru"
                  onSave={(v) => onUpdateTextField(c.id, "location", v)}
                />
              </Field>
            </div>

            <Field label="Work Links">
              <WorkLinksCell
                links={c.workLinks}
                onAdd={(link) => onUpdateWorkLinks(c.id, [...c.workLinks, link])}
                onRemove={(i) =>
                  onUpdateWorkLinks(
                    c.id,
                    c.workLinks.filter((_, idx) => idx !== i),
                  )
                }
              />
            </Field>

            <Field label="Remarks">
              <RemarksCell remarks={c.remarks} onAdd={(text) => onAddRemark(c.id, text)} />
            </Field>
          </div>

          <div className="flex items-center justify-between border-t border-black/10 dark:border-white/15 p-4">
            <button
              onClick={async () => {
                const deleted = await onDelete(c.id, c.name);
                if (deleted) onClose();
              }}
              className="rounded border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-1.5 text-sm"
            >
              Delete candidate
            </button>
            <button
              onClick={() => setSendingJd(true)}
              disabled={c.status !== "SELECTED"}
              title={c.status !== "SELECTED" ? "Set status to Selected to send a JD" : undefined}
              className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              Send JD
            </button>
          </div>
        </div>
      </div>

      {sendingJd && (
        <SendJdModal
          candidateId={c.id}
          candidateName={c.name}
          candidateEmail={c.email}
          onClose={() => setSendingJd(false)}
          onSent={(remark) => onJdSent(c.id, remark)}
        />
      )}
    </div>
  );
}
