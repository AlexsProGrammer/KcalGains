Updated todo list

I’m mapping your reported issues into a concrete implementation sequence and will turn them into a prioritized, phased plan with clear fixes, affected files, and verification gates.

Searched for regex `QuickActions|quick actions|MorePage|SettingsPage|OnboardingPage|TodayPage|MealPlanner|TrainingPlanGenerator|DatePicker|progress.*trend|NutritionPage` (`**/src/**`), 35 results

Created memory file 

Read 

Created memory file 

## Plan: KcalGains UX, mobile, and state-fix pass

This is the implementation roadmap I’d use to fix the issues you listed. I grouped them by root cause and user flow so the app becomes stable before we add more polish. The key idea is to fix state integrity first, then mobile UX, then feature completeness, then test coverage.

### Executive summary
The remaining problems cluster into five major areas:

- Mobile shell and navigation issues
- Broken persistence / quick action / onboarding state
- Nutrition planner + logging + favorites + micros gaps
- Training/date logic and edit-mode problems
- Dynamic targets, chart behavior, and test/documentation gaps

The safest order is:
1. stable shell + shared state + onboarding
2. meal/workout logging + planner/favorites
3. training/date logic
4. dynamic targets and charts
5. tests + docs

---

## Phase 1: Repair the app shell and mobile UX

### Goal
Fix the layout and interaction issues that make the app feel broken on mobile, especially in settings and more.

### Work
- Fix responsive layout and bottom spacing in:
  - `AppShell.tsx`
  - `MorePage.tsx`
- Make settings / more screens mobile-friendly with:
  - safe-area bottom spacing
  - proper tap target sizes
  - stacked forms on narrow screens
  - no clipped action buttons
- Remove the redundant goals tab from settings / more and keep a single profile-centered flow.
- Keep the tabs as the primary navigation, while quick actions stay as a secondary convenience entry point.
- Ensure date and top-level controls live in the correct page header only where intended.

### Why this is first
These are high-visibility issues and they affect navigation and data entry across the whole app. If the shell is broken, every other fix becomes harder to validate.

### Verification
- Open each page on a narrow mobile viewport and check no overlaps or hidden controls
- Confirm the settings/more flows still open and scroll properly
- Confirm the app does not force onboarding repeatedly after skip

---

## Phase 2: Fix persistence, onboarding, and quick actions

### Goal
Repair the broken state flow behind the “saved” message, onboarding skip behavior, and the fact that quick actions do nothing.

### Work
- Trace and fix the persistent “data saved” banner logic so it appears on the main screen instead of only when entering settings/data.
- Investigate the root state source in:
  - `TodayPage.tsx`
  - `AppShell.tsx`
  - `useSettings.ts`
- Fix broken quick-action dispatch in:
  - `QuickActionSheet.tsx`
- Ensure add-meal, add-weight, add-workout, and similar actions actually mutate state and trigger re-render.
- Add tab-level plus buttons on key screens such as:
  - weight trend
  - nutrition today log
  - other relevant summary cards
- Extend onboarding wizard in:
  - `OnboardingPage.tsx`
- Add:
  - allergies
  - nutrition defaults
  - training defaults
  - profile defaults
- Ensure skip and finish both persist correctly and do not pop up again on reload.

### Why this is second
These bugs create trust issues and block all daily usage. They are state bugs, not cosmetic bugs.

### Verification
- Quick action opens and dispatches correctly
- Main page shows the saved state indicator without opening settings
- Onboarding skip does not reappear after reload
- Onboarding finish saves the expected defaults

---

## Phase 3: Nutrition logging, meal planner, favorites, and micros UX

### Goal
Complete the nutrition flow so logging, generation, favorites, and micronutrients work as a coherent system.

### Work
- Fix meal logging in:
  - `useMealLogger.ts`
  - `NutritionPage.tsx`
- Support:
  - add meal
  - remove meal from logs
  - edit existing log entries
  - visible green success state after logging
  - breakfast/lunch/snack/dinner selection
- Improve planner flow in:
  - `AutoMealPlanner.tsx`
  - `mealPlannerService.ts`
