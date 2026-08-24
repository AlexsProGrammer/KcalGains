## Plan: KcalGains Adaptive Dual-Plan Engine (Nutrition + Training)

Turns KcalGains from a tracker into an adaptive system: health/allergy-aware nutrition planning with budget constraints, micronutrient tracking, and a rule-based training plan generator that talks to the nutrition engine. Everything stays 100% local (Dexie + in-browser JSON/LP-solver), no server, DSGVO-safe. AI chat and photo recognition are pushed to low-priority phases at the end per your choice.

**Phases** (10 core, sequential with some parallel sub-tracks, + 3 low-priority)

---

### Phase 1: Health & Constraint Data Model
Foundation schema work everything else depends on.
- Extend `profile.schema.ts:11-26`: add `allergens: z.array(z.enum(['gluten','lactose','nuts','soy','eggs','fish','fructose']))`, `dietaryPattern: z.enum(['standard','ketogenic','diabetic_friendly','low_fodmap']).default('standard')`, `sweatType: z.enum(['low','normal','heavy_salty']).default('normal')`, `budgetPerDay: z.number().nonnegative().optional()`.
- Extend `food.schema.ts:1-14`: replace loose `micros: z.record(...)` with a structured `MicronutrientsSchema` (sodiumMg, potassiumMg, magnesiumMg, calciumMg, zincMg, ironMg, seleniumMcg, vitaminDMcg, vitaminB6Mg, vitaminB12Mcg, vitaminCMg — all optional numbers), add `allergenTags: z.array(...).default([])`, add `costPer100g: z.number().nonnegative().optional()`.
- Bump `schema.ts:1-150` to a new Dexie `version(9)` with an `.upgrade()` that fills defaults (`allergens: []`, `dietaryPattern: 'standard'`, `sweatType: 'normal'`, `allergenTags: []`) on existing profile/food rows — follow the exact pattern used in `version(7)`/`version(8)`.
- Add i18n strings for new fields in `en.ts` and `de.ts`.
- **Verification:** `pnpm lint` (tsc -b) passes; open the app, run the existing `runBackupRoundTripCheck` in `DatabaseDebugger.tsx:13-49` and confirm it still passes with new optional fields defaulted.

---

### Phase 2: Micronutrient Dataset & Enrichment *(depends on Phase 1)*
- Add a static reference dataset `src/data/nutrientReference.json` (~500KB subset of common raw foods with full micronutrient profiles, USDA/BLS-style).
- Create `src/services/nutrientEnrichmentService.ts`: fuzzy-matches a food name against the reference dataset and merges missing micronutrient fields into a `Food`.
- Extend `openFoodFactsService.ts:41-71` `parseOpenFoodFactsProduct`: add parsing for `calcium_100g`, `vitamin-d_100g`, `vitamin-b6_100g`, `vitamin-b12_100g`, `vitamin-c_100g`, `iron_100g`, `selenium_100g` (extends the current sodium/potassium/magnesium/zinc block), then call the enrichment service as a fallback when OFF data is missing.
- Add an "advanced nutrients" collapsible section to `CustomFoodForm.tsx` for manual micronutrient entry.
- **Verification:** search "banana" locally/remotely, confirm the resulting `Food` object has non-zero micronutrient fields; `pnpm lint` passes.

---

### Phase 3: Micronutrient Target Resolver & Radar UI *(depends on Phase 1, 2)*
- Create `src/services/micronutrientTargetService.ts`: DACH/DGE-style daily reference values by sex/age (sodium, potassium, magnesium, calcium, zinc, iron, selenium, vitamin D, B6, B12, C).
- Extend `meal.schema.ts` `MealItemSchema`/`MealSchema` to also store a `totalMicros` snapshot (mirrors existing `totalProtein/totalCarbs/totalFat` pattern).
- Extend `nutritionAggregationService.ts` to sum `totalMicros` across a day's meals.
- Create `src/components/nutrition/MicronutrientRadar.tsx`: heatmap/progress list comparing today's intake vs. targets.
- Wire it into `NutritionPage.tsx:1-105` as a new section/tab.
- **Verification:** log a meal built from a food with populated micros, confirm the radar reflects it; `pnpm lint` passes.

---

### Phase 4: Allergen & Health Constraint Enforcement (hard filter) *(depends on Phase 1)*
- Create `src/services/foodFilterService.ts`: `filterFoodsByProfile(foods, profile)` excludes any food whose `allergenTags` intersects `profile.allergens`, and applies simple `dietaryPattern` tag rules.
- Apply the filter in: `useFoodSearch.ts:1-91` (local + remote results), `BalancerContainer.tsx:17-24` (food pool), `AutoMealPlanner.tsx:22-37` (food pool), `mealPlannerService.ts:1-20` (candidate generation).
- Show a small "N foods hidden due to your allergy settings" hint where filtering happens (FoodManagement, BalancerContainer, AutoMealPlanner).
- Create `src/components/settings/AllergyConstraintsForm.tsx` (checkboxes for allergens, select for dietary pattern/sweat type), mounted from `MorePage.tsx` next to `ProfileGoalForm`.
- **Verification:** set allergen "lactose" in profile, search "milk" — confirm it's absent from local/remote results and from the balancer/planner food pools; `pnpm lint` passes.

---

