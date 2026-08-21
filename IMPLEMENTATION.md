
# IMPLEMENTATION.md - Part 2: Local Food Engine & External Data Resolver

## 1. Project Context & Architecture

### Goal
Implement the local food catalog layer that supports zero-latency offline food search, manual custom food CRUD operations, a pre-seeded dataset of common fitness staples, and an on-demand direct Open Food Facts resolver with automatic local caching.

### Tech Stack & Dependencies
- **Runtime & Framework:** TypeScript (v5.5+), React 19, Vite (from Part 1)
- **Local Database & State:** `dexie` (v4+), `dexie-react-hooks` (from Part 1)
- **Client-Side Search Indexing:** `minisearch` (v7+)
- **Barcode & Scanning Utilities:** `@zxing/browser` (v0.1+)
- **Validation & Parsing:** `zod` (from Part 1)
- **UI & Icons:** `lucide-react`, Tailwind CSS, `radix-ui` dialog/tabs/popover

#### Installation Commands:
```bash
npm install minisearch @zxing/browser

```

### File Structure

```text
src/
├── data/
│   └── seedFoods.json
├── db/
│   ├── seed.ts
│   └── foodRepository.ts
├── services/
│   ├── searchIndexService.ts
│   ├── openFoodFactsService.ts
│   └── barcodeScannerService.ts
├── hooks/
│   ├── useFoodSearch.ts
│   ├── useFoodMutations.ts
│   └── useBarcodeScanner.ts
├── components/
│   ├── food/
│   │   ├── FoodSearchInput.tsx
│   │   ├── FoodSearchResults.tsx
│   │   ├── FoodItemCard.tsx
│   │   ├── FoodDetailModal.tsx
│   │   ├── CustomFoodForm.tsx
│   │   └── BarcodeScannerModal.tsx
│   └── ui/
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       └── tabs.tsx
└── types/
    └── food.types.ts

```

### Attention Points & DSGVO

* **Zero Third-Party Telemetry on API Calls:** When querying Open Food Facts API, execute direct client-to-API `fetch()` calls from the device without sending analytics, user identifiers, or location data. Set the required custom `User-Agent` header as per Open Food Facts terms (`User-Agent: QuirinFittiTracker - Version 1.0 - Android/iOS PWA`).
* **Offline Isolation:** Network failures during Open Food Facts lookups must be handled gracefully without throwing unhandled exceptions; fallback immediately to local-only search.
* **Auto-Caching:** Any food fetched from Open Food Facts that is selected by the user must be automatically saved into the local `foods` Dexie table with `isCustom: false` so it is permanently queryable offline.
* **Search Memory Footprint:** Initialize and update the `minisearch` index in-memory from Dexie records to ensure sub-millisecond prefix, fuzzy, and substring matching.

---

## 2. Execution Phases

#### Phase 1: Pre-Seeded Dataset & Seeding Engine

* [x] **Step 1.1:** In `src/data/seedFoods.json`, construct a curated dataset of ~100 standard fitness foods (e.g., Haferflocken, Magerquark, Hähnchenbrust, Reis, Eier, Banane, Whey Isolat, Olivenöl, Mandeln) with verified per-100g values for calories, protein, carbs, fat, fiber, and key micronutrients (e.g., sodium, potassium, magnesium, zinc).
* [x] **Step 1.2:** In `src/db/seed.ts`, implement `seedDatabaseIfEmpty(db: FitnessTrackerDB)`:
* Check if `db.foods.count() === 0`.
* If zero, validate `seedFoods.json` against `z.array(FoodSchema)` and bulk-insert into `db.foods`.


* [x] **Step 1.3:** In `src/main.tsx` or database initialization lifecycle, call `seedDatabaseIfEmpty` after database open.
* [x] **Verification:** Wipe IndexedDB in browser DevTools, reload the app, and verify via `db.foods.count()` that all seed items are populated. (Pending browser runtime verification.)

#### Phase 2: In-Memory Search Engine & Food Repository

* [x] **Step 2.1:** In `src/db/foodRepository.ts`, implement CRUD operations:
* `getAllFoods(): Promise<Food[]>`
* `getFoodById(id: string): Promise<Food | undefined>`
* `getFoodByBarcode(barcode: string): Promise<Food | undefined>`
* `createFood(food: InsertFoodInput): Promise<string>`
* `updateFood(id: string, updates: Partial<Food>): Promise<void>`
* `deleteFood(id: string): Promise<void>`


* [x] **Step 2.2:** In `src/services/searchIndexService.ts`, initialize and manage a `MiniSearch` instance configured with search fields (`['name', 'brand']`), store fields (`['id', 'name', 'brand', 'calories', 'protein', 'carbs', 'fat']`), and search options (`prefix: true`, `fuzzy: 0.2`).
* [x] **Step 2.3:** Implement synchronization in `searchIndexService.ts` to index seed data on load and reactively add/update/remove items when Dexie food records change.
* [x] **Step 2.4:** In `src/hooks/useFoodSearch.ts`, build a hook returning matching local results with debouncing (150ms).
* [x] **Verification:** Call `useFoodSearch("hafer")` in a test component and confirm instant return of "Haferflocken" with score ranking. (Pending browser runtime verification.)

