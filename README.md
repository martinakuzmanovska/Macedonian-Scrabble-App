# Scrabble App

A Scrabble-style word game. This guide describes a typical local setup; exact commands and features depend on the scripts and implementation in this repository.

## Requirements

- Node.js (use the version specified by the project, if any)
- npm, or the package manager identified by the repository's lockfile

## Installation

Clone the repository and install its dependencies:

```bash
git clone <repository-url>
cd scrabble-app
npm install
```

For a clean install when `package-lock.json` is present, you can use `npm ci` instead.

## Run locally

Start the development server:

```bash
npm run dev
```

Open the local address printed in the terminal. If `dev` is not a defined script, run `npm run` to list the available scripts and use the appropriate start command from `package.json`.

## Configuration

No environment variables or external services are assumed here. Check the project documentation and source for supported settings. If environment variables are required, create a local `.env` file with the documented names. Keep credentials and other secrets out of version control.

Game rules, dictionary, tile values, and board configuration are implementation-specific; use the app's settings if available or consult the corresponding project files.

## Basic usage

1. Start the app and open it in your browser.
2. Create or join a game using the controls provided by the app.
3. Place letter tiles on the board to form a word.
4. Submit your play using the in-app control. The app validates and scores the word according to its implemented rules.
5. Continue taking turns until the game ends.

Controls, turn flow, and multiplayer support may differ by version.

## Project scripts

Inspect scripts declared in `package.json`:

```bash
npm run
```

Common scripts, when present, include:

```bash
npm run dev      # Start the development server
npm run build    # Build for production
npm run test     # Run tests
npm run lint     # Run lint checks
```

Only use commands that are defined by the project.

## Troubleshooting

- If installation fails, check your Node.js version and use the package manager matching the lockfile.
- If a script is not found, run `npm run` to see available commands.
- If the development port is occupied, stop the other process or follow the server's prompt to choose a different port.

## Contributing

Use a separate branch, follow existing code conventions, and run the available tests and lint checks before submitting changes.