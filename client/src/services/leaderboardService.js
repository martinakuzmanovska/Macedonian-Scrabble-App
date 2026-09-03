export async function loadLeaderboard() {
  try {
    const r = await window.storage.get("mk-scrabble-lb");
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}
export async function saveLeaderboard(data) {
  try {
    await window.storage.set("mk-scrabble-lb", JSON.stringify(data));
  } catch {}
}
export async function updateLeaderboard(name, score, won, age) {
  const lb = await loadLeaderboard();
  let e = lb.find((x) => x.name === name);
  if (!e) {
    e = { name, age, bestScore: 0, totalGames: 0, wins: 0, totalScore: 0 };
    lb.push(e);
  }
  e.totalGames++;
  e.totalScore += score;
  e.age = age;
  if (won) e.wins++;
  if (score > e.bestScore) e.bestScore = score;
  e.avgScore = Math.round(e.totalScore / e.totalGames);
  e.lastPlayed = new Date().toISOString();
  lb.sort((a, b) => b.bestScore - a.bestScore);
  await saveLeaderboard(lb);
  return lb;
}