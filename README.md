# Liquidation

Liquidation is a local trading journal. It records trades, trading plans, playbooks and manual backtests. It calculates net P&L, win rate, realized R and missed-opportunity scenarios. The UI uses React and TypeScript. Node.js stores the journal on the same machine.

## Requirements and setup

- Node.js 24. Use `nvm use` if you have nvm.
- pnpm 11.25.0. Install with `npm install --global pnpm@11.25.0` if needed.
- Git for source control and Husky hooks. If starting from a ZIP, run `git init -b main` before installing so the hooks can attach.

Run these commands from the repository root. Use `nvm install` first if Node 24 is missing.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the loopback address printed by Vite. The development command starts the UI and local journal API together. The following commands run the production build locally.

```sh
pnpm build
pnpm start
```

Open `http://127.0.0.1:4173`.

## Recording trades and reading the metrics

Enter a position’s opening and closing times in your computer’s local time. The journal stores UTC timestamps and displays dates in the browser’s time zone. Enter monetary values in a single consistent journal currency. Record costs with their original sign (for example a commission charge of 2.50 is `-2.50`).

- Net P&L is gross P&L plus commission and swap. Each field is converted to integer cents before addition.
- Win rate is the fraction of all closed trades whose net P&L is positive. A zero result stays in the denominator.
- Realized R is net P&L divided by the recorded initial monetary risk. An empty risk displays a dash.

## Trading plans and missed opportunities

Open **Plans** to create a market narrative and an execution plan for a day or a date range. **Waiting** is the default status. Choose another status in the plan form while creating or editing it. The table groups current and upcoming plans separately from past or voided plans. Select the plan name to open it, **Edit** to change its fields, or the status badge to go straight to the review fields.

- Add an analysis block for each timeframe. Attach screenshots to the analysis, execution plan, timeline entries or post-session review. Paste from the clipboard while the screenshot area is focused, drop images from your file manager or use **Choose images**. Reorder screenshots by dragging them or using the arrow buttons. Select a stored image to open it at full size.
- The accepted formats are PNG, JPEG, WebP and GIF. Each section can hold 12 images, each file can be up to 8 MiB, and a save can include up to 32 MiB of new screenshots. Save the plan between larger batches.
- **Original setup** preserves the first saved version of the plan with its images. Timeline updates are dated and can be edited. **Void plan** records an invalidation reason and moves the plan to the past section. **Restore plan** records a separate event.
- In the plan form, choose a playbook and rule version from **Playbook**. In **Linked trades**, select existing trades and positions to include. Search by ticker, entry date or notes. Clear a selection to detach a record previously linked to the plan. Saving a selected trade that belongs to a different plan moves it to this plan. Trade outcomes and trade-level playbook assignments are preserved.
- Choose a plan in the trade or position form. The selector offers plans covering the trade’s local entry day and retains an existing link during edits. Undated plans from older journals stay selectable until you set dates. The link survives closing the position. Use **Edit trade context** on a closed record to change its plan, playbook, checklists or entry timeframe.
- **Plan win rate** divides **Worked** by **Worked + Did not work**. A **Did not work** review requires a reason. **Trade win rate** on the plan page divides winning linked trades by all closed linked trades. Open positions are counted separately and trades without initial risk are excluded from R totals. The narrative comparison uses the original saved setup.
- For a **Missed opportunity**, record the estimated net result in R and the hypothetical closing time after reviewing the setup. Leave the time and result empty while the outcome is pending. Add the estimated initial risk in journal currency to include the plan in the monetary scenario. Missed trade win rate counts positive outcomes among eligible reviewed misses, including zero outcomes in the denominator.
- The all-time performance chart compares the cumulative R of closed trades with initial risk against the same results plus reviewed missed trades. A reviewed miss with an open or closed position linked to its plan is excluded so the same opportunity is counted once. The chart shows the number of exclusions.

### Plan performance

Open **Plans → Plan performance** and choose a breakdown by instrument, playbook version, both together or trade side. Combine the start date, instrument, playbook version, review status and side filters. Unscheduled plans use their local creation date. The start and end dates are inclusive. Select a column heading to sort, and select a group name to open its exact set of plans.

Each row shows the plan count, win rate among decided plans, linked closed trades and actual R. The **With initial risk** count shows how many trades contribute to actual R when the figures differ. **Missed opportunities** counts all plans with that status. **Missed result (R)** sums assessed misses with no linked open position or closed trade. Date filtering chooses plans. Their actual result uses all linked closed trades.

## Playbooks

