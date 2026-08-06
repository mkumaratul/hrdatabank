import { Suspense } from "react";
import { auth, signOut } from "@/lib/auth";
import { CandidatesClient } from "./CandidatesClient";
import { HeaderNav } from "./HeaderNav";

export default async function CandidatesPage() {
  const session = await auth();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 dark:border-white/15 px-6 py-4">
        <span className="font-semibold">HR Databank</span>
        <HeaderNav userName={session?.user?.name} onSignOut={handleSignOut} />
      </header>

      <Suspense>
        <CandidatesClient />
      </Suspense>
    </div>
  );
}
