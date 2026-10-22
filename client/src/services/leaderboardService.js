export async function loadLeaderboard() {
  try {
    const response = await fetch("/api/games/leaderboard", {
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to load leaderboard");
    }
    return Array.isArray(data.leaderboard) ? data.leaderboard : [];
  } catch (error) {
    console.error("Leaderboard load failed:", error);
    return [];
  }
}
