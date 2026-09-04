# Scrabble Component Extraction Plan

The safest next extractions are UI-only pieces that do not own game state.

## 1. `HomeScreen`

Extract the `screen === "home"` block around `client/src/scrabble.jsx:1690`.

```jsx
<HomeScreen
  styles={S}
  onNewGame={() => setScreen("setup")}
  onOpenLeaderboard={() => {
    loadLeaderboard().then(setLeaderboard);
    setScreen("leaderboard");
  }}
/>
```

## 2. `LeaderboardScreen`

Extract the `screen === "leaderboard"` block around `client/src/scrabble.jsx:1872`.

```jsx
<LeaderboardScreen
  styles={S}
  leaderboard={leaderboard}
  onBack={() => setScreen("home")}
/>
```

## 3. `WordInfoModal`

Extract the modal around `client/src/scrabble.jsx:2135`.

```jsx
<WordInfoModal
  styles={S}
  wordInfo={wordInfoModal}
  loading={isLoadingInfo}
  onClose={() => setWordInfoModal(null)}
/>
```

## 4. `JokerModal`

Extract the modal around `client/src/scrabble.jsx:2389`.

```jsx
<JokerModal
  styles={S}
  joker={jokerModal}
  letters={MK_LETTERS}
  onAssign={assignJoker}
  onClose={() => setJokerModal(null)}
/>
```

## Playing-screen components

| Component | Current area | Props/callbacks |
|---|---|---|
| `ScrabbleBoard` | ~2470–2617 | `board`, `placedTiles`, `selectedTile`, `draggedTile`, `bonusMap`, `onCellClick`, `onCellDrop`, `onRemoveTile` |
| `TileRack` | ~2620–2695 | `player`, `selectedTile`, `draggedTile`, `getDisplayLetter`, `onTileSelect`, `onDragStart`, `onDragEnd`, `onDrop` |
| `TurnControls` | ~2698–2750 | `hasPlacedTiles`, `turnScore`, `tileBagCount`, `onConfirm`, `onPass`, `onExchange`, `onReturnTiles` |
| `FormedWordsPanel` | ~2754–2840 | `words`, `turnScore` |
| `PlayersPanel` | ~2840–3034 | `players`, `currentPlayer`, `tileBagCount`, `isAIThinking` |
| `ChallengePanel` | ~3036–3336 | `words`, `result`, `isValidating`, `onChallenge`, `onContinue`, `onWordInfo` |
| `GameLog` | ~3337 onward | `entries={gameLog}` |

Use callbacks, not raw React state setters, for child components. Good:

```jsx
<TileRack onTileSelect={selectTile} />
```

Avoid:

```jsx
<TileRack setSelectedTile={setSelectedTile} />
```

Do not extract the game-flow functions yet: `confirmPlacement`, `challengeWord`, `finalizeTurn`, AI moves, polling, and server synchronization. They are tightly coupled. Extract those later into a `useScrabbleGame` hook after the visual components are out.
