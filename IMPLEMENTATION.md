
# IMPLEMENTATION.md - Part 1: Core Foundation & Reactive Persistence Engine

## 1. Project Context & Architecture

### Goal
Build the initial, offline-first foundation for a 100% client-side fitness and nutrition tracker. This part sets up the local development environment, establishes the Dexie.js (IndexedDB) database architecture with strict Zod schemas, enforces persistent browser storage, and implements a full JSON backup and restore engine.

### Tech Stack & Dependencies
- **Runtime & Language:** Node.js (LTS), TypeScript (v5.5+)
- **Build Tool & Framework:** Vite, React 19
- **CSS & UI Framework:** Tailwind CSS, `clsx`, `tailwind-merge`, `lucide-react`, `radix-ui` primitives
- **Storage & State:** `dexie` (v4+), `dexie-react-hooks`
- **Validation:** `zod` (v3+)
- **Typography & Local Assets:** `@fontsource-variable/inter` (local font bundling for DSGVO compliance)
- **Utilities:** `file-saver` (or browser native file picker / Blob API)

#### Installation Commands:
```bash
npm create vite@latest . -- --template react-ts
npm install dexie dexie-react-hooks zod lucide-react clsx tailwind-merge @fontsource-variable/inter
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p

```

### File Structure

```text
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── db/
    │   ├── schema.ts
    │   ├── index.ts
    │   └── persistence.ts
    ├── schemas/
    │   ├── food.schema.ts
    │   ├── meal.schema.ts
    │   ├── workout.schema.ts
    │   ├── dailyLog.schema.ts
    │   ├── profile.schema.ts
    │   └── backup.schema.ts
    ├── services/
    │   └── backupService.ts
    ├── hooks/
    │   ├── useStoragePersistence.ts
    │   └── useBackup.ts
    ├── components/
    │   ├── ui/
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   └── alert.tsx
    │   ├── StorageStatus.tsx
    │   ├── BackupManager.tsx
    │   └── DatabaseDebugger.tsx
    └── types/
        └── index.ts

```

### Attention Points & DSGVO

* **Zero Remote Calls:** No analytics, tracking scripts, or remote endpoints allowed.
* **Font Self-Hosting:** Load `@fontsource-variable/inter` locally in `src/main.tsx`. Absolutely no CDNs or Google Fonts URLs in `index.html`.
* **iOS WebKit Eviction Mitigation:** Execute `navigator.storage.persist()` on app initialization to lock IndexedDB against Safari 7-day eviction policies.
* **Type Safety Contract:** All Dexie table schemas must be directly derived from or validated against Zod schemas.

---

## 2. Execution Phases

#### Phase 1: Project Scaffolding & DSGVO-Compliant Styling