1. Open **Playbooks → New playbook**. Add an overview, one or more setups, common entry filters and management rules. Short labels appear in checklists. Add a description to explain when a rule is met.
2. Choose a playbook while recording a trade, editing its context, or closing a position. Starting a new trade from a linked plan suggests the plan’s playbook and rule version. Choose a setup to record entry rules. Mark each applicable entry rule and add context for missed rules. Review management when closing a position. Enable or disable each checklist independently.
3. Select **Edit trade context** to connect a past trade. Choose a playbook without a setup or checklist to keep a historical association without recording adherence. Pick a setup and enable a checklist if you have evidence for an assessment.
4. The playbook page shows linked positions, results by setup and rule exceptions with the reasons attached to individual trades. Choose a rules version to inspect its sample. Clean entry and management rates use trades with the corresponding checklist as their denominators.
5. Editing a setup or a rule creates a new version. Existing trade checklists keep their saved rules. Changes to the overview, status and limits use the current version. Retired books remain available through existing links and version history.
6. Set **Closed trades per review** to track review blocks. Add a dated review from the playbook page and attach screenshots. Review progress counts closed trades linked to that playbook.

The trade form compares journal activity at the entry time with any configured limits. Weekly and monthly trade counts use the journal’s local dates. Weekly loss uses realized R from closed trades with initial risk. The original risk limit uses the currency in which you enter trades.

## Statistics

1. Open **Statistics** and set a closing-date range. Filter by instrument, side and account at the top. Expand **More filters** to combine these with a timeframe, entry weekday or hour, closing month or year, playbook, version or setup, session, entry type, holding time, outcome or mistake tag.
2. Pick a factor in **Trade breakdown**. Select any metric heading to sort its rows. Select it again to reverse the direction. A dash marks unavailable metrics and sorts to the end.
3. Select **Show trades** to open the underlying records for a row. The table footer recalculates metrics on the full filtered set. A trade with several mistake tags can appear in multiple rows and counts once in the footer.
4. Expand **Journal statistics** for realized drawdown, win and loss streaks, expectancy, payoff and holding time. Drawdown starts at zero for the filtered sample. Simultaneous closes share one equity point. The streak sequence uses closing time, then opening time and ID when times match.

| Section   | Breakdowns                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Execution | Instrument, side, account, win/loss/flat, order entry type and mistake tags                            |
| Timing    | Entry timeframe, entry weekday and hour, closing month and year, session or kill zone and holding time |
| Strategy  | Playbook total, saved rule version and setup within a version                                          |

### Classify trades for reports

Set **Entry timeframe** on the trade using labels such as M15 or H4. Use **Trade classifications** when opening or closing a position, recording a closed trade, or selecting **Edit trade context** on a past trade. Enter an optional account label, choose a session and entry type, and enter up to ten mistake tags, one per line. Account and mistake grouping is case-insensitive. Choose the session you traded according to your rules. The account label groups results entered in the journal currency. Account balances and transfers are outside the current journal model.

Trades from existing journals appear with their available data. Optional fields that are empty appear under **Unspecified** or **No tags recorded**. Weekdays and entry hours use the device's local time zone, together with the closing period and calendar breakdowns.

### Actual and missed performance

The comparison chart uses the closing-date range for all journal trades and eligible assessed misses. Its **Journal currency** mode uses net P&L and estimates a missed result from net R and the recorded initial risk. The **R multiples** mode uses trades with an initial risk and assessed misses. Both modes exclude any missed plan linked to a position or trade, including a trade outside the selected period.

## Manual backtests

1. Open **Backtests → New backtest** and write the hypothesis and the test conditions. Optionally pin a playbook and rules version.
2. Add a simulated trade. Enter a symbol, side, dates, entry price, initial stop and exit price. Record the costs in R, a note and any screenshots. Use **Edit simulated trade** to correct a saved observation.
3. Liquidation calculates gross R from the price move in the trade’s direction divided by the distance to the initial stop. It deducts the entered costs for net R.
4. Review the session’s win rate and total R. A linked version also shows the actual closed trades recorded under that same version. The comparison includes the count of trades with an initial risk. Simulated trades live in their own collection and appear in Backtests.

## Data location and backup

The default file is `~/.liquidation/journal.json`. To use a different directory, set `LIQUIDATION_DATA_DIR` before starting either server. Use a directory outside the repository. Run one server instance per data directory. Screenshots live in the `screenshots/` subdirectory. A backup is a copy of the entire journal directory taken with the app stopped. Keep that subdirectory with `journal.json` when moving or restoring your journal. To restore, stop the app, preserve a copy of the current directory, and copy the backed-up journal and its screenshots into the configured directory before restarting.

