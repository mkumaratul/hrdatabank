import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { CandidatesClient } from "./CandidatesClient";

export default async function CandidatesPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 dark:border-white/15 px-6 py-4">
        <span className="font-semibold">HR Databank</span>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/job-descriptions" className="underline">
            Job Descriptions
          </Link>
          <Link href="/hr-users" className="underline">
            Manage HR
          </Link>
          <span className="opacity-70">{session?.user?.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="underline">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <CandidatesClient />
    </div>
  );
}
