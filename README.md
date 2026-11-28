# Liquidation

Liquidation is a local trading journal. It records trading accounts, money movements, trades, trading plans, playbooks, manual backtests, reviews, learning notes, daily thoughts, weekly watchlists and missed opportunities. It calculates net P&L, win rate, realized R and missed-opportunity scenarios. The UI uses React and TypeScript. Node.js stores the journal on the same machine.

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

### Compact trade ledger

Open and closed trades appear in single-line rows. The main Journal groups closed trades by closing week by default. The grouping selector also supports months, quarters and an ungrouped list. Each period shows its date range, trade count, win rate, net P&L and total realized R. The closing date determines the closed-trade group, while open positions display their entry date and time. Use the page controls below the closed-trade table to show 10 or 20 trades at a time. Group totals and dashboard metrics use the full filtered sample.

Click a row or focus its instrument button and press Enter to open the detail dialog. It provides the full timestamps, account, monetary risk, financial result, prices, realized R, playbook, setup, linked plan, recorded checklist answers and reasons, classifications and notes. The closed-trade outcome uses cost-adjusted net P&L (Win, Loss or BE for an exact zero result). The open-position outcome shows whether a move to breakeven has been recorded. All initial risk values are in journal currency.

Use **Review trade** for the editable associations, checklists, price evidence, screenshots and mistakes of a closed trade. Use **Edit position** or **Close position** to navigate from an open-position dialog to the corresponding full-page form. **Move to BE** and **Restore initial risk** are available directly in the detail dialog. Delete moves a record to Trash after confirmation. The compact ledger is also used on account pages, plan and playbook details, the calendar drill-down, statistics and review reports.

### Open, record and review trades on full pages

1. Select **Record trade** on Journal to log an open position. The entry time defaults to your current local time and can be edited. Record the symbol and direction, select an account, and enter risk as a percentage. The form shows the corresponding 1R in the journal currency. To enter a historical trade, select **Record a closed trade** above the closed-trade table and fill in its closing details.
2. Select the account, plan, playbook and setup. A plan can suggest its linked playbook. Choosing a setup reveals all of its entry rules and the playbook's common filters. Check the followed rules. Each newly recorded unchecked rule requires a nonblank explanation. A position keeps the rule text it was assessed against at entry.
3. Under **Trade screenshots**, attach entry and setup charts. Paste images into the focused drop area, drag files there or choose images. You may reorder them with the arrow buttons or by dragging. Open positions can be edited later to add more evidence.
4. Click the position's row and choose **Close position**. Choose the P&L calculation method and assess management rules. Existing entry evidence and saved explanations remain in the editor. Add exit and review charts, select mistakes and save review notes.
5. Click any closed trade and select **Review trade** to update its context, setup, checklist, prices, chart evidence and review. The details window displays the saved entry and exit galleries. Select a thumbnail to enlarge the image in the journal. Use **Close** or Escape to return to the record. Use the remove control in the editor to detach an image.

Each chart section supports up to 12 PNG, JPEG, WebP or GIF files. Each file can be up to 8 MiB, and one save accepts up to 32 MiB of new images across both sections. Screenshot bytes and their references are stored locally. The close operation preserves the position's identity and entry images. Removing a chart from a trade removes its file once no active or trashed record references it. Moving a trade or position to Trash preserves its images for restoration. Permanently deleting it releases unreferenced images.

Existing trades and positions can be reviewed without any data conversion. Legacy unchecked rules that were saved without reasons remain readable and editable. Newly recorded rule exceptions require a reason. On an older trade with no recorded checklist, the review editor can leave that historic assessment unrecorded.

### Risk and P&L

Enter `0.5` for 0.5% risk. A journal balance of 10,000 USD at entry yields 50 USD of initial risk. The local server uses the account's starting balance, net P&L already realized by entry and movements dated through entry. It records the account, entry balance, percentage and rounded cash amount with the trade. Later movements and closes do not resize that trade. Editing the entry time, percentage or account of an open position recalculates the initial risk. An empty percentage leaves risk unrecorded on a new trade. Existing cash risks remain available for review and closing.

- **From entry, stop and exit prices** calculates the signed exit move divided by the initial stop distance, then multiplies by the saved cash risk. Use this with a full exit and matching initial monetary stop risk.
- **From realized R** multiplies the entered gross R by the cash risk. A result of 2R with 50 USD risk yields 100 USD gross.
- **Enter broker amount** accepts the actual gross result for partial exits, currency conversion or a trade without recorded risk.

Enter commission and swap with their original signs. The preview and saved net P&L add both to gross P&L. A 100 USD gross result with a 2 USD commission charge and a 1 USD swap charge yields 97 USD net.

## Market data on the dashboard

