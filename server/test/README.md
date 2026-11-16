# Personal dictionary regression checks

Run from the repository root with local MongoDB available:

```sh
npm --prefix server test
npm --prefix client test
npm --prefix client run build
npm --prefix server run test:browser
```

The browser test needs local Chrome and Python's `websocket-client` package. Set
`CHROME_PATH` if Chrome is installed somewhere other than its usual Windows path.
It uses the built client in `client/dist`; rebuild after frontend changes.

Tests create uniquely named MongoDB databases and remove those databases during
cleanup. The fixtures create two users and sign them in through Passport using
Mongo-backed sessions. Only external Google consent is skipped. Deterministic
racks and cached dictionary responses avoid external services and random draws.
The fixture login/rack/shutdown routes are never mounted by `server/app.js`.

## Coverage

- Session-based create, join, confirm, challenge, finalize, and state reads.
- Only the challenger owns a qualifying word; account ID query parameters cannot
  change dictionary ownership. Signed-out requests return 401.
- Author ID/name snapshot, game ID, server timestamp, and newest-first history.
- Repeated word in the same game: two events under one entry. Retrying either
  challenge leaves history, scores, penalties, racks, boards, and turn unchanged.
- Invalid, inconclusive, missing-definition, accepted, and AI cases produce no
  dictionary entries/events. Missing definitions still resolve the turn.
- Cross words: only the selected word is collected.
- Both players read matching state, including exact rack refill/rollback, board,
  score, turn, and tile bag changes.
- Existing dictionary tests cover unique database constraints, simultaneous
  resolution, and retry/read recovery after an injected dictionary write outage.
- Browser clicks exercise normal multiplayer UI and polling, profile privacy,
  case-insensitive Macedonian search, no matches, expanded history, refresh,
  loading, API errors/retry, late-response cancellation, logout, and switching
  accounts in the same browser context.

Google OAuth consent, live dictionary scraping, and an AI-generated move are not
tested. AI confirmation/finalization is tested without invoking an AI service.

## Manual check with two browser sessions

1. Start MongoDB, `npm --prefix server start`, and `npm --prefix client run dev`.
   Sign in as A in one browser profile and B in an incognito window or another
   profile. A creates a human game; B follows the invite link.
2. A confirms a word with a dictionary definition. B challenges that word. After
   closing the result, check A's score/refilled rack, B's skipped turn, and both
   boards. Only B's **Мој профил → Мој речник** should contain the word. Expand
   history to check A's name, game ID, and date/time.
3. A forms the same word again later in that game; B challenges it. Expect one
   entry with two events. Replay one challenge POST from DevTools using the same
   `pendingMoveId` and `wordIndex`: score and history count stay unchanged.
4. Accept another move and challenge an invalid word. History should not grow.
   An invalid challenge restores A's tiles/board, leaves A's score unchanged, and
   gives B the turn. On a crossing move, challenge one word and inspect its entry.
5. Search B's dictionary in upper/lowercase and refresh. Sign out and open
   `/#profile`: sign-in is required. `/api/auth/me/dictionary` returns 401.
   Sign in as A in the same window: B's dictionary must not appear.

Missing-definition and inconclusive cases are reproducible in the automated
tests without depending on unpredictable live dictionary responses.
