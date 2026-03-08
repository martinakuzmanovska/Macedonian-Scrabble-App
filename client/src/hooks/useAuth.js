import { useState, useEffect, useCallback } from "react";

/**
 * useAuth — checks the current session on mount and exposes
 * the logged-in user plus a logout function.
 *
 * Usage:
 *   const { user, loading, logout } = useAuth();
 *
 * - user:    null if not logged in, otherwise { id, displayName, email, avatar }
 * - loading: true while the initial /api/auth/me check is in flight
 * - logout:  async function that clears the session and sets user to null
 */
export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  return { user, loading, logout };
}

