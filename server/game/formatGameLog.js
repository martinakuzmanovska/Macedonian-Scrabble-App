// Keep persisted log entries consistent across engine and route actions.
export function formatGameLog({ type, player, words = [], score, word, outcome }) {
  const name = player?.displayName ?? player?.name;
  const wordList = words.map((entry) => typeof entry === "string" ? entry : entry.word).join(", ");

  switch (type) {
    case "move":
      return `${name}: ${wordList} (+${score})`;
    case "pass":
      return `${name}: пас`;
    case "exchange":
      return `${name}: замена (-5 п.)`;
    case "skip":
      return `${name}: прескокнат (казна)`;
    case "challenge-valid":
      return `🔍 "${wordList}" потврден — ${name} казнет`;
    case "challenge-invalid":
      return `${name}: невалиден збор — плочки вратени`;
    case "bonus":
      return `${name}: бонус прашање за „${word}“ — ${outcome === "declined" ? "откажано" : outcome === "correct" ? "точен одговор (+5)" : "погрешен одговор"}`;
    default:
      throw new Error(`Unknown game log event: ${type}`);
  }
}