* [x] **Step 1.1:** Initialize the Vite project with the React-TypeScript template and configure Path Aliases (`@/*` pointing to `./src/*`) in `tsconfig.json`, `tsconfig.app.json`, and `vite.config.ts`.
* [x] **Step 1.2:** Configure `tailwind.config.js` with dark mode support (`class`), custom container padding, and standard slate/zinc color tokens.
* [x] **Step 1.3:** In `src/main.tsx`, import `@fontsource-variable/inter/index.css` and configure `src/index.css` with Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`). Ensure `index.html` has no external stylesheet links.
* [x] **Step 1.4:** Create base reusable UI components (`button.tsx`, `card.tsx`, `alert.tsx`) inside `src/components/ui/` using `clsx` and `tailwind-merge`.
* [ ] **Verification:** Run `npm run build` and ensure TypeScript compilation succeeds without errors and no external asset URLs exist in the build output. (Blocked: terminal execution is unavailable in this session.)

#### Phase 2: Zod Schemas & Domain Type Definitions

* [ ] **Step 2.1:** In `src/schemas/food.schema.ts`, define `FoodSchema` using `zod` for attributes: `id` (uuid/string), `name` (string), `brand` (optional string), `servingSize` (number), `calories` (number), `protein` (number), `carbs` (number), `fat` (number), `micros` (optional record of string -> number), `isCustom` (boolean), `createdAt` (timestamp).
* [ ] **Step 2.2:** In `src/schemas/meal.schema.ts`, define `MealItemSchema` (references `foodId`, `amountInGrams`, and computed macros) and `MealSchema` (`id`, `date` string YYYY-MM-DD, `mealType` enum [breakfast, lunch, dinner, snack], `items` array, `totalCalories`, `totalProtein`, `totalCarbs`, `totalFat`).
* [ ] **Step 2.3:** In `src/schemas/workout.schema.ts`, define `SetSchema` (reps, weight, rpe) and `WorkoutSchema` (`id`, `date` string YYYY-MM-DD, `title` string, `type` enum [strength, cardio, other], `durationMinutes` number, `caloriesBurned` optional number, `sets` array).
* [ ] **Step 2.4:** In `src/schemas/dailyLog.schema.ts` and `src/schemas/profile.schema.ts`, define schemas for daily target trackers, weight logs, and user profile parameters (target calories, target macros).
* [ ] **Step 2.5:** In `src/schemas/backup.schema.ts`, define `BackupPayloadSchema` aggregating all table arrays (`version`, `exportedAt`, `foods`, `meals`, `workouts`, `dailyLogs`, `profile`).
* [ ] **Step 2.6:** In `src/types/index.ts`, export inferred TypeScript types from all Zod schemas using `z.infer<typeof ...>`.
* [ ] **Verification:** Run `npx tsc --noEmit` to verify type inference and exports across the schema layer.

#### Phase 3: Dexie.js Database & Storage Persistence Subsystem

* [ ] **Step 3.1:** In `src/db/schema.ts`, define the Dexie database class `FitnessTrackerDB` extending `Dexie`. Configure store version `1` with tables and compound/single indices:
* `foods`: `++id, name, isCustom, createdAt`
* `meals`: `++id, date, mealType, [date+mealType]`
* `workouts`: `++id, date, type`
* `dailyLogs`: `++id, date`
* `profile`: `++id`


* [ ] **Step 3.2:** In `src/db/index.ts`, instantiate and export a singleton `db` instance of `FitnessTrackerDB`.
* [ ] **Step 3.3:** In `src/db/persistence.ts`, implement `requestStoragePersistence()` to check and execute `navigator.storage.persist()`, and `getStorageEstimate()` to fetch usage and quota via `navigator.storage.estimate()`.
* [ ] **Step 3.4:** In `src/hooks/useStoragePersistence.ts`, create a React hook that initializes persistence check on mount and exposes `isPersisted`, `quotaUsageBytes`, and `quotaTotalBytes`.
* [ ] **Verification:** Create a test unit script or render `StorageStatus.tsx` in `App.tsx` displaying the boolean return of `navigator.storage.persisted()`.

#### Phase 4: Backup, Restore & Validation Engine

* [ ] **Step 4.1:** In `src/services/backupService.ts`, implement `exportDatabaseToJson()`:
* Query all tables from `db` concurrently.
* Construct a payload matching `BackupPayloadSchema`.
* Trigger client-side file download (as a `.json` file stamped with the current ISO date).


* [ ] **Step 4.2:** In `src/services/backupService.ts`, implement `importDatabaseFromJson(file: File)`:
* Read file as text and parse JSON.
* Validate the parsed payload against `BackupPayloadSchema.safeParse()`.
* If validation fails, return structured validation errors.
* If validation succeeds, execute an atomic transaction (`db.transaction('rw', [all tables])`) clearing existing tables and bulk-inserting imported entities.


* [ ] **Step 4.3:** In `src/hooks/useBackup.ts`, build a custom hook wrapping export/import actions with loading states, error handling, and success notifications.
* [ ] **Step 4.4:** In `src/components/BackupManager.tsx`, build a UI panel containing "Export Backup (.json)" and "Import Backup" file drag-and-drop/input handlers with schema-error display alerts.
* [ ] **Verification:** Mock data generation test: Write an automated test or helper function in `src/components/DatabaseDebugger.tsx` to insert 10 sample foods and 2 sample meals, trigger export, drop database tables, re-import the file, and verify table counts match initial values.

#### Phase 5: Reactive UI Shell & Developer Dashboard

* [ ] **Step 5.1:** In `src/components/DatabaseDebugger.tsx`, build a developer test-harness utilizing `useLiveQuery` to display real-time table record counts and live tables.
* [ ] **Step 5.2:** Add action buttons in the debugger to:
* Seed 5 test food items.
* Seed 1 test meal.
* Clear all IndexedDB tables.


* [ ] **Step 5.3:** In `src/components/StorageStatus.tsx`, display storage quota in Megabytes (MB) and show a badge indicating if persistent storage is granted or unsupported.
* [ ] **Step 5.4:** In `src/App.tsx`, assemble the layout: Header, `StorageStatus`, `BackupManager`, and `DatabaseDebugger`.
* [ ] **Verification:** Run `npm run dev`, open the browser console, insert test items via the UI, verify records increment immediately via `useLiveQuery`, export the JSON, wipe data, import JSON, and confirm instant re-render.

---

## 3. Global Testing Strategy

### Critical Path Edge Cases

1. **Malformed JSON Import:** Upload an invalid JSON file (e.g., missing required macro fields or containing string values for calories). Verify that `BackupPayloadSchema.safeParse()` intercepts the file and displays an error message without corrupting IndexedDB.
2. **Schema Evolution Simulation:** Import a legacy/partial JSON backup missing optional fields (e.g., missing `micros` or `durationMinutes`). Verify defaults are applied gracefully.
3. **Storage Quota Degradation:** Verify that `persistence.ts` handles environments where `navigator.storage` or `navigator.storage.persist` is undefined (e.g., legacy browsers or strict private modes).
4. **Data Isolation:** Verify that no network requests (XHR/Fetch) are triggered in the browser Network tab during creation, query, backup, or restore operations.
