"use client";

import { useRef } from "react";

interface ResumeModalProps {
  candidateId: string;
  fileName: string;
  mimeType: string;
  onClose: () => void;
}

export function ResumeModal({ candidateId, fileName, mimeType, onClose }: ResumeModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isPdf = mimeType === "application/pdf";
  const previewUrl = `/api/candidates/${candidateId}/resume`;
  const downloadUrl = `/api/candidates/${candidateId}/resume?mode=download`;

  function handlePrint() {
    iframeRef.current?.contentWindow?.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-3xl flex-col rounded-lg bg-white dark:bg-zinc-900 shadow-xl"
        style={{ height: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/15 px-4 py-3">
          <span className="truncate font-medium text-sm">{fileName}</span>
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
            <button
              onClick={onClose}
              className="rounded border border-black/15 dark:border-white/20 px-3 py-1 text-xs"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {isPdf ? (
            <iframe ref={iframeRef} src={previewUrl} className="h-full w-full" title={fileName} />
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
    </div>
  );
}
