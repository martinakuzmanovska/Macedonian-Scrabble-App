import { useEffect, useRef, useState } from "react";
import { formatChallengeDate, loadDictionary, normalizeDictionarySearch } from "../services/dictionaryService.js";
import "./ProfileView.css";

// App keys this component by account ID: no data or search survives account changes.
export default function ProfileView({ user, onClose }) {
  const dialog = useRef(null);
  const [words, setWords] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDictionary(controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setWords(data);
      setStatus("ready");
    }).catch(cause => {
      if (controller.signal.aborted) return;
      setWords([]);
      setError(cause.status === 401
        ? "Сесијата истече. Одјави се и најави се повторно за да го видиш речникот."
        : "Речникот не може да се вчита. Обиди се повторно.");
      setStatus("error");
    });
    return () => controller.abort();
  }, [attempt]);

  const search = normalizeDictionarySearch(query);
  const filtered = words.filter(entry => normalizeDictionarySearch(entry.word).includes(search));

  return (
    <dialog ref={dialog} className="profile-dialog" aria-labelledby="profile-title" lang="mk" onCancel={onClose}>
      <header className="profile-header">
        <div>
          <p className="profile-eyebrow">Мој профил</p>
          <h1 id="profile-title">{user.displayName}</h1>
        </div>
        <button type="button" className="app-navbar-button app-navbar-logout" onClick={onClose} autoFocus>Затвори</button>
      </header>
      <section aria-labelledby="dictionary-title" aria-busy={status === "loading"}>
        <h2 id="dictionary-title">Мој речник</h2>
        <p className="profile-description">Пребарувај ги зачуваните зборови и прегледај ги нивните значења и предизвици.</p>
        {status === "loading" && <p role="status" className="profile-state">Се вчитува речникот…</p>}
        {status === "error" && (
          <div className="profile-state" role="alert">
            <p>{error}</p>
            <button type="button" className="app-navbar-button app-navbar-leaderboard" onClick={() => {
              setStatus("loading"); setError(""); setAttempt(value => value + 1);
            }}>Обиди се повторно</button>
          </div>
        )}
        {status === "ready" && !words.length && (
          <p className="profile-state" role="status">Твојот речник сè уште е празен. Тука ќе се појават зборовите со дефиниција што си ги предизвикал кај друг играч, а биле потврдени како валидни.</p>
        )}
        {status === "ready" && words.length > 0 && (
          <>
            <label className="profile-search" htmlFor="dictionary-search">Пребарај збор
              <input id="dictionary-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Внеси македонски збор…" autoComplete="off" />
            </label>
            <p className="profile-result-count" role="status">Пронајдени зборови: {filtered.length}</p>
            {!filtered.length && <p className="profile-state">Нема зборови што одговараат на пребарувањето.</p>}
            <ul className="profile-words">
              {filtered.map(entry => (
                <li className="profile-word" key={entry.normalizedWord}>
                  <h3>{entry.word}</h3>
                  <p className="profile-definition">{entry.definition}</p>
                  <details>
                    <summary>Историја на предизвици ({entry.history.length})</summary>
                    <ol className="profile-challenges">
                      {[...entry.history].sort((a, b) => new Date(b.challengedAt) - new Date(a.challengedAt)).map(event => (
                        <li key={event.eventId}>
                          <time dateTime={event.challengedAt}>{formatChallengeDate(event.challengedAt)}</time>
                          <span>Игра: <bdi>{event.gameId}</bdi></span>
                          <span>Зборот го постави: <strong>{event.author.displayName}</strong></span>
                        </li>
                      ))}
                    </ol>
                  </details>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </dialog>
  );
}
