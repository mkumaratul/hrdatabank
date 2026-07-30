import Link from "next/link";
import { JobDescriptionsClient } from "./JobDescriptionsClient";

export default function JobDescriptionsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 dark:border-white/15 px-6 py-4">
        <span className="font-semibold">HR Databank</span>
        <Link href="/candidates" className="text-sm underline">
          Back to candidates
        </Link>
      </header>

      <JobDescriptionsClient />
    </div>
  );
}