### Phase 5: Budget-Aware Meal Planning *(depends on Phase 1, uses Phase 4 pattern)*
- Add manual `costPer100g` entry field to `CustomFoodForm.tsx` and to the Open Food Facts detail/cache flow (optional, user-entered since OFF has no price data).
- Extend `balancer.schema.ts` `MacroTargetSchema`/`BalancerInputSchema` with an optional `maxBudget: z.number().nonnegative().optional()`.
- Extend `balancerTransformer.ts:31-69` `buildLpModel`: add a `cost` contribution per food variable (`costPer100g/100 * grams`) and a `budget` constraint (`{ max: input.targets.maxBudget }`) when set.
- Update `lpSolverService.ts:1-95` result building to include a `totalCost` in `BalancerResult` (schema update in `balancer.schema.ts` `BalancerResultSchema`).
- Update `useMealBalancer.ts:1-87` to pass `profile.budgetPerDay` as default `maxBudget`.
- Surface cost in `BalancerResultsCard.tsx` and in the plan cards of `AutoMealPlanner.tsx:146-166`.
- **Verification:** set food costs + a low `budgetPerDay`, run auto-balance, confirm total cost stays under budget or the solver reports infeasible when it can't; `pnpm lint` passes.

---

### Phase 6: Sport & Training Context Model *(independent, can run parallel with Phases 2-5)*
- Create `src/schemas/trainingContext.schema.ts`: `TrainingDayContextSchema` with `date`, `sportType: z.enum(['strength','hypertrophy','cardio','mma','combat_sport','endurance','rest'])`, `intensity: z.enum(['low','moderate','high'])`, `durationMinutes`, `seasonPhase: z.enum(['offseason','competition_prep','competition','recovery'])`.
- Add a `trainingContext: 'id, date'` table to `schema.ts` as Dexie `version(10)`.
- Create `src/db/trainingContextRepository.ts` mirroring the CRUD pattern in `profileRepository.ts`.
- Create `src/components/train/DailyModeSelector.tsx`: quick-pick UI ("Today: Gym / MMA / Cardio / Rest") writing today's `TrainingDayContext`; mount in `TrainPage.tsx:13-22`.
- **Verification:** pick a mode, confirm the record persists in Dexie (inspect via `DatabaseDebugger` or devtools), survives reload; `pnpm lint` passes.

---

### Phase 7: Sports Periodization Engine *(depends on Phase 6, integrates with Phase 3 for hydration/electrolytes)*
- Create `src/services/sportsPeriodizationService.ts`: pure function mapping `{ sportType, seasonPhase, intensity, bodyWeightKg }` to macro/hydration offsets — e.g. MMA: `+1.5g carbs/kg`, `+500mg sodium`, `+300–600 kcal`; strength: `+0.4g protein/kg`; competition phase: `-500 kcal`; offseason: `+250 kcal`.
- Update `targetResolverService.ts:16-65`: replace the current ad-hoc `isWorkoutDay/workoutType` params with a lookup of today's `TrainingDayContext` (Phase 6 repo) and delegate offset math to `sportsPeriodizationService`.
- Extend `micronutrientTargetService.ts` (Phase 3) to accept sodium/potassium offsets from the periodization result.
- Update `DynamicTargetBanner.tsx` to show why targets changed, e.g. "Adjusted for MMA session (+420 kcal, +1.5g carbs/kg)".
- **Verification:** set today's mode to MMA, confirm `NutritionPage` targets and the banner reflect the boost; switch to Rest, confirm it reverts; `pnpm lint` passes.

---

### Phase 8: Rule-Based Training Plan Generator *(depends on Phase 6)*
- Create `src/data/trainingTemplates.json`: weekly split templates keyed by `goal + sportType + frequency` (e.g. lose-fat+gym+4d → upper/lower; gain-muscle+gym+5d → PPL; mma+3d → skill+conditioning+strength).
- Create `src/services/trainingPlanGeneratorService.ts`: `generateWeeklyPlan(profile, preferences)` → array of `{ day, sportType, focus, durationMinutes }`.
- Create `src/schemas/trainingPlan.schema.ts` + add a `trainingPlans: 'id, weekStart'` Dexie table (bundle into the same version bump as Phase 6 or its own `version(11)`), plus `src/db/trainingPlanRepository.ts`.
- Create `src/components/train/TrainingPlanGenerator.tsx` (inputs: goal, sport, frequency, optional competition date → generate button → weekly plan cards), mount in `TrainPage.tsx`.
- **Verification:** generate a plan for "gain-muscle, gym, 4x/week", confirm 4 populated training days + rest days, persists after reload; `pnpm lint` passes.

---

### Phase 9: Dual-Plan Bridge *(depends on Phases 6, 7, 8 — the integration phase)*
- Wire `TrainingPlanGenerator` (Phase 8) output so each day of the generated plan auto-writes a `TrainingDayContext` (Phase 6) for its date, unless the user manually overrides via `DailyModeSelector`.
- Add a "recalculate nutrition" trigger: when `DailyModeSelector` changes today's mode mid-day, re-run `resolveDailyTargets` and refresh `DynamicTargetBanner`, `BalancerContainer`, and `AutoMealPlanner` targets live (no reload).
- Update `OnboardingPage.tsx:1-60`: after goal selection, immediately generate both a starter nutrition target (existing `resolveDailyTargets`) and a starter weekly training plan (Phase 8) in one finish step — matches "Ich sag ich möchte abnehmen → Bäm, beide Pläne".
- **Verification:** run onboarding end-to-end and confirm both a nutrition target and a training plan exist afterward; change today's sport mid-day and confirm nutrition targets update without reload; `pnpm lint` passes.

---

### Phase 10: Backup/Export Compatibility & Migration Safety *(depends on all schema changes in Phases 1, 6, 8)*
- Update `backup.schema.ts:1-14` `BackupPayloadSchema` to include `trainingContext` and `trainingPlans` arrays.
- Update `backupService.ts` export/import functions to read/write the new tables.
- Extend the round-trip check in `DatabaseDebugger.tsx:13-49` to cover the new tables and fields.
- **Verification:** export a backup after using the new features, wipe/reset the DB, re-import, confirm all new fields and tables are restored intact.

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