#### Phase 3: External Data Resolver (Open Food Facts API & Auto-Cache)

* [x] **Step 3.1:** In `src/services/openFoodFactsService.ts`, implement `fetchFromOpenFoodFacts(query: string)`:
* Call `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`.
* Add header `User-Agent: QuirinFittiTracker - PWA - Version 1.0`.


* [x] **Step 3.2:** In `src/services/openFoodFactsService.ts`, implement `fetchProductByBarcode(barcode: string)`:
* Query `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`.


* [x] **Step 3.3:** Implement a parser/transformer in `openFoodFactsService.ts` to map raw API responses (`nutriments` object: `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`, etc.) into `FoodSchema` compliant structures, safely handling missing or `null` attributes with default zero values.
* [x] **Step 3.4:** Integrate external search with local fallback in `useFoodSearch.ts`: when local search yields low-confidence or zero results and device is online, allow triggering remote Open Food Facts search.
* [x] **Step 3.5:** Implement auto-cache logic: when a remote product is selected, insert it into Dexie `foods` table and add it to the `MiniSearch` index.
* [x] **Verification:** Fetch product `4008400404127` (Kinder Schokolade barcode or test staple) and verify it transforms into a valid `Food` object matching `FoodSchema`. (Pending network/browser runtime verification.)

#### Phase 4: Barcode Scanner Module

* [x] **Step 4.1:** In `src/services/barcodeScannerService.ts`, wrap `@zxing/browser` (`BrowserMultiFormatReader`) to handle camera initialization, video element binding, barcode decoding (EAN-13, EAN-8, UPC), and track teardown.
* [x] **Step 4.2:** In `src/hooks/useBarcodeScanner.ts`, create a React lifecycle hook to manage camera permissions, video stream binding, active decoding loop, and error states (e.g., `NotAllowedError`, `NotFoundError`).
* [x] **Step 4.3:** In `src/components/food/BarcodeScannerModal.tsx`, build a camera viewport overlay with a targeting square, flashlight toggle (if supported by track capabilities), and manual input fallback.
* [x] **Step 4.4:** Implement barcode resolution chain:
1. Check local Dexie DB for matching `barcode`.
2. If not found locally, query `fetchProductByBarcode`.
3. If found remotely, save to Dexie and open detail view.
4. If not found anywhere, prompt user to create custom food with prefilled barcode.


* [x] **Verification:** Mock or pass a camera stream decoding an EAN-13 barcode, verifying that the scan stops the stream, queries the repository, and returns the mapped product. (Pending camera/browser runtime verification.)

#### Phase 5: Food UI Components & Custom Food Creation

* [x] **Step 5.1:** In `src/components/food/FoodSearchInput.tsx`, build the search bar with clear button, barcode scanner trigger button, and network status indicator.
* [x] **Step 5.2:** In `src/components/food/FoodSearchResults.tsx` and `FoodItemCard.tsx`, render search results displaying Name, Brand, per-100g badge tags (Calories, P, C, F), and local vs. remote origin indicator.
* [x] **Step 5.3:** In `src/components/food/CustomFoodForm.tsx`, build a form with controlled-input validation for creating/editing food items with live macro-to-calorie discrepancy verification (`(P*4 + C*4 + F*9) ≈ Calories`).
* [x] **Step 5.4:** In `src/components/food/FoodDetailModal.tsx`, display full nutritional breakdown, serving size customizer (e.g., gram input calculating absolute macros), and edit/local-library actions.
* [x] **Step 5.5:** In `src/App.tsx`, integrate the Food Management view alongside the debugger and backup manager.
* [x] **Verification:** Manually create a custom food item "Test Protein Shake" (120 kcal, 25g P, 2g C, 1g F), verify it displays in search results instantly, and check that it persists across page reloads. (Pending browser runtime verification.)

---

## 3. Global Testing Strategy

### Critical Path Edge Cases

1. **Full Offline Isolation:** Set browser to Offline mode in Network tab. Search local foods, create a custom food item, and verify no network requests are attempted and search operates without lag.
2. **Camera Permission Denied:** Trigger the barcode scanner and deny camera permissions. Verify the UI displays a clear, non-crashing permission error message and provides a manual barcode text input alternative.
3. **Incomplete Open Food Facts Payload:** Mock an Open Food Facts response containing null/missing `proteins_100g` and `energy-kcal_100g`. Verify the parser defaults missing numbers to 0 without breaking the UI.
4. **Search Index Sync Consistency:** Delete a custom food item from Dexie and verify that subsequent queries in `MiniSearch` do not return the deleted item.
