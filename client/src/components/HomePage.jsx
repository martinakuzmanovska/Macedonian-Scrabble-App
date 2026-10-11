import { useState } from "react";
import "./HomePage.css";

export default function HomePage({ onAction, loading = false, error = null }) {
  const [inviteCode, setInviteCode] = useState("");
  const [gameMode, setGameMode] = useState("classic");

  const joinWithCode = (event) => {
    event.preventDefault();
    const code = inviteCode.trim();
    if (code) onAction({ type: "join", code });
  };

  return (
    <main className="home-page">
      <div className="home-shell">
        <header className="home-hero">
          <div className="home-copy">
            <p className="home-kicker">МАКЕДОНСКО ИЗДАНИЕ</p>
            <h1>СКРАБЛ</h1>
            <p className="home-tagline">
              Состави збор. Поврзи ги буквите. Освои ја таблата.
            </p>
          </div>

          <div
            className="home-image-placeholder"
            role="img"
            aria-label="Илустрација на табла и плочки за скрабл"
          >
            <div className="home-art-board" aria-hidden="true">
              <span className="home-art-tile home-art-tile--one">З</span>
              <span className="home-art-tile home-art-tile--two">Б</span>
              <span className="home-art-tile home-art-tile--three">О</span>
              <span className="home-art-tile home-art-tile--four">Р</span>
              <span className="home-art-tile home-art-tile--five">!</span>
            </div>
            <span className="home-art-caption">МАКЕДОНСКИ ЗБОРОВИ</span>
          </div>
        </header>

        <section
          className="home-play-section"
          aria-labelledby="home-play-title"
        >
          <div className="home-section-heading">
            <p className="home-kicker">ИЗБЕРИ РЕЖИМ</p>
            <h2 id="home-play-title">Како сакаш да играш?</h2>
          </div>

          <div className="home-play-options">
            <article className="home-play-card">
              <button
                className="home-play-card-action"
                type="button"
                disabled={loading}
                onClick={() => onAction({ type: "player", gameMode })}
              >
                <span className="home-play-icon" aria-hidden="true">
                  👥
                </span>
                <span className="home-play-title">Играј со играч</span>
                <span className="home-play-description">
                  Создај игра и покани пријател со код.
                </span>
                <span className="home-play-cta">
                  {loading ? "Се подготвува..." : "Започни игра"}{" "}
                  <span aria-hidden="true">→</span>
                </span>
              </button>
              <fieldset className="home-game-mode">
                <legend>Режим на игра</legend>
                <label>
                  <input
                    type="radio"
                    name="home-game-mode"
                    value="classic"
                    checked={gameMode === "classic"}
                    onChange={() => setGameMode("classic")}
                  />
                  <span>Класична игра</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="home-game-mode"
                    value="bonus"
                    checked={gameMode === "bonus"}
                    onChange={() => setGameMode("bonus")}
                  />
                  <span>Игра со бонус прашања</span>
                </label>
              </fieldset>
            </article>

            <button
              className="home-play-card home-play-card--ai"
              type="button"
              disabled={loading}
              onClick={() => onAction({ type: "ai" })}
            >
              <span className="home-play-icon" aria-hidden="true">
                🤖
              </span>
              <span className="home-play-title">Играј со AI</span>
              <span className="home-play-description">
                Испробај ја стратегијата против компјутерот.
              </span>
              <span className="home-play-cta">
                {loading ? "Се подготвува..." : "Започни игра"}{" "}
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </div>
        </section>

        <section
          className="home-join-section"
          aria-labelledby="home-join-title"
        >
          <div>
            <p className="home-kicker">ИМАШ КОД?</p>
            <h2 id="home-join-title">Приклучи се со код</h2>
            <p>Внеси го кодот што ти го испрати другиот играч.</p>
          </div>
          <form className="home-join-form" onSubmit={joinWithCode}>
            <label className="visually-hidden" htmlFor="home-invite-code">
              Код за покана
            </label>
            <input
              id="home-invite-code"
              autoComplete="off"
              maxLength={8}
              placeholder="пр. XK9MQ2"
              value={inviteCode}
              onChange={(event) =>
                setInviteCode(event.target.value.toUpperCase())
              }
            />
            <button type="submit" disabled={loading || !inviteCode.trim()}>
              {loading ? "Се приклучува..." : "Приклучи се"}
            </button>
          </form>
        </section>

        {error && (
          <p className="home-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
