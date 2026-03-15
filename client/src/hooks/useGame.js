import { useState, useCallback, useEffect } from "react";

const SESSION_KEY = "mk-scrabble-gameid";

export function useGame() {
  // If a ?join= param is present, clear any saved game immediately
  // so the restore doesn't race with the join.
  const hasJoinParam = new URLSearchParams(window.location.search).has("join");
  if (hasJoinParam) sessionStorage.removeItem(SESSION_KEY);

  const [gameId,    setGameId]    = useState(() =>
    hasJoinParam ? null : sessionStorage.getItem(SESSION_KEY)
  );
  const [gameState, setGameState] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  // On mount: if we have a saved gameId, reload it from the server
  useEffect(() => {
    if (hasJoinParam) return; // joining via link — don't restore old game
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;
    setLoading(true);
    fetch(`/api/games/${saved}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setGameState(data.state);
          setGameId(data.gameId);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          setGameId(null);
        }
      })
      .catch(() => {
        sessionStorage.removeItem(SESSION_KEY);
        setGameId(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Helpers ──────────────────────────────────
  const apiFetch = useCallback(async (path, options = {}) => {
    const res = await fetch(path, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error ?? "Request failed");
    return data;
  }, []);

  const handleResult = useCallback((data) => {
    setGameState(data.state);
    setGameId(data.gameId);
    setError(null);
    sessionStorage.setItem(SESSION_KEY, data.gameId);
    return data.state;
  }, []);

  // ── Create ───────────────────────────────────
  const createGame = useCallback(async (players) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/games", { method: "POST", body: { players } });
      return handleResult(data);
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFetch, handleResult]);

  // ── Join ─────────────────────────────────────
  const joinGame = useCallback(async (inviteGameId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/games/${inviteGameId}/join`, { method: "POST" });
      return handleResult(data);
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFetch, handleResult]);

  // ── Load ─────────────────────────────────────
  const loadGame = useCallback(async (inviteGameId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/games/${inviteGameId}`);
      return handleResult(data);
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFetch, handleResult]);

  // ── Send action ──────────────────────────────
  const sendAction = useCallback(async (action, payload = {}) => {
    if (!gameId) return null;
    setError(null);
    try {
      const data = await apiFetch(`/api/games/${gameId}/${action}`, {
        method: "POST",
        body: payload,
      });
      setGameState(data.state);
      return data.state;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [gameId, apiFetch]);

  // ── Clear ────────────────────────────────────
  const clearGame = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setGameId(null);
    setGameState(null);
    setError(null);
  }, []);

  return {
    gameId,
    gameState,
    loading,
    error,
    createGame,
    joinGame,
    loadGame,
    sendAction,
    clearGame,
  };
}