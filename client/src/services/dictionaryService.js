export const normalizeDictionarySearch = value =>
  value.normalize("NFC").trim().toLocaleLowerCase("mk-MK");

const challengeDate = new Intl.DateTimeFormat("mk-MK", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatChallengeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Непознат датум" : challengeDate.format(date);
}

export async function loadDictionary(signal) {
  const response = await fetch("/api/auth/me/dictionary", {
    credentials: "include",
    signal,
  });
  if (response.status === 401) {
    const error = new Error("Сесијата истече.");
    error.status = 401;
    throw error;
  }
  if (!response.ok) throw new Error("Речникот не може да се вчита. Обиди се повторно.");
  const data = await response.json();
  if (!data.success || !Array.isArray(data.words)) {
    throw new Error("Речникот не може да се вчита. Обиди се повторно.");
  }
  return data.words;
}
