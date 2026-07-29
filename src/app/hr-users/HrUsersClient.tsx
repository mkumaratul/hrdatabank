"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";

interface HrUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export function HrUsersClient() {
  const [hrUsers, setHrUsers] = useState<HrUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadHrUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hr-users");
    if (res.ok) {
      const data = await res.json();
      setHrUsers(data.hrUsers);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHrUsers();
  }, [loadHrUsers]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/hr-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create HR account");
      setSubmitting(false);
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setSubmitting(false);
    await loadHrUsers();
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-semibold">HR Accounts</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded border border-black/10 dark:border-white/15 p-4"
      >
        <h2 className="text-sm font-medium">Add a new HR user</h2>

        <input
          type="text"
          placeholder="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-foreground text-background py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create HR account"}
        </button>
      </form>

      <div className="rounded border border-black/10 dark:border-white/15">
        <table className="w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Added</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 opacity-70" colSpan={3}>
                  Loading…
                </td>
              </tr>
            ) : (
              hrUsers.map((u) => (
                <tr key={u.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