**Today's economic calendar** appears below the daily and weekly review. It shows the current day in the browser's local time zone. The server checks the [biquote calendar](https://biquote.io/docs/#calendar) once per minute while the page is open and shows actual, forecast and previous readings when published. Events marked **All day** use their published date and leave reading cells blank. Releases awaiting a confirmed time show **To be confirmed**. The [Forex Factory weekly export](https://www.forexfactory.com/calendar) provides a cached backup schedule. If both requests fail, the calendar can show the last successful feed with its fetch time. The medium and high impact filter controls visible releases, past scheduled times are dimmed, and the nearest upcoming time is highlighted.

While Liquidation is visible, a toast lists high-impact timed releases when they enter the 15-minute window. Releases scheduled for the same time share a reminder. If the window has already started when you open the app, the toast uses the remaining minutes. **Open calendar** jumps to the calendar. Open position rows show a **News** badge for relevant high-impact releases still ahead today. Matching uses both currencies of an FX pair, maps CNH to CNY, and uses configured currencies for metals, indices and selected futures. The badge lists the releases on hover and highlights the 15-minute window. Untimed events can show a badge without starting a countdown.

After a scheduled release, open **Price move** and select an instrument. It compares the mid-price close immediately before the scheduled time with closes at five and fifteen minutes afterward. The panel shows the difference in FX pips or USD for metals, and in percent. It uses complete one-minute candles from biquote, with complete five-minute candles as a fallback on matching boundaries. Empty windows can indicate an unfinished interval, missing data or a date outside the provider's rolling candle history.

### News reaction history

Liquidation automatically records measurements for timed calendar releases while the local server runs. The server checks for closed five- and fifteen-minute windows once per minute, independently of the browser or its impact filter. It uses the same default instrument as **Price move** for the release currency. For example, it uses EURUSD for USD and EUR releases, GBPUSD for GBP releases and USDJPY for JPY releases. Selecting another instrument in **Price move** also saves it when a candle is available.

Open **News reactions** in the main navigation or follow **News reaction statistics** from the calendar. Use the text, currency, instrument and local release-date filters. Each row groups releases with the same calendar name, currency and instrument. Select the event name to see time, actual, forecast, previous, close before the release and signed moves in both windows. Sort by release count or median absolute percentage move. Each median has its own sample size because a window can be missing. The direction column counts increases, decreases and exact zero moves after 15 minutes. Releases at the same time on one instrument can share a measurement.

In the event details, **Price reaction by forecast result** groups releases above, below and in line with the forecast. It shows the number and share of rises, falls and unchanged moves, along with the signed median move, for each window. Select a group to filter the release list. The **Actual − forecast** column uses the reported unit, such as percentage points for rates. Missing or incompatible readings form their own group. The archive keeps the first comparable actual and forecast it records for an observation.

CNY releases use [USDCNH](https://biquote.io/forex/usdcnh), the US dollar against the offshore yuan, for automatic measurements. A rise in USDCNH means the dollar strengthened against the offshore yuan. Earlier CNY / EURUSD observations are available through **Include earlier CNY / EURUSD comparisons**. Cross-instrument observations are labeled **Comparison**.

On startup the collector checks releases from the previous 24 hours that the calendar still reports. Recovery depends on which candles the provider still has. The history grows from available observations, and the journal's ZIP backup includes it. The server sends only public release times and instrument symbols in candle requests.

The Journal ticker shows the instrument, latest price and daily percentage change when available. **Settings → Market ticker → Ticker instruments** saves up to eight FX and metal symbols in the browser. Clear the selection to hide the ticker. The local server fetches the latest [biquote](https://biquote.io/docs/) mid-prices as one batch every five seconds while the tab is visible. Hover over a price to see its last update. Metals display two decimals, JPY pairs three and other FX pairs five. Hover or focus the strip to pause scrolling, or turn off **Animate ticker** in Settings. The strip is static when reduced motion is enabled.

Both feeds work without API keys. The external services receive the public market-data requests and selected ticker symbols. Trading records, account details and screenshots stay in the local journal.

The header shows a quote of the day. In English the local server fetches the [ZenQuotes daily quote](https://docs.zenquotes.io/zenquotes-documentation/) and caches the result for its local day. Ukrainian uses a local rotation, which also supplies an English reflection when the service is unavailable.

## Accounts and cash flows

Open **Accounts → New account**, choose a broker, prop firm or demo account, and enter its name, opening balance, firm and notes. The first account defines the journal currency (USD by default). Subsequent accounts use that currency, including when aggregating their results. If an older trade already has a free-text account label, creating an account with the same name (case-insensitive) links those trades and positions to the new account automatically. The old label list on Accounts provides a shortcut. On Journal, each active account tile shows the name and current journal balance.

### Associate trades and positions

- Choose **Account** in the trade or position form. You can also leave the record unassigned. For an existing closed trade, use **Review trade** to select or change its account.
- Accounts use stable UUIDs. Renaming one updates its labels on the associated records while keeping the same history and grouping.
- Journal, Statistics, Mistakes and AI Review offer account filters. Active accounts display balances on the dashboard. The Statistics link from an account opens that account's trade selection.
- Archive an account to remove it from new trade selectors. An existing position can still close under its original archived account. Accounts with associated history can be archived. Empty accounts can be moved to Trash and restored.

### Money movements and balance

From an account's details page, select **Add money movement**. Choose deposit, withdrawal/payout, fee or balance correction and enter the effective local date and time. Enter positive amounts for deposits, withdrawals and fees. Corrections accept either sign. Monetary calculations convert amounts to integer cents.

| Figure                                | Calculation                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Balance                               | Opening balance + net P&L + deposits − withdrawals − fees + signed corrections                                        |
| Trading P&L                           | Closed-trade profit + commission + swap                                                                               |
| Trading result after account fees     | Trading P&L − separately recorded account fees                                                                        |
| Initial funding                       | Opening balance + deposits made before or at the first trade entry                                                    |
| Return on initial funding             | Trading result after account fees ÷ initial funding, when funding is positive                                         |
| Drawdown from funded performance peak | The largest realized fall on the initial funding + trading-result curve, in journal currency and relative to its peak |

Money movements affect the account balance without affecting the number of trades, trade win rate or trade-level R. Deposits, withdrawals and corrections stay separate from performance. The balance history groups events with the same timestamp. Account balances are computed as of the current time; future-dated ledger entries take effect when their timestamp arrives. Edit a movement or move it to Trash to correct the ledger.

### Prop-firm risk rules

Enable **Track account rules** to configure the daily loss limit, maximum loss, profit target, minimum trading days and the firm's IANA time zone and daily reset time. Enter limits as monetary amounts or percentages of the initial funding. Maximum loss can use a static floor, a trailing floor or a trailing floor capped at the initial funding. The floor uses realized performance, excluding deposits, withdrawals and corrections after the initial funding.

The daily loss calculation includes closed results and/or recorded open stop risk according to the selected switches. Account fees belong to the firm's day of their occurrence. The Account page reports the remaining room against each configured limit and the room if open stops execute. Positions with unknown risk are identified as incomplete assessments.

When you move an open stop to the entry price, click its row in Journal and select **Move to BE** in the detail dialog. **Restore initial risk** reverses that flag. The initial monetary risk remains available for the final R calculation. Account rule figures are journal estimates based on recorded closed results, fees and stop risk. Use the broker or firm's live equity and rule definition for official limit compliance.

### Trade prices and setup evidence

Expand **Prices and excursions** in a trade or position form to record entry, initial stop and take-profit prices. For a closed trade you can also record exit, most favorable and most adverse price. The optional **Stop moved to entry** flag is saved with the trade. Geometry is validated by direction when the relevant entry price is known. Statistics calculates planned R:R, gross price R, MFE, MAE and giveback from MFE from measured records. Financial net R continues to use the recorded monetary risk and actual P&L.

## Dashboard and daily/weekly review

Dashboard cards follow the journal filters. The net P&L and drawdown lines use closed trades in chronological order. The profit-factor ring compares the sum of profitable net results with the magnitude of losing net results. The win-rate semicircle shows the counts of winning, losing, and exactly breakeven trades. The average-trade bar compares the average win with the magnitude of the average loss.

The dashboard's **Today's thoughts** and **This week's thoughts** views hold market observations, news and events, expectations, screenshots and tasks. Daily and weekly entries are stored independently. Check or uncheck a task from the read view to save it immediately. Active plans are non-voided plans in **Waiting** or **In progress**. Each active plan shows its instrument and status, including past-dated plans still awaiting an outcome.

**Daily review** and **Weekly review** summarize their saved DRC or WRC with the process grade and notes, P&L, closed trade count, opportunity grade and overview. A written P&L on the card takes precedence over the calculated value. The review uses the same trade periods as the full cards. The plus tile opens the corresponding editor when a card is missing.

On wide screens, the review sits below today’s thoughts. The weekly watchlist and active plans form a separate column. Both columns stack on narrow screens.

The P&L calendar opens on the month of the most recent trade close or open-position entry in the filtered sample. Use the month arrows or **This month** to navigate. Green and red mark positive and negative net P&L on days and weeks with closed trades. Purple marks periods that have closed trades and zero net P&L. Closed trades show their symbol and net P&L on the closing date. Open positions show their symbol and remaining stop risk on the entry date. A stop moved to entry has zero remaining risk. A day shows up to three records and a count of further entries. Select a day to inspect all its records and open the DRC. Weeks start on Monday and weekly totals cover dates in the displayed month. The daily and cumulative P&L charts use closed trades. Journal date filters match closing dates for closed trades and entry dates for open positions in the calendar.

### Thoughts and tasks

1. On the dashboard choose **Today** or **This week**, then select **Write thoughts** or **Edit thoughts**. Add text, screenshots or tasks without recording a trade or plan.
2. Save the entry. Each checkbox saves directly from the dashboard or the entry page.
3. Open **Thoughts and tasks** in the navigation to choose a date and view daily or weekly history.

### Weekly watchlist

1. Use **Create watchlist** from the journal or **Weekly watchlist** page. When this week's list already exists, the main action starts the week after the latest saved list. To select a particular empty week, move to it with the date field and use its creation action. Each week runs Monday through Sunday in the browser's local calendar.
2. Write the weekly outlook. Search the instrument catalog or type a custom symbol and select **Add asset**. Each symbol appears once per week. Record its market narrative, levels, conditions and screenshots.
3. Expand **Linked plans** on an asset. The selector lists available plans for that symbol covering at least one day of the week, as well as unscheduled plans. Existing links remain visible. Select the plans you intend to track, or create a plan in another tab and choose **Refresh plans**.
4. At the end of the week, set an outcome for each asset and write its review. Outcomes include **Awaiting review**, **No setup**, **Opportunity observed**, **Traded** and **Missed opportunity**. Save a weekly conclusion and an optional A–F grade. The read view shows closed-trade P&L and count for entries made that week, positions from the week that remain open, and recorded missed entries per symbol.
5. The latest prepared week opens in full. Select a date from the compact history to revisit it. Each history row shows reviewed assets, worked plans among linked plans with an outcome, recorded missed entries, mistakes, P&L and the saved grade. Mistake counts and P&L use closed trades opened that week in watched instruments. A dash marks a metric without data. On the dashboard, the preview follows the current calendar week.

## Best Trades, Lectures and Notes

- **Best Trades** shows a table of examples with date, ticker, market, style, timeframe, model, playbook, planned RR and type. Choose **Add from journal** to select a closed trade or **New example** to create a standalone study. Linked examples use the trade's entry date and available classifications and planned RR. The editor supports overrides and separate analysis sections for each timeframe. Add text and charts to each section, then open the ticker in the table to expand the saved sections. You can also feature a closed trade from a report card. Standalone examples are stored separately from journal trades and statistics.
- **Lectures** groups individual lectures under **Course / block**. Type a group name or select a previous one. Give each lecture its own title and optional source link. Add and reorder text and image blocks. Choose a file, paste an image while the drop area is focused, or drop it in an image block. An image block can include a caption.
- **Notes** keeps standalone text entries with source links and image attachments. Cards use a uniform height with a short preview. Open a card to read its full text. Add images in the editor by choosing files, pasting them into the drop area, or dragging them in. Select a thumbnail to view the image inside the journal.
- **Topic** and **Author or community** appear by the title on Notes and Lectures. Choose a topic and enter an author or reuse a name from the journal. Search the collections by title, content, topic or author. Combine the search with the two filters and sort by last update in either direction. Open records to edit or delete them. Restore deleted entries in **Trash**.

## Trading plans and missed opportunities

Open **Plans** to create a market narrative and an execution plan for a day or a date range. **Waiting** is the default status. Choose another status in the plan form while creating or editing it. Select the plan name to open it, **Edit** to change its fields, or the status badge to go straight to the review fields.

- **Active and upcoming** contains plans in **Waiting** or **In progress**, including those whose date range has ended. **Past plans** contains plans with a recorded outcome or a void action. Plan dates apply to search filters and trade-link eligibility. **Narrative** shows the market outlook and **Side** shows the planned trade direction. The list uses `DD.MM.YYYY` dates and icon actions for editing and moving plans to Trash. **Result** displays the total realized R of linked closed trades with measured risk. A dash indicates that no realized R is available.
- Add an analysis block for each timeframe. Attach screenshots to the analysis, execution plan, timeline entries or post-session review. Paste from the clipboard while the screenshot area is focused, drop images from your file manager or use **Choose images**. Reorder screenshots by dragging them or using the arrow buttons. Select a thumbnail to view the image inside the journal.
- The accepted formats are PNG, JPEG, WebP and GIF. Each section can hold 12 images, each file can be up to 8 MiB, and a save can include up to 32 MiB of new screenshots. Save the plan between larger batches.
- **Original setup** preserves the first saved version of the plan with its images. Timeline updates are dated and can be edited. **Void plan** records an invalidation reason and moves the plan to the past section. **Restore plan** records a separate event.
- In the plan form, choose a playbook from **Playbook**. In **Linked trades**, select existing trades and positions to include. Each row shows the side beside the ticker and the entry time as `DD.MM.YYYY · HH:MM`. Search by ticker, entry date or notes. Clear a selection to detach a record previously linked to the plan. Saving a selected trade that belongs to a different plan moves it to this plan. Trade outcomes and trade-level playbook assignments are preserved.
- Choose a plan in the trade or position form. The selector offers plans covering the trade’s local entry day and retains an existing link during edits. Undated plans from older journals stay selectable until you set dates. The link survives closing the position. Use **Review trade** on a closed record to change its plan, playbook, checklists or entry timeframe.
- **Overall plan win rate** divides the number of plans marked **Worked** or **Worked without my entry** by all saved plans. For example, 12 confirmed scenarios out of 20 saved plans produces 60%.
- **Reviewed plan win rate** divides confirmed scenarios by the sum of confirmed scenarios and plans marked **Did not work**. With 12 confirmed, three failed and five awaiting a worked/failed decision, this figure is 80%. A **Did not work** review requires a reason. Saving a completed outcome moves the plan to **Past plans** even if its original period has days left.
- **Trade win rate** on the plan page divides winning linked trades by all closed linked trades. **Realized plan win rate** counts plans with a positive aggregate closed net P&L divided by plans with at least one closed trade. Open positions are counted separately and trades without initial risk are excluded from R totals. The narrative comparison uses the original saved setup. Overall plan cards use the full active plan collection regardless of list filters; grouped analytics show both all-plan and reviewed-plan rates for each selected cohort.
- For **Missed opportunity** and **Worked without my entry**, you can record the estimated net result in R and the hypothetical closing time after reviewing the setup. Leave the time and result empty while the outcome is pending. Add estimated initial risk in journal currency to include the plan in the monetary scenario. Missed trade win rate counts positive outcomes among eligible reviewed misses, including zero outcomes in the denominator.
- The all-time performance chart compares the cumulative R of closed trades with initial risk against the same results plus eligible assessed missed opportunities from plan reviews and individual journal entries. The chart shows exclusions and which plan estimates are superseded by journal entries.

### Recording a missed trade

1. Select **Missed trades** at the top of Journal or in a DRC/WRC and choose **Add missed trade**. The report shows missed entries within its calendar dates. The Journal lists the full history.
2. Enter the market, direction, missed entry time, reason and context. Choose a reason such as fear, distraction, timing, hesitation, execution or other. Attach a chart if useful. Link an existing plan for the same symbol and direction if the missed trade belongs to that plan. One active missed entry can be linked to each plan.
3. Leave the hypothetical outcome pending until you can assess the setup. Edit the saved entry, enable **Reviewed hypothetical outcome**, and enter its hypothetical exit time and estimated net R, including trading costs if applicable. Negative and zero outcomes are supported. Optionally enter the initial monetary risk you intended to use.
4. The panel shows the recorded opportunities, reviewed net R and monetary estimate. With an estimated risk of 25 and a net result of 2R, the hypothetical P&L is 50 in the journal currency. An assessed entry without a monetary risk value contributes to the R total and has an unavailable monetary estimate. Edit or delete each entry independently of its report card.

### Reviewing exits at break-even

In **Missed trades**, choose **Worked after BE** if price reached the planned target after the BE exit, or **BE avoided the original stop** if price reached the original SL first. Record the time of the BE exit and add a chart if you have one. Both outcomes can be linked to the relevant plan.

To estimate an effect, enter the time price reached the target or original stop and the absolute difference in R between the actual exit and the estimated net result with the original stop, including costs. Enter the original monetary risk to calculate the difference in journal currency. The comparison counts all saved cases and shows how many have each estimate. The net effect subtracts foregone profit from avoided losses. For example, 2R in foregone profit and 1R in avoided losses gives a net effect of −1R. The journal shows these estimates in the BE comparison alongside the missed-entry history.

### Plan performance

Open **Plans → Plan performance** and choose a breakdown by instrument, playbook, both together or trade side. Combine the start date, instrument, playbook, review status and side filters. Unscheduled plans use their local creation date. The start and end dates are inclusive. Select a column heading to sort, and select a group name to open its exact set of plans.

Each row shows the plan count, win rate among decided plans, linked closed trades and actual R. The **With initial risk** count shows how many trades contribute to actual R when the figures differ. **Missed opportunities** counts plans marked **Missed opportunity** or **Worked without my entry**. **Missed result (R)** sums eligible assessed misses for those plans, including their linked missed-entry records when present. Date filtering chooses plans. Their actual result uses all linked closed trades.

Open **Missed trades** from the journal to see recorded opportunities with their estimated R and potential P&L grouped by instrument and reason. Click a ticker to see the full notes and screenshots. Opportunities with actual execution through a linked plan are kept in the list and excluded from the potential result. Break-even reviews have their own summary.

## Playbooks

1. Open **Playbooks → New playbook** and choose **Standard**, **Backtest strategy** or **BTA community strategy**. Add an overview, one or more setups, common entry filters and management rules. Short labels appear in checklists. Add a description to explain when a rule is met.
2. Choose a playbook while recording a trade, editing its context, or closing a position. Starting a new trade from a linked plan suggests the plan’s playbook. Choose a setup to reveal its rules and common filters automatically. Check each rule that was followed and explain each unchecked rule. New entries require their displayed checklist, and position closing records the management checklist. Historical associations can retain an unrecorded assessment when evidence is unavailable.
3. Select **Review trade** to connect a past trade. Choose a playbook without a setup or checklist to keep a historical association without recording adherence. Pick a setup and record its rules when you have evidence for the assessment. A previously unrecorded historical checklist can be left unrecorded.
4. The playbook page shows linked positions, results by setup and rule exceptions with the reasons attached to individual trades. Clean entry and management rates use trades with the corresponding checklist as their denominators.
5. Editing a setup or a rule updates the playbook. Existing trades keep their recorded checklist rules and exceptions. Retired books remain available through existing links.
6. Set **Closed trades per review** to track review blocks. Add a dated review from the playbook page and attach screenshots. Review progress counts closed trades linked to that playbook.

The list is a compact table of playbooks, templates, status, trade count, win rate, net P&L, R and review progress. Search by title or overview and filter by status. Open any book for its rules, results and reviews.

### Images and setup examples

In every playbook template, use **Playbook images** in the overview and **Setup examples** inside each setup. Attach PNG, JPEG, WebP or GIF charts using the chooser, paste or drop. Reorder or remove images while editing. Each section accepts up to 12 images, with the same file and save limits as plan screenshots. The strategy templates also have their own illustrated trading models, chart studies and management examples.

The trade form compares journal activity at the entry time with any configured limits. Weekly and monthly trade counts use the journal’s local dates. Weekly loss uses realized R from closed trades with initial risk. The original risk limit uses the currency in which you enter trades.

### Backtest strategy template

The strategy editor groups the document into nine sections. The section index jumps to the corresponding part of the editor or the saved playbook.

| Section             | Contents                                                                          |
| ------------------- | --------------------------------------------------------------------------------- |
| Trading instruments | Symbols from the catalog or manually entered symbols                              |
| Trading routine     | Notes for each weekday, primary sessions and additional sessions                  |
| Trading disciplines | Timeframe, workflow and market structure or signals                               |
| Trading plan        | Criteria and descriptions                                                         |
| Trading models      | Operating, direction, entry and confirmation models, local screenshots and setups |
| Entry criteria      | Technical checklist and psychological criteria                                    |
| Decision workflow   | Ordered steps with separate Yes and No destinations                               |
| Risk management     | Rules, forecast inputs, projected results and trading limits                      |
| Position management | Management checklist and illustrated execution scenarios                          |

Open a playbook to see its models, rules and illustrations. Link the playbook in **Backtests** to record simulated trades against it.

The forecast estimates trade count from the configured weekly or monthly frequency and months in market. It uses fixed monetary risk on starting capital, with expectancy in R calculated as win probability × average win R − loss probability. Projected return multiplies expectancy by trade count and risk percentage. Actual results use the journal's recorded trades.

### BTA community strategy template

The third template is an editable strategy workspace guided by the section structure of the public [BTA strategy for community](https://btatrading.notion.site/strategy-for-community). It contains sixteen indexed sections, with the standard rule workflow shared by the other templates. Fill in your own descriptions, criteria and examples.

| Sections                                    | Contents                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Scope, instruments and routine              | Strategy scope, primary and additional assets, weekdays, sessions and opening windows         |
| Disciplines, plan and directional context   | Timeframe workflow, market structure, trading-plan conditions and intraday direction criteria |
| Models, entry criteria and principles       | Trading models, illustrated examples, technical checklists, psychology and principles         |
| Risk, position management and decision flow | Risk rules, forecast inputs, limits, position scenarios and decision branches                 |
| Chart examples, journal and tools           | Illustrated charts, review routines, resources and tools                                      |
| Self-control                                | Self-assessment, emotional checklist and illustrated psychology cases                         |

Save the document to review its criteria and charts on the details page. The chart examples and psychology cases use the same local screenshot storage as trading models and management scenarios. Use **Backtests** to test the playbook and attach it to journal trades and plans through the playbook selector.

## Statistics

The Statistics page opens in **Overview**, with individual sortable tables inspired by the factor-by-factor structure of the Forex Dashboard reference. The same filtered trade sample powers each table. The journal’s data and account definitions supply their rows.

### Find a selection

1. Set the closing-date range and account. The end date includes the entire local day.
2. Expand one of the three filter categories below. Choose the desired values using its dropdown fields. Each additional selection must match the trade (AND logic). **All values** clears that factor. **Unspecified** includes records without a value for it.
3. The active-filter chips show the applied conditions. Select a chip to clear just that condition. **Clear filters** clears the dates and all additional filters. The statistics link on an account initially selects that account.

| Filter category    | Available dimensions                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Market & execution | Instrument, side, win/loss/flat, entry type and mistake tags                                                               |
| Time & session     | Entry timeframe, entry weekday and hour, calendar month of closing and closing year, session or kill zone and holding time |
| Strategy & setups  | Trading style, playbook and setup                                                                                          |

### Read, sort and inspect results

- **Overview** displays separate tables for trading accounts, instruments, side, entry type, sessions, weekdays, entry timeframes, months, years, models/setups, playbooks and trading styles. Tables pack into responsive columns. The accounts panel and an expanded group of trades span the full section width. The dedicated **Mistakes** page covers mistake analysis. Tables show closed trade count, WR, net P&L, actual RR and total R. The account table shows opening and current balances in addition to count, WR, P&L and RR. Account balances come from the entire account ledger as of the current time. The trade columns use the selected sample. Legacy account labels display their recorded trade statistics with unavailable balances.
- **Trade breakdown** provides a detailed table with a single grouped **Group trades by** selector, with all 17 factors. It adds profit factor and expectancy per trade to the financial metrics. Changing the grouping preserves the selected filters.
- Click a metric or group heading to sort. Click the same heading again to reverse its direction. Undefined metrics sort last. Weekdays and month-of-year rows sort in calendar order. Year rows show the latest year first. The month-of-year table combines the same month across every year; combine month and year filters for a particular calendar month. Separate chronological period summaries keep their year context.
- Check any rows within a factor table to calculate a selected subtotal alongside its filtered total. Use the header checkbox to select or clear all groups. Ratios are recalculated from the underlying trades, and a trade that belongs to several selected groups counts once. The period, risk distribution, BE and rule-exception groups also provide selected subtotals.
- Click a group name in Overview or **Show trades** in Trade breakdown to reveal the records behind that row. Click any trade to open its full details. Fixed classifications such as weekdays, directions, sessions and entry types also show empty groups with zero trades. The footer calculates metrics on the full filtered sample. A trade with several mistake tags can contribute to several tag rows, while the total counts each trade once.

### Understand the figures

Hover or focus the information icons to read the relevant explanation, and hover over a sortable metric heading for its definition. Expand **Metric definitions** to read the complete glossary. The **Guide** in the navigation opens a bilingual reference to each major journal workflow, all grouping factors and metric formulas.

| Metric     | Definition                                                          |
| ---------- | ------------------------------------------------------------------- |
| WR         | Net-positive closed trades ÷ all closed trades                      |
| Net P&L    | Gross profit + signed commission + signed swap                      |
| PF         | Sum of positive net results ÷ absolute sum of negative net results  |
| RR         | Mean positive net result ÷ absolute mean negative net result        |
| Expectancy | Net P&L ÷ closed trade count                                        |
| Total R    | Sum of net P&L ÷ recorded positive initial risk for measured trades |

PF can be infinite when gains exist and losses do not. RR requires both wins and losses. A dash indicates an unavailable metric. Expand **Journal statistics** for realized drawdown, win and loss streaks, expectancy, payoff and holding time. Drawdown starts at zero for the filtered sample. Simultaneous closes share one equity point. The streak sequence uses closing time, then opening time and ID when times match.

The actual-versus-potential opportunity scenario uses all trades and assessed missed opportunities within the selected closing-date range. Account and other trade filters apply to the performance analytics and are identified as such on the page.

### Classify trades for reports

Set **Entry timeframe** on the trade using labels such as M15 or H4. Use **Trade classifications** when opening or closing a position, recording a closed trade, or selecting **Review trade** on a past trade. Select an associated account, enter an optional trading style, choose a session and entry type, and select up to ten mistake labels in **Trade review**. Use the preset catalog, existing labels or add a custom one. Mark any selected label critical, add review notes and mark a mistake-free trade as reviewed. Trading style, legacy account labels and mistake grouping are case-insensitive. Associated accounts group by their stable IDs. Choose the session you traded according to your rules.

Trades from existing journals appear with their available data. Optional fields that are empty appear under **Unspecified** or **No tags recorded**. Weekdays and entry hours use the device's local time zone, together with the closing period and calendar breakdowns.

### Trading insights and historical selection tests

Select **Trading insights** in Statistics to generate a fully local report from the currently filtered closed trades. It examines instruments, direction, accounts, weekdays, sessions, timeframes, entry hours, month of year, year, entry type, holding time, trading style, playbook and setup. Each group shows count, win rate, net P&L, net expectancy, measured average R and profit factor.

Profitable and losing groups are displayed separately. A group with fewer than 20 trades is flagged as a small sample. The strongest and weakest headline groups require at least 20 trades and a comparison group in the sample. The ranking uses average monetary net result per trade; the measured R column helps compare different risk sizes. Choose a single factor or inspect all factors. The optional AI Review remains available for broader questions.

Select **Test keeping** or **Test exclusion** to recalculate the actual historical sample with one group rule. Check multiple rows and test the selected groups to retain or remove any trade matching at least one of them. Overlapping groups never count the same trade twice. The comparison includes trade count, WR, P&L, profit factor, expectancy, risk coverage, realized drawdown and losing streak. Expand **Trades retained** and **Trades excluded** to inspect those decisions. These are in-sample historical hypotheses for future observation or independent backtesting.

In **Statistics → All trades**, sort and page through all closed trades that match the active filters. **Test** records whether price returned to the planned level for a limit entry. The actual order type is recorded separately. Select a ticker to open the trade details.

## Mistake analytics

1. Click a closed trade, open **Review trade** and select observed mistake tags. Use the built-in catalog or add your own label. Tags use case-insensitive identity. Mark a selected mistake critical when it violates an essential rule of your strategy or risk process.
2. Write a short reflection and action for the next session. If the trade had no mistakes, mark **Review completed**. Previously saved nonempty mistake tags count as reviewed; older records without tags or an explicit review flag remain unreviewed.
3. Open **Mistakes** from navigation. Set an inclusive local closing-date range or account filter. Review coverage, unique affected trades, occurrence totals, critical trades and recurring mistake types appear at the top.
4. The sortable mistake table lists each label, count, critical occurrences, share of reviewed trades, associated net P&L and losses. A trade may contain several different mistake tags, so per-tag counts can overlap. Financial figures describe associated historical trades.
5. Compare the latest 20 reviewed closed trades with the preceding 20. A trend uses each sample's actual reviewed-trade count. An increase or decrease is expressed in percentage points. If no previous reviewed sample exists, the trend is unavailable. Partial samples are marked by their denominators.
6. Select a mistake row or the **Mistake focus** dropdown. The monthly frequency chart, local closing-day/year-month history and entry weekday breakdown update for that tag. The frequency is the percentage of reviewed trades in the period containing the selected tag (or any tag when no focus is selected). Click a group to inspect its trades.

The mistake month history preserves both year and month so changes over time remain visible. Month-of-year in the general Statistics overview combines years. Unreviewed trades are included in the closed count and review coverage, while mistake frequency uses reviewed trades. Critical status is an explicit review annotation.

### Advanced analytics

The selected trade sample also powers the cumulative cash and R curves, seven R distribution buckets, the R drawdown with peak, trough and recovery dates, and the period table. Select an R bucket or a day/week/month/quarter/year row to inspect the underlying trades. The distribution and R drawdown have a measured-risk denominator. The **Losses of 1.2R or worse** section uses net R including commissions and swap, and sums the excess loss beyond 1R.

The prices table reports the sample size for each individual price metric. The BE table distinguishes trades with a recorded stop-to-entry move and trades with no such move recorded. Rule adherence uses the recorded rules and checklists, with a list of results on trades that recorded each rule exception. The selection-comparison table compares the current filtered set with other closed journal trades. Profit factor is always displayed with two decimal places when finite.

### Actual and missed performance

The comparison chart uses the closing-date range for all journal trades and eligible assessed misses, with hypothetical closing dates for the misses. Its **Journal currency** mode uses net P&L and estimates each missed result by multiplying net R by recorded initial risk and rounding to cents. The **R multiples** mode uses trades with initial risk and assessed misses. Missing monetary risk is reported separately. Both modes include possible losses and exclude opportunities linked to a plan with an active open position or closed trade, including trades outside the selected period.

A missed-trade entry linked to a plan takes precedence over that plan's hypothetical estimate across the scenario, even while the linked entry's outcome is pending. Independent missed entries contribute their own estimates. This keeps each linked opportunity represented once and ensures that actual P&L, trade count and the actual win rate continue to use closed journal trades. Plans uses the same all-time scenario in R, while Statistics can show either journal currency or R over a selected period. The estimate is a historical what-if calculation based on the recorded outcomes.

## Reviews

Open **Cards** for the quarter calendar of DRC and WRC. Weeks are assigned to the quarter containing their Thursday, keeping each week in a single calendar. The daily cells use closes for their P&L and show days with trades and no card. The weekly column uses trades entered in that week and counts its still-open positions. Select a day or week to open or write its review.

Open **Reports** for the monthly and quarterly review history. Rows summarize the recorded periods and current period with trades, P&L, win rate, realized R, expectancy, drawdown and coverage of trading-entry days by DRCs. Select a period to read or create its review. Period reviews also show the actual best and worst trade by R, account breakdown, missing DRC days, R distribution, curves, price evidence and rule adherence.

| Review            | Trade cohort                                                                                                | What you can record                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| DRC               | Closed trades on the selected local day set the P&L. Positions held during that day can be graded.          | Process grade, opportunity quality, focus, process, lessons, mistakes, trade assessments and best trade |
| WRC               | Trades entered Monday through Sunday set the P&L once closed. Positions held during the week can be graded. | The same assessments, progress from 1 to 10, missed opportunities and the key lesson                    |
| Month and quarter | Trades closed in the selected calendar period and preceding period                                          | Conclusions and next-period focus alongside metrics, mistake tags and recorded missed plans             |
| Last 20 trades    | The 20 most recent closes and the 20 closes immediately preceding them                                      | Compare net P&L, win rate, expectancy, average R, drawdown and clean entry rate                         |

Open DRC and WRC from the daily/weekly review panel, or choose a date in **Reviews**. A saved card opens in read mode. Use **Edit** to update the text and assessments. A position's recorded grade remains linked after it closes. Calendar and review dates use the browser's local time zone. Monthly and quarterly comparisons use each period's available trades and can include a partial current period. Last-20 deltas appear when both samples contain 20 trades. **Clean entries** uses trades with saved entry checklists. **Trades with risk** shows the sample size behind the R metric.

The review editor starts with the date, process grade, calculated net P&L and opportunity quality. Write the focus, trading process, lessons and errors in the full-width process section. Use the best-trade and assessment sections for the trading examples. Finish with the review summary and optional chart images. An optional written P&L keeps a manually recorded tally separate from the calculated journal P&L. The trading sections stand side by side on wide screens and stack on smaller ones.

Every calendar-period review has a **Missed trades** section. Save missed entries there independently of the review's text. Review outcomes later, and find the same entries in the Journal and the potential-performance scenario.

## AI Review

1. Open **AI Review** and choose the last 7, 30 or 90 calendar days, or enter a custom range. The inclusive period uses local closing dates. Filter a single trading account (or historical label) or use the combined journal totals.
2. Check the key metrics and switch between symbol, side, side by symbol, weekday, entry hour, closing month and holding-time tables. Open positions appear as a separate count. The journal uses one currency for all monetary values.
3. Select a question or apply a rule in **What if?** to compare the same closed trades. The simulator supports one or two symbols, entry-hour cutoffs, a minimum holding period, stopping after the first realized loss of a local day, and selecting trades that followed at least two consecutive losses. It lists individual exclusions when there are at most 15. Use **Download Markdown** to export the tables, observations, and the current comparison.
4. After starting the optional local model, select **Generate hypotheses** to add Ukrainian commentary. Numeric metrics come from the journal calculation code. Groups with fewer than 20 trades are marked as small samples.

Each result uses gross profit plus commission and swap. R uses the initial risk entered on each trade, and the report shows the size of the measured sample. The near-break-even count includes zero net results and results with magnitude below 0.1R. For trades without a risk value it uses 10% of the selected sample's average loss. Drawdown and lowest cumulative P&L use the closed-trade curve from zero. Account balances and funding-based percentage returns are available on Accounts and use their dedicated ledger.

The daily loss rule stays separate by account and uses only losses from retained trades that closed strictly before the next entry. Entries at the exact close timestamp stay eligible because the event order is unknown. The losing-streak scenario selects entries against the sequence of actual closes in the original sample.

### Start Ukrainian hypotheses on macOS

The report and simulator work with the regular `pnpm dev` command. To generate model commentary, install llama.cpp from [its Homebrew formula](https://formulae.brew.sh/formula/llama.cpp) and save an instruction-tuned GGUF file to disk. The following setup uses [Qwen3 4B Instruct in Q4_K_M](https://huggingface.co/lmstudio-community/Qwen3-4B-Instruct-2507-GGUF/blob/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf).

```sh
brew install llama.cpp
mkdir -p "$HOME/Models"
curl --fail --location \
  --output "$HOME/Models/Qwen3-4B-Instruct-2507-Q4_K_M.gguf" \
  https://huggingface.co/lmstudio-community/Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf
```

Start the model in a terminal and keep it running.

```sh
llama-server --offline --host 127.0.0.1 --port 17840 \
  --model "$HOME/Models/Qwen3-4B-Instruct-2507-Q4_K_M.gguf" \
  --alias liquidation-review --ctx-size 8192 --parallel 1
```

In another terminal, start Liquidation from its repository root.

```sh
nvm use
LIQUIDATION_AI_REVIEW=1 pnpm dev
```

For a production build use `pnpm build` followed by `LIQUIDATION_AI_REVIEW=1 pnpm start`. Open **AI Review**, choose dates with recorded trades, then select **Generate hypotheses**. If the model is still loading, wait for its readiness check to pass with `curl --fail http://127.0.0.1:17840/health`.

Liquidation sends code-generated group identifiers and aggregate metrics to the offline server at `127.0.0.1:17840`. The request omits notes, screenshots, account labels, trade IDs, timestamps and instrument names. Model responses must refer to a valid group in the current report. The journal stays in its local data directory. For runtime flags and API details see the [llama-server documentation](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md).

## Manual backtests

1. Open **Backtests → New backtest** and write the hypothesis and the test conditions. Optionally link a playbook.
2. Add a simulated trade. Enter a symbol, side, dates, entry price, initial stop and exit price. Record the costs in R, a note and any screenshots. Use **Edit simulated trade** to correct a saved observation.
3. Liquidation calculates gross R from the price move in the trade’s direction divided by the distance to the initial stop. It deducts the entered costs for net R.
4. Review the session’s win rate and total R. A linked playbook also shows the actual closed trades recorded under that playbook. The comparison includes the count of trades with an initial risk. Click a simulated trade’s ticker to open its own page with prices, notes and screenshots.

## Data location and backup

The default file is `~/.liquidation/journal.json`. To use a different directory, set `LIQUIDATION_DATA_DIR` before starting either server. Use a directory outside the repository and run one server instance per data directory. Screenshots live in the `screenshots/` subdirectory.

### ZIP backup and restore

1. Open **Settings → Journal backup → Download backup**. Save the ZIP to the location you want to use for backups. It contains the journal, its referenced screenshots, news reactions and records in Trash.
2. Choose **Restore from backup** and select a ZIP created by Liquidation. The local server validates the archive and displays its date, record counts and any missing screenshots.
3. Review the preview and select **Replace local journal** to apply the backup. A preview is valid for 30 minutes and applies to the journal state at the time it was checked. If you edit the journal in the meantime, select the ZIP again.
4. Liquidation saves the previous journal as a separate ZIP under `backups/` in the data directory. Use **Download the pre-restore backup** after restoring or find the `liquidation-before-restore-*.zip` copy in that directory. To undo the restore, select this copy through the same restore flow.

The ZIP is processed on the local server. The maximum archive and unpacked sizes are 8 GiB each. For a manual copy of the journal directory, stop the server and keep `journal.json` together with `screenshots/`.

### Deleting and restoring records

The **Delete** action is available for closed trades, open positions, plans, playbooks, backtests, notes, lectures, best-trade examples, review cards, daily/weekly market review entries, daily thoughts, weekly watchlists, missed entries, account cash movements and empty accounts. Confirm **Move to trash** to remove an active record. In Plans, Delete is also available directly in each table row next to Edit. Statistics use active trades and eligible active missed records. Related records retain their historical references and show the deleted plan, playbook or trade as **In trash**. Images and saved playbooks stay with the recoverable record.

Open **Trash** from the navigation and select **Restore** to return a record to its original collection. If a newer record occupies the same date or identity, move that record to trash before restoring the earlier one. Restoring a missed trade also requires its linked plan to have no other active missed entry. Changing a record in another open tab can require a refresh before a delete or save. The trash is included in `journal.json` and its backups. Select **Delete permanently** and confirm to remove a trash entry. The server refuses permanent deletion while an active or trashed record still references it, preserving the journal’s associations. Images that lose their final reference to any saved record or preserved illustration are removed from the screenshot folder after the journal update.

## Repository layout

| Path                                  | Responsibility                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `apps/web/src/app`                    | React shell, routes and browser-persisted Zustand preferences                                    |
| `apps/web/src/features`               | Journal, plans, playbooks, reviews, mistakes, learning, statistics and backtest screens          |
| `apps/web/src/shared`                 | Reusable UI, analytics controls, date and number formatting, screenshots and common translations |
| `apps/local-server/src/http`          | Local API handlers and request parsing                                                           |
| `apps/local-server/src/storage`       | Serialized journal writes, screenshot storage and ZIP backup/restore                             |
| `apps/local-server/src/records`       | Operations on trades, positions, plans, playbooks, backtests and workspace records               |
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

The current release supports multiple accounts in one journal currency. Trading views use the journal's recorded trades, rules, and screenshots.

## Web application structure

- `apps/web/src/main.tsx` mounts React.
- `apps/web/src/app` contains the shell and browser-persisted Zustand preferences.
- `apps/web/src/features/accounts` owns account creation, ledger, risk rules and trade account selection.
- `packages/domain/src/accounts` owns account contracts, computed balances, funding and firm-day risk.
- `apps/web/src/features/journal` owns the journal API, Zustand state, form, table and chart.
- `apps/web/src/features/plans` owns the plan editor, status filters, plan table and scenarios.
- `apps/web/src/features/playbooks` owns strategies, rules, checklists and reviews.
- `apps/web/src/features/statistics` and `apps/web/src/features/backtests` own the analytics and manual test workflows.
- `apps/web/src/features/review` owns the local report, Markdown export, model interaction and rule comparisons.
- `apps/web/src/features/workspace` owns review cards, recent-trade comparisons, lectures, notes, featured trades, daily thoughts, watchlists and missed-entry forms.
- `apps/web/src/features/trash` owns the reusable confirmation and restoration workflow.
- `packages/domain/src/workspace` owns workspace record contracts and date and cohort calculations. `packages/domain/src/journal/trash` owns recoverable record contracts.
- `apps/web/src/shared` contains shared configuration, translations, formatters and UI components.

The Settings dialog lets you switch between English and Ukrainian, dark and light themes, and normal and large text. The journal filters by symbol, side, account and local dates. The closed-trade table, metrics and cumulative P&L use closing dates. The calendar filters open positions by entry date. Trade records are saved by the local server.

## Verification and troubleshooting

For a local QA run, use a temporary data directory and start Liquidation in development mode.

```sh
test_journal_dir=$(mktemp -d)
LIQUIDATION_DATA_DIR="$test_journal_dir" pnpm dev
```

Create a dated plan with two analysis blocks and attach an image. Link a position to that plan and a playbook. Change a management rule before closing the position, then confirm that the close form still shows the rule recorded at entry. Attach entry and exit screenshots, select the trade’s account, session and entry type, explain an unchecked setup rule, and mark a reviewed mistake critical. Verify Mistakes and simulate a historical factor exclusion in Trading insights. In Statistics combine filters, reverse a column sort and open the trades behind a row. In Plans verify the plan appears under the linked playbook. Add a simulated trade to a backtest. Reload to verify images, classifications and links. Run `pnpm check` for the formatting, lint, type, domain, HTTP and build checks.

If `nvm use` reports a missing `.nvmrc`, confirm that the terminal is in the project directory and that the checkout includes that file. If `pnpm` works in one terminal but fails in another, compare `node --version` and `pnpm --version` in both. Initialize nvm for the affected shell and select Node 24 there.
