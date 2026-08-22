## Plan: Goals, BMI, Auto-Meals, Settings & Data Editing

Extend KcalGains from isolated modules into an interconnected, goal-driven tracker: a profile/settings core (body metrics + goal + feature toggles) feeds a BMI/energy engine, which drives the balancer, AI bridge, and a new auto meal creator — plus editable weight/meal history, richer graphs, and smarter AI import/merge.

**Steps**

**Phase 0 — Prerequisites (blocking)**
1. Fix the malformed `ImportDatabaseResult` union in `backupService.ts` — `BackupTableCounts` is spliced into the union, swallowing the error arm.
2. Dexie v4 migration adding a `settings` store.

**Phase 1 — Profile & Settings Foundation** (*depends on 0*)
1. Extend `ProfileSchema`: `heightCm`, `birthYear`, `sex`, `activityLevel`, `goal` (`lose-fat`/`maintain`/`gain-muscle`/`recomp`/`athletic`), `goalRateKgPerWeek`.
2. New `settings.schema.ts`: `moduleChaining`, `autoWeightFromLogs`, `autoTargetsFromGoal`, `defaultView`.
3. `settingsRepository` + `useSettings`, and a `SettingsPanel` mounted in `App`.

**Phase 2 — BMI & Energy Engine** (*depends on 1*)
1. `bodyMetrics.ts` — BMI, category, ideal weight range.
2. `energyNeedsService.ts` — Mifflin-St Jeor BMR → activity multiplier → goal delta → recommended kcal + macro split.
3. `useBodyMetrics` uses the latest EMA weight when `autoWeightFromLogs` is on; `BmiCard` renders it.

**Phase 3 — Module Interconnect Layer** (*depends on 2*)
1. `targetResolverService.ts` as the single source of truth (goal + energy needs + workout-day delta + TDEE).
2. Rewrite `useDynamicTargets` to respect chained vs separate mode toggles.
3. Wire into `BalancerContainer` and `useAiPromptGenerator`; show a "from goal / manual" badge.

**Phase 4 — Editable Weight & Meal History** (*depends on 1*)
1. Shared graph/list `viewModeToggle` (graph = read-only, list = editable).
2. `WeightHistoryList` — add back-dated entries, inline edit, delete, schema-validated.
3. `MealHistoryList` — backfill and edit past meals.

**Phase 5 — Analytics Graphs & Per-Module Lists** (*depends on 4*)
1. `nutritionAggregationService` daily rollups from meals.
2. `MacroTrendChart` (kcal + P/C/F with target reference lines) and `MealBreakdownChart`.
3. Apply the list+graph pattern to workouts and foods.

**Phase 6 — Auto Meal Creator** (*depends on 3*)
1. `foodClassifierService` — macro-role classification from per-100 g ratios (no schema migration).
2. `mealPlannerService` — template-based candidate meals scored against targets, reusing `autoBalanceMeal`; `planDay()` splits across meal types.
3. New `AutoMealPlanner` dashboard card with suggest/plan-day, regenerate, and log actions.

**Phase 7 — AI Prompt & Import Overhaul** (*depends on 0*)
1. Prompt now requests exactly one ```json fenced block (the parser already strips fences).
2. Second prompt mode that converts chat/tracked text into `BackupPayloadSchema` JSON.
3. `importDatabaseFromJson(file, mode)` with `overwrite` and `merge` (upsert by `id`, newest wins) in one atomic transaction, plus a mode selector and added/updated/skipped summary.

**Relevant files**
- `src/schemas/profile.schema.ts`, new `settings.schema.ts` — goal/activity/toggle contracts
- `src/db/schema.ts` — v4 migration
- `src/services/dynamicTargetService.ts`, `tdeeEngineService.ts`, `lpSolverService.ts` (`autoBalanceMeal`) — reuse
- `src/services/backupService.ts` — type fix + merge modes
- `src/utils/promptTemplates.ts` — fenced JSON + import prompt
- `src/components/analytics/*`, `balancer/BalancerContainer.tsx`, `App.tsx` — UI wiring

**Verification**
1. `pnpm exec tsc --noEmit` after each phase.
2. Set height/goal → BMI card shows category and recommended kcal; toggling `autoWeightFromLogs` switches between profile weight and latest EMA weight.
3. Chaining on: changing the goal updates balancer targets and AI prompt macros without re-entry. Chaining off: both keep manual values.
4. Add, edit, and delete a back-dated weight entry; graph re-renders and TDEE confidence changes.
5. "Plan my day" with ~8 local foods returns meals within tolerance and logs to Dexie.
6. Import the same payload twice in merge mode → no duplicates; then overwrite mode → tables replaced.

**Decisions**
- Toggles live in a dedicated `settings` table so backups treat app prefs separately from body data.
- Food classification is heuristic (macro ratios) to avoid a food-schema migration and re-seed.
- Excluded for now: multi-user profiles, recipe library, cloud sync, notifications.

**Further Considerations**
1. Meal backfill scope — always-available list editor (recommended) vs one-time onboarding wizard?
2. Planner food pool — whole local library with a pantry filter (recommended) vs pantry-only?
3. Should goal-derived targets snapshot into `dailyLogs` daily for historical accuracy? (Recommended: yes.)fenced block (the parser already strips fences).
2. Second prompt mode that converts chat/tracked text into `BackupPayloadSchema` JSON.
3. `importDatabaseFromJson(file, mode)` with `overwrite` and `merge` (upsert by `id`, newest wins) in one atomic transaction, plus a mode selector and added/updated/skipped summary.

**Relevant files**
- `src/schemas/profile.schema.ts`, new `settings.schema.ts` — goal/activity/toggle contracts
- `src/db/schema.ts` — v4 migration
- `src/services/dynamicTargetService.ts`, `tdeeEngineService.ts`, `lpSolverService.ts` (`autoBalanceMeal`) — reuse
- `src/services/backupService.ts` — type fix + merge modes
- `src/utils/promptTemplates.ts` — fenced JSON + import prompt
- `src/components/analytics/*`, `balancer/BalancerContainer.tsx`, `App.tsx` — UI wiring

**Verification**
1. `pnpm exec tsc --noEmit` after each phase.
2. Set height/goal → BMI card shows category and recommended kcal; toggling `autoWeightFromLogs` switches between profile weight and latest EMA weight.
3. Chaining on: changing the goal updates balancer targets and AI prompt macros without re-entry. Chaining off: both keep manual values.
4. Add, edit, and delete a back-dated weight entry; graph re-renders and TDEE confidence changes.
5. "Plan my day" with ~8 local foods returns meals within tolerance and logs to Dexie.
6. Import the same payload twice in merge mode → no duplicates; then overwrite mode → tables replaced.

**Decisions**
- Toggles live in a dedicated `settings` table so backups treat app prefs separately from body data.
- Food classification is heuristic (macro ratios) to avoid a food-schema migration and re-seed.
- Excluded for now: multi-user profiles, recipe library, cloud sync, notifications.

**Further Considerations**
1. Meal backfill scope — always-available list editor (recommended) vs one-time onboarding wizard? <- always-aivalable
2. Planner food pool — whole local library with a pantry filter (recommended) vs pantry-only? <- whole local library with a pantry filter (recommended)
3. Should goal-derived targets snapshot into `dailyLogs` daily for historical accuracy? (Recommended: yes.) <- yes, recommended