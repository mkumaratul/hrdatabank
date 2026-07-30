"use client";

import { useEffect, useState } from "react";
import { RichTextEditor, RichTextView } from "../job-descriptions/RichTextEditor";

interface JobDescriptionSummary {
  id: string;
  title: string;
  content: string;
}

interface SendJdModalProps {
  candidateId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  onClose: () => void;
  onSent: (remark: { id: string; text: string }) => void;
}

export function SendJdModal({
  candidateId,
  candidateName,
  candidateEmail,
  onClose,
  onSent,
}: SendJdModalProps) {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescriptionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJd, setSelectedJd] = useState<JobDescriptionSummary | null>(null);
  const [subject, setSubject] = useState("");
  const [additionalContent, setAdditionalContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/job-descriptions")
      .then((res) => res.json())
      .then((data) => setJobDescriptions(data.jobDescriptions ?? []))
      .finally(() => setLoading(false));
  }, []);

  function selectJd(jd: JobDescriptionSummary) {
    setSelectedJd(jd);
    setSubject(`Job Description: ${jd.title}`);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setAttachments((prev) => [...prev, ...Array.from(fileList)]);
  }

  async function handleSend() {
    if (!selectedJd) return;
    setSending(true);
    setError(null);

    const formData = new FormData();
    formData.append("jobDescriptionId", selectedJd.id);
    formData.append("subject", subject);
    formData.append("additionalContent", additionalContent);
    attachments.forEach((file) => formData.append("attachments", file));

    const res = await fetch(`/api/candidates/${candidateId}/send-jd`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send email");
      return;
    }

    onSent(data.remark);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-lg bg-white dark:bg-zinc-900 shadow-xl"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/15 px-4 py-3">
          <h2 className="text-lg font-semibold">
            {selectedJd ? "Compose Email" : "Select a Job Description"}
          </h2>
          <button
            onClick={onClose}
            className="rounded border border-black/15 dark:border-white/20 px-3 py-1 text-xs"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {!selectedJd ? (
            loading ? (
              <p className="text-sm opacity-70">Loading job descriptions…</p>
            ) : jobDescriptions.length === 0 ? (
              <p className="text-sm opacity-70">
                No job descriptions yet. Create one from the Job Descriptions page first.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {jobDescriptions.map((jd) => (
                  <button
                    key={jd.id}
                    onClick={() => selectJd(jd)}
                    className="text-left rounded border border-black/10 dark:border-white/15 p-3 hover:border-black/25 dark:hover:border-white/30"
                  >
                    <p className="font-medium text-sm">{jd.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs opacity-70">
                      {jd.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
                    </p>
                  </button>
                ))}
              </div>
            )
          ) : (
            <>
              <div className="text-sm">
                <span className="font-medium">To: </span>
                {candidateEmail ?? "—"}
                {candidateName && <span className="opacity-70"> ({candidateName})</span>}
              </div>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
              />

              <div>
                <span className="text-xs font-medium opacity-70">Additional message (optional)</span>
                <RichTextEditor content={additionalContent} onChange={setAdditionalContent} />
              </div>

              <div>
                <span className="text-xs font-medium opacity-70">Job description preview</span>
                <div className="mt-1 rounded border border-black/10 dark:border-white/15 p-3">
                  <p className="font-medium text-sm mb-1">{selectedJd.title}</p>
                  <RichTextView html={selectedJd.content} />
                </div>
              </div>

              <div>
                <span className="text-xs font-medium opacity-70">Attachments</span>
                <div className="mt-1 flex flex-col gap-1">
                  {attachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="truncate">{file.name}</span>
                      <button
                        onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                        className="opacity-60 hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </>
          )}
        </div>

        {selectedJd && (
          <div className="flex items-center justify-between border-t border-black/10 dark:border-white/15 p-4">
            <button
              onClick={() => setSelectedJd(null)}
              className="rounded border border-black/15 dark:border-white/20 px-3 py-1.5 text-sm"
            >
              Back
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !candidateEmail || !subject.trim()}
              className="rounded bg-foreground text-background px-4 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