## Repository layout

| Path                                  | Responsibility                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `apps/web/src/app`                    | React shell, routes and browser-persisted Zustand preferences                                    |
| `apps/web/src/features`               | Journal, plans, playbooks, statistics and backtest screens                                       |
| `apps/web/src/shared`                 | Reusable UI, analytics controls, date and number formatting, screenshots and common translations |
| `apps/local-server/src/http`          | Local API handlers and request parsing                                                           |
| `apps/local-server/src/storage`       | Serialized JSON writes and local screenshot storage                                              |
| `apps/local-server/src/records`       | Operations on trades, positions, plans, playbooks and backtests                                  |
| `packages/domain/src`                 | Shared validated contracts and analytics imported through `@liquidation/domain`                  |
| `tests/unit/domain`, `tests/unit/web` | Metric, filter, route and sorting tests                                                          |
| `tests/integration/local-server`      | HTTP, persistence, concurrent write and compatibility tests                                      |
| `.github/workflows/ci.yml`, `.husky`  | GitHub checks and local Git hooks                                                                |

Each module keeps its contracts in `types.ts` and its shared values in `constants.ts`. Put reusable types in the domain package or the web application's `shared` directory according to their consumers. Keep localized labels in `messages.ts`. ESLint requires named constants for text equality checks and string switch cases in production modules, and TypeScript checks type-only imports. Use the schema types when passing records across package boundaries.

## Development checks

| Command                 | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `pnpm format`           | Format source files                              |
| `pnpm format:check`     | Check formatting                                 |
| `pnpm lint`             | Run ESLint with TypeScript and React Hooks rules |
| `pnpm typecheck`        | Check TypeScript types                           |
| `pnpm test`             | Run the Vitest suite                             |
| `pnpm test:unit`        | Run domain and web unit tests                    |
| `pnpm test:integration` | Run local-server integration tests               |
| `pnpm build`            | Compile the production UI                        |
| `pnpm check`            | Run the full quality gate                        |

Husky installs during `pnpm install` in a Git checkout. The pre-commit hook applies ESLint and Prettier to staged files. The pre-push hook runs the full gate. Use `pnpm prepare` to reinstall hooks after initializing Git.

GitHub Actions runs the same gate. Once the project has a GitHub remote and a successful workflow run, configure the `main` ruleset to require a pull request and the **Quality gate** status check. The workflow defines the check. The repository ruleset controls whether GitHub blocks a merge.

## Current scope

The current release supports a single journal currency. The remaining project includes account balances and cash movements, richer trade evidence, reports, notes, report cards, cross-journal search, managed backup and restore, and local AI Review using journal records.

## Web application structure

- `apps/web/src/main.tsx` mounts React.
- `apps/web/src/app` contains the shell and browser-persisted Zustand preferences.
- `apps/web/src/features/journal` owns the journal API, Zustand state, form, table and chart.
- `apps/web/src/features/plans` owns the plan editor, status filters, plan table and scenarios.
- `apps/web/src/features/playbooks` owns strategies, versioned rules, checklists and reviews.
- `apps/web/src/features/statistics` and `apps/web/src/features/backtests` own the analytics and manual test workflows.
- `apps/web/src/shared` contains shared configuration, translations, formatters and UI components.

The Settings dialog lets you switch between English and Ukrainian, dark and light themes, and normal and large text. The journal filters by symbol, side and local closing dates. The table, metrics and cumulative P&L use the same filtered set of closed trades. Trade records are saved by the local server.

## Verification and troubleshooting

For a local QA run, use a temporary data directory and start Liquidation in development mode.

```sh
test_journal_dir=$(mktemp -d)
LIQUIDATION_DATA_DIR="$test_journal_dir" pnpm dev
```

Create a dated plan with two analysis blocks and attach an image. Link a position to that plan and a playbook. Change a management rule before closing the position, then confirm that the close form still shows the rule from the saved version. Set the trade’s account, session, entry type and a mistake tag. In Statistics combine filters, reverse a column sort and open the trades behind a row. In Plans verify the same plan appears in the correct playbook version. Add a simulated trade to a backtest. Reload to verify images, classifications, links and versions. Run `pnpm check` for the formatting, lint, type, domain, HTTP and build checks.

If `nvm use` reports a missing `.nvmrc`, confirm that the terminal is in the project directory and that the checkout includes that file. If `pnpm` works in one terminal but fails in another, compare `node --version` and `pnpm --version` in both. Initialize nvm for the affected shell and select Node 24 there.
