# IMPLEMENTATION.md - Part 5: Hybrid Workout Logger & Dynamic TDEE Engine

## 1. Project Context & Architecture

### Goal
Implement a lightweight local workout logging module (supporting strength exercises, sets, reps, weight, RPE, and cardio durations) and couple it directly to the nutrition engine. This part introduces an adaptive Exponential Moving Average (EMA) algorithm that computes true energy expenditure (TDEE) from daily scale weights and calorie logs, and automatically adjusts daily macronutrient targets on workout days.

### Tech Stack & Dependencies
- **Runtime & Framework:** TypeScript (v5.5+), React 19, Vite (from Part 1)
- **Local Persistence & State:** `dexie` (v4+), `dexie-react-hooks` (from Part 1)
- **Data Visualization:** `recharts` (v2.12+)
- **Validation:** `zod` (v3+)
- **UI & Icons:** `lucide-react`, Tailwind CSS, `radix-ui` tabs/slider/dialog

#### Installation Commands:
```bash
npm install recharts
npm install -D @types/recharts

```

### File Structure

```text
src/
├── schemas/
│   ├── workout.schema.ts
│   ├── weightLog.schema.ts
│   └── tdee.schema.ts
├── db/
│   ├── workoutRepository.ts
│   └── metricsRepository.ts
├── services/
│   ├── tdeeEngineService.ts
│   ├── volumeCalculatorService.ts
│   └── dynamicTargetService.ts
├── hooks/
│   ├── useWorkoutLogger.ts
│   ├── useWeightTrends.ts
│   └── useDynamicTargets.ts
├── components/
│   ├── workout/
│   │   ├── WorkoutLoggerCard.tsx
│   │   ├── ExerciseSetTable.tsx
│   │   ├── ExercisePickerModal.tsx
│   │   ├── RestTimerOverlay.tsx
│   │   └── WorkoutSummaryModal.tsx
│   ├── analytics/
│   │   ├── WeightTrendChart.tsx
│   │   ├── TdeeStatsCard.tsx
│   │   ├── CalorieDeficitChart.tsx
│   │   └── MacroDistributionRadar.tsx
│   └── dashboard/
│       └── DynamicTargetBanner.tsx
└── utils/
    ├── mathCalculations.ts
    └── emaCalculations.ts

```

### Attention Points & DSGVO

* **Zero Cloud Fitness Sync:** All health and workout data (weight, volume, heart rate/calories, exercise names) remain strictly on-device in IndexedDB. No external fitness APIs (Apple HealthKit / Google Health Connect) are queried in this phase.
* **Adaptive EMA Weight Smoothing:** Daily body weight fluctuates up to $\pm 2\text{ kg}$ due to water retention and glycogen storage. The TDEE calculation must never use single-day raw weight, but rather an Exponential Moving Average:

$$\text{EMA}_{\text{today}} = \alpha \cdot \text{Weight}_{\text{today}} + (1 - \alpha) \cdot \text{EMA}_{\text{yesterday}} \quad (\alpha \approx 0.1 \text{ to } 0.2)$$


* **Caloric Balance Inversion:** Caloric expenditure calculation over a 14–28 day rolling window:

$$\text{TDEE}_{\text{avg}} = \text{Calories}_{\text{avg}} - \left( \frac{\Delta \text{EMA Weight (kg)} \times 7700\text{ kcal}}{N \text{ days}} \right)$$


* **Zero Stutter Data Rendering:** Use optimized SVG path rendering via `recharts` with debounced time-series downsampling to ensure smooth 60fps chart interactions on mobile viewports.

---

## 2. Execution Phases

#### Phase 1: Schemas & Database Extensions

* [x] **Step 1.1:** In `src/schemas/workout.schema.ts`, expand schemas for:
* `ExerciseDefinitionSchema`: `id` (uuid), `name` (string), `category` (enum: `chest`, `back`, `legs`, `shoulders`, `arms`, `core`, `cardio`), `defaultRestSeconds` (number).
* `ExerciseSetSchema`: `setId` (string), `setNumber` (number), `type` (enum: `warmup`, `normal`, `drop`, `failure`), `weightKg` (number), `reps` (number), `rpe` (optional number 1–10), `isCompleted` (boolean).
* `LoggedExerciseSchema`: `exerciseId` (string), `exerciseName` (string), `sets` (array of `ExerciseSetSchema`), `notes` (optional string).
* `WorkoutLogSchema`: `id` (uuid), `date` (string YYYY-MM-DD), `startTime` (timestamp), `endTime` (optional timestamp), `title` (string), `exercises` (array of `LoggedExerciseSchema`), `estimatedCaloriesBurned` (optional number).


* [x] **Step 1.2:** In `src/schemas/weightLog.schema.ts`, define `WeightEntrySchema` (`id`, `date` YYYY-MM-DD, `weightKg`, `smoothedWeightKg`, `note`).
* [x] **Step 1.3:** In `src/schemas/tdee.schema.ts`, define `TdeeCalculationResultSchema` (`calculatedTdee`, `trendDirection`, `weeklyWeightDeltaKg`, `confidenceScore`, `recommendedIntake`).
* [x] **Step 1.4:** In `src/db/schema.ts`, add the v3 migration with `weightLogs` (`id, date`), `exerciseDefinitions`, and a pre-seeded local exercise library of 30 standard gym movements.
* [ ] **Verification:** Run `npx tsc --noEmit` and execute schema migration tests to ensure database opens without data loss. (Pending runtime verification.)

#### Phase 2: Math & TDEE Calculation Subsystem