- Add:
  - lock button for full-day planner regeneration
  - keep locked meals stable while regenerating others
  - move a meal from planner to balancer for editing
  - meal type dropdown in balancer
- Add favorites tab:
  - between logs and micros
  - add meals from balancer or logs
  - edit favorite in balancer as a template
  - directly log favorite as meal type
- Add expandable micros list to the today page and nutrition page
- Add drinks / shakes / water / fluid tracking to the same system
- Add daily micronutrient target configuration under profile settings, defaulted from body type, goal, and sweat type, but overrideable manually

### Why this is next
This is the biggest user-facing workflow after state reliability. It touches logging, planner, macros, micros, and favorites together.

### Verification
- Log a meal and see a green success state
- Remove and edit already-logged meals
- Regenerate planner with locked meals preserved
- Add a favorite and add it directly to logs
- Micronutrient totals update on today page and nutrition page

---

## Phase 4: Fix training plan generation, mode logic, and date handling

### Goal
Repair the training app flow so planner behavior is clear and consistent.

### Work
- Fix default plan generation and duplicates in:
  - `TrainingPlanGenerator.tsx`
  - `TrainPage.tsx`
- Add:
  - week 4 repeat support
  - infinite repeat option
  - correct default training plan templates
  - no duplicate default plans
- Make default training mode rest, not active training mode
- Ensure mode persistence works via:
  - `DailyModeSelector.tsx`
  - training context repository
- Fix date navigation bug:
  - no day drift
  - no going past today
  - forward button disabled correctly
  - back/forward buttons work predictably
- Move date/time controls into the relevant page header, but hide them only where requested (progress and more)
- Separate finish-workout actions for planner days vs active workout logger so they do not share the same state
- Fix edit mode in training plan so read/edit mode is clear and compact, and visually highlight active edit mode green

### Why this matters
The planner and daily mode logic currently creates stale state and wrong-day logging; this is the biggest cause of confusion in the app’s training flow.

### Verification
- Different days log their own data correctly
- Planner finish workout does not log the wrong day
- Date buttons respect current day boundary
- Training mode defaults to rest and persists

---

## Phase 5: Dynamic targets, progress trends, and micronutrient charts

### Goal
Make targets and trend lines respond to the real profile + training mode + date state.

### Work
- Fix shared target logic in:
  - `targetResolverService.ts`
  - `useDynamicTargets.ts`
  - `sportsPeriodizationService.ts`
- Ensure kcal target and macro targets update based on:
  - profile
  - training mode
  - date
  - body metrics
- Update progress trend behavior so target kcal is a daily curve, not a static value
- Add configurable micronutrient chart / radar / list as a settings option
- Standardize floating-point display to two decimal places in the UI, while keeping internal precision intact

### Why this is a separate phase
This is not just a chart visual issue; it is a source-of-truth problem across nutrition and training.

### Verification
- Switch training mode and confirm targets update
- Move date backward/forward and confirm the target line reflects the correct day
- Micronutrient view can be displayed in compact or detailed mode

---

## Phase 6: Editing for recent logs, workouts, meals, and weight

### Goal
Restore the “edit list” workflows that users expect across app sections.

### Work
- Reintroduce edit list controls for:
  - meals
  - workouts
  - logs
  - weight entries
- Reuse the graph/list toggle patterns consistently across screens rather than keeping them isolated to one page
- Add edit actions to:
  - recent workouts
  - nutrition today log
- Add visible success confirmation after successful edits/logs
- Keep interactions consistent in history, today, and planner views

### Verification
- Each list can be edited inline
- Recent workout cards can be edited
- Meal logs can be removed or modified without leaving the current screen

---

## Phase 7: Tests, QA, and documentation

### Goal
Add the safety net so the app stops regressing in the same spots.

### Work
- Add a lightweight automated test setup for:
  - onboarding persistence
  - quick action dispatch
  - meal logging add/remove/edit
  - date navigation
  - target resolution
  - backup import/export
  - duplicate default plan generation
- Add a QA checklist covering:
  - old core flows
  - new dual-plan flows
