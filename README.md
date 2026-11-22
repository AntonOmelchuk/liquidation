# Liquidation

Liquidation is a local trading journal. The initial release slice records closed positions and calculates net P&L, win rate and realized R. The UI uses React and TypeScript. Node.js stores the journal on the same machine.

## Requirements and setup

- Node.js 24. Use `nvm use` if you have nvm.
- pnpm 11.25.0. Install with `npm install --global pnpm@11.25.0` if needed.
- Git for source control and Husky hooks. If starting from a ZIP, run `git init -b main` before installing so the hooks can attach.

Run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the loopback address printed by Vite. To run the production build locally:

```sh
pnpm build
pnpm start
```

Open `http://127.0.0.1:4173`.

## Recording trades and reading the metrics

Enter a position’s opening and closing times in your computer’s local time. The journal stores UTC timestamps and displays dates in the browser’s time zone. Enter monetary values in one consistent currency for this initial slice. Record costs with their original sign (for example a commission charge of 2.50 is `-2.50`).

- Net P&L is gross P&L plus commission and swap. Each field is converted to integer cents before addition.
- Win rate is the fraction of all closed trades whose net P&L is positive. A zero result stays in the denominator.
- Realized R is net P&L divided by the recorded initial monetary risk. An empty risk displays a dash.

## Data location and backup

The default file is `~/.liquidation/journal.json`. To use a different directory, set `LIQUIDATION_DATA_DIR` before starting either server. Use a directory outside the repository. Run one server instance per data directory. A backup is a copy of the journal directory taken with the app stopped. To restore, stop the app, preserve a copy of the current directory, and copy the backed-up file into the configured directory before restarting.

## Repository layout

| Path                       | Responsibility                      |
| -------------------------- | ----------------------------------- |
| `apps/web`                 | React journal UI                    |
| `apps/local-server`        | Local HTTP API and JSON persistence |
| `packages/domain`          | Shared trade schema and metrics     |
| `.github/workflows/ci.yml` | Pull request and main branch checks |
| `.husky`                   | Git hooks                           |

## Development checks

| Command             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `pnpm format`       | Format source files                              |
| `pnpm format:check` | Check formatting                                 |
| `pnpm lint`         | Run ESLint with TypeScript and React Hooks rules |
| `pnpm typecheck`    | Check TypeScript types                           |
| `pnpm test`         | Run the Vitest suite                             |
| `pnpm build`        | Compile the production UI                        |
| `pnpm check`        | Run the full quality gate                        |

Husky installs during `pnpm install` in a Git checkout. The pre-commit hook applies ESLint and Prettier to staged files. The pre-push hook runs the full gate. Use `pnpm prepare` to reinstall hooks after initializing Git.

GitHub Actions runs the same gate. Once the project has a GitHub remote and a successful workflow run, configure the `main` ruleset to require a pull request and the **Quality gate** status check. The workflow defines the check. The repository ruleset controls whether GitHub blocks a merge.

## Current scope

This slice supports manual recording and reading of closed trades in a single journal. Account and currency handling, open-position lifecycle, Plans, Backtests, advanced analytics, local AI Review, translation, theme and text-size controls are upcoming. The AI Review will use records already in the journal.