* [x] **Step 2.1:** In `src/utils/emaCalculations.ts`, implement `calculateWeightEMA(entries: WeightEntry[], smoothingFactor = 0.1)`:
* Sort entries chronologically.
* Compute the weighted exponential trend line and backfill missing day gaps via linear interpolation.


* [x] **Step 2.2:** In `src/services/tdeeEngineService.ts`, implement `computeAdaptiveTDEE(weightLogs: WeightEntry[], dailyCalorieLogs: DailyLog[], windowDays = 21)`:
* Calculate average daily caloric intake over the window.
* Calculate smoothed weight change ($\Delta \text{EMA Weight}$) over the window.
* Convert weight delta into caloric surplus/deficit using the standard $7700\text{ kcal/kg}$ adipose tissue energy constant.
* Compute raw TDEE and compute confidence score based on the number of days logged (minimum 7 days required for baseline confidence).


* [x] **Step 2.3:** In `src/services/volumeCalculatorService.ts`, implement workout aggregation helpers:
* `calculateTotalVolume(workout: WorkoutLog): number` ($\sum \text{reps} \times \text{weightKg}$).
* `calculateEstimated1RM(weightKg: number, reps: number): number` using the Brzycki formula:

$$\text{1RM} = \frac{\text{weightKg}}{1.0278 - (0.0278 \times \text{reps})}$$




* [x] **Step 2.4:** In `src/services/dynamicTargetService.ts`, implement `getAdjustedDailyTargets(baseProfile: UserProfile, isWorkoutDay: boolean, workoutType?: string)`:
* If `isWorkoutDay` is true, add configured delta (e.g., $+40\text{g}$ carbohydrates, $+10\text{g}$ protein, $+250\text{ kcal}$) to base nutritional target.


* [ ] **Verification:** Write unit test feeding 14 days of 2500 kcal intake with a steady 0.5 kg weight drop, confirming calculated TDEE outputs approximately $2775\text{ kcal/day} \pm 25\text{ kcal}$. (Pending runtime test execution.)

#### Phase 3: Workout Logger & State Hooks

* [ ] **Step 3.1:** In `src/db/workoutRepository.ts`, implement CRUD operations for active and completed workouts.
* [ ] **Step 3.2:** In `src/hooks/useWorkoutLogger.ts`, build state management for:
* Active workout session (persisted in local state to survive page refreshes).
* Add/remove exercise, add/remove set, toggle set completion.
* Auto-trigger rest countdown timer on set completion.
* "Finish Workout" action that writes final data to Dexie `workouts` table and updates `dailyLogs` for that date.


* [ ] **Step 3.3:** In `src/hooks/useWeightTrends.ts`, implement reactive queries pulling weight logs and computing dynamic EMA time-series for chart consumption.
* [ ] **Step 3.4:** In `src/hooks/useDynamicTargets.ts`, combine user profile targets with today's logged workouts to supply the active macro targets to the Part 3 Balancer and Part 4 AI Bridge.
* [ ] **Verification:** Log a 3-set bench press workout in a test harness; verify set completion updates total volume and saves to Dexie reactively.

#### Phase 4: UI Components & Dashboard Integration

* [ ] **Step 4.1:** In `src/components/workout/ExerciseSetTable.tsx`, build a mobile-optimized table with numeric inputs for weight, reps, RPE, and a one-tap checkmark button for set completion.
* [ ] **Step 4.2:** In `src/components/workout/RestTimerOverlay.tsx`, build a floating countdown badge that plays a local chime/vibration when rest time elapses.
* [ ] **Step 4.3:** In `src/components/workout/ExercisePickerModal.tsx`, build a categorized search interface to select movements or create custom exercises.
* [ ] **Step 4.4:** In `src/components/analytics/WeightTrendChart.tsx`, build a dual-line chart (Recharts `ResponsiveContainer`, `LineChart`, `Line`, `Tooltip`, `XAxis`, `YAxis`) displaying:
* Raw daily weight dots (semi-transparent scatter dots).
* Continuous EMA smoothed trend line (bold primary color line).


* [ ] **Step 4.5:** In `src/components/analytics/TdeeStatsCard.tsx`, render:
* Live calculated TDEE readout (e.g., `2,640 kcal/day`).
* True daily surplus/deficit indicator.
* Confidence rating badge ("Calibrating: 5/14 days" or "Calibrated").


* [ ] **Step 4.6:** In `src/components/dashboard/DynamicTargetBanner.tsx`, render a dynamic banner on the main dashboard showing: *"Workout Day: Macro targets adjusted (+40g Carbs)"*.
* [ ] **Verification:** In the UI, log weight for 3 consecutive days, complete a workout, and verify both the Weight Chart renders the smoothed line and the dashboard macro target dynamically updates.

---

## 3. Global Testing Strategy

### Critical Path Edge Cases

1. **Missing Weight Days:** Log weight on Day 1 and Day 5 (skipping Days 2, 3, 4). Verify that `calculateWeightEMA()` handles the time gap without dividing by zero, crashing, or distorting the EMA curvature.
2. **In-Progress Workout Recovery:** Start a workout, log 2 sets, close the browser tab, and reopen the application. Verify that the active workout state restores without data loss.
3. **Extreme Outlier Scale Readings:** Input a weight value with an accidental typo (e.g., 8.0 kg instead of 80.0 kg). Verify the Zod schema rejects inputs outside valid biological bounds ($30\text{ kg} - 350\text{ kg}$) before it corrupts the EMA curve.
4. **Target Synchronization Across Modules:** Log a workout on the current date, then navigate to Part 3 (Meal Balancer) and Part 4 (AI Prompt Synthesizer). Confirm both modules automatically receive the elevated workout-day macro targets without manual re-entry.
