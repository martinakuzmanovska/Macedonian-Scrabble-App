import { useState, useCallback } from "react";

/**
 * useGame
 *
 * Handles all communication with /api/games.
 * The game component never talks to the server directly —
 * it dispatches actions through this hook.
 *
 * Usage:
 *   const { gameId, gameState, loading, error, createGame, joinGame, sendAction } = useGame();
 */
export function useGame() {
  const [gameId,    setGameId]    = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

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
    return data.state;
  }, []);

  // ── Create ───────────────────────────────────

  /**
   * Create a new game.
   * @param {Array} players  [{ name, age, type, userId?, avatar? }]
   */
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

  /**
   * Join an existing game by invite code.
   * @param {string} inviteGameId
   */
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

  /**
   * Load an existing game (e.g. on page refresh).
   * @param {string} inviteGameId
   */
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

  /**
   * Send a turn action to the server.
   * The server runs it through the engine and returns the new state.
   *
   * @param {string} action   e.g. "place", "remove", "confirm", "pass", etc.
   * @param {Object} payload  action-specific data
   */
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