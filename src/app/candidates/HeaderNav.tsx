"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "/candidates", label: "All Candidates" },
  { href: "/candidates?status=INTERVIEW_TO_BE_SCHEDULED", label: "Interview to be Scheduled" },
  { href: "/candidates?status=INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { href: "/job-descriptions", label: "Job Descriptions" },
  { href: "/hr-users", label: "Manage HR" },
];

export function HeaderNav({
  userName,
  onSignOut,
}: {
  userName?: string | null;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="hidden md:flex items-center gap-4 text-sm">
        {links.map((l) => (
          <Link key={l.label} href={l.href} className="underline">
            {l.label}
          </Link>
        ))}
        <span className="opacity-70">{userName}</span>
        <form action={onSignOut}>
          <button type="submit" className="underline">
            Sign out
          </button>
        </form>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        className="md:hidden rounded border border-black/15 dark:border-white/20 px-3 py-1.5 text-sm"
      >
        ☰
      </button>

      {open && (
        <div className="md:hidden absolute right-0 top-full mt-2 w-64 rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 shadow-xl p-3 flex flex-col gap-3 text-sm z-50">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="underline" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <span className="opacity-70">{userName}</span>
          <form action={onSignOut}>
            <button type="submit" className="underline">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
