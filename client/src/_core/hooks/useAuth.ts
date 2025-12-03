// Full auth removal (frontend): stubbed auth hook that always returns a dev user.
// WARNING: This removes all authentication. Suitable for local dev/testing only.
import { useMemo } from "react";

export function useAuth() {
  const user = useMemo(() => ({
    id: "dev",
    name: "Dev User",
    email: "dev@example.com",
    roles: ["admin"],
    token: "dev-token"
  }), []);

  const isAuthenticated = true;
  const signOut = async () => Promise.resolve();
  const signIn = async () => Promise.resolve(user);

  return { isAuthenticated, user, signOut, signIn };
}
