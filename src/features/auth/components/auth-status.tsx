"use client";

import { authClient } from "../lib/auth-client";

export function AuthStatus() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <span className="text-sm text-neutral-500">Loading...</span>;
  }

  if (!session) {
    return <span className="text-sm text-neutral-500">Not signed in</span>;
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span>{session.user.email}</span>
      <button
        type="button"
        onClick={() => authClient.signOut()}
        className="rounded border px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        Sign out
      </button>
    </div>
  );
}