- Update:
  - `README.md`
  - `package.json`
- Document the exact manual test flow and the expected app behavior

### Verification
- Run the automated tests after the reliability fixes
- Verify each high-risk regression is covered
- Confirm the dev/test instructions are clear for future work

---

## Relevant files to touch
This is the main implementation map:

- `AppShell.tsx`
- `QuickActionSheet.tsx`
- `MorePage.tsx`
- `OnboardingPage.tsx`
- `TodayPage.tsx`
- `NutritionPage.tsx`
- `AutoMealPlanner.tsx`
- `useMealLogger.ts`
- `useDynamicTargets.ts`
- `mealPlannerService.ts`
- `targetResolverService.ts`
- `sportsPeriodizationService.ts`
- `TrainingPlanGenerator.tsx`
- `TrainPage.tsx`
- `DailyModeSelector.tsx`
- `backupService.ts`
- `schemas`
- `README.md`
- `package.json`

---

## Execution order recommendation
I’d do it in this order:

1. Phase 1: shell + mobile
2. Phase 2: persistence + onboarding + quick actions
3. Phase 3: nutrition logging + planner + favorites
4. Phase 4: training + dates + planner state
5. Phase 5: target math + charts
6. Phase 6: list editing + success states
7. Phase 7: automated tests + docs

This sequence keeps the app stable while gradually finishing the requested feature set.

---

## Decisions to keep in mind
- Fix state root causes before cosmetic refinements.
- Treat mobile as the primary target.
- Keep all data local-first and Dexie-backed.
- Prefer shared hooks over isolated component fixes.
- Validate each phase with real app behavior, not only static code changes.

If you want, I can take this plan and turn it into a stricter implementation backlog with:
- exact tasks per file
- priority labels
- QA checklist items
- suggested implementation order for each sprint.




---

### Low-priority phases (deferred, exploration-level)

#### Phase 11: In-Browser AI Chat Assistant
- Add `@mlc-ai/web-llm`, create `src/services/localChatService.ts` loading a small quantized model (SmolLM2-1.7B or Llama-3.2-1B-Instruct) into CacheStorage, run via WebGPU.
- Create `src/components/ai-bridge/ChatAssistant.tsx` for conversational nutrition/training Q&A grounded in local profile/plan data.
- **Verification:** ask "why did my carbs go up today" and confirm the assistant references the actual periodization offset from Phase 7.

#### Phase 12: Food Photo Recognition
- Add `@huggingface/transformers`, create `src/services/foodVisionService.ts` using an `image-classification` pipeline (e.g. `Xenova/food-101`) run fully in-browser via WASM/WebGPU.
- Hook into `FoodManagement.tsx`/`BarcodeScannerModal.tsx` camera flow as an alternative "scan a plate" entry point.
- **Verification:** photograph a known food, confirm a matching local/remote food suggestion appears.

#### Phase 13: Live Price Lookup Exploration
- Research feasibility/legality of scraping retailer sites (e.g., Edeka) for live prices — flagged as legally risky and likely to break; manual `costPer100g` entry (Phase 5) remains the primary mechanism.
- If pursued, keep entirely optional/off by default and clearly label as experimental.

---

**Decisions**
- Hard-filter allergens everywhere (search, balancer, planner) rather than soft warnings.
- Budget handled as a manual per-food cost + LP-solver constraint, no live price API.
- Training plan generation is template-based, not a full periodization simulator.
- AI chat/vision explicitly deferred — not blocking the core dual-plan engine.
- All data and models stay client-side (Dexie + bundled JSON + optional in-browser WebGPU models) — no new server, DSGVO-safe by construction.

**Further Considerations**
1. Micronutrient dataset licensing/size: USDA SR-Legacy is public domain (safe to bundle); confirm final trimmed subset stays close to ~500KB to avoid bloating the PWA bundle. Recommend starting with ~150-200 common whole foods only.
2. Dexie version bumps are proposed as separate versions per phase (9, 10, 11) for isolation/rollback safety — alternative is combining all Phase 1/6/8 schema changes into a single version bump. Recommend keeping them separate to make debugging failed migrations easier.
