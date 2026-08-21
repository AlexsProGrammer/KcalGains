# IMPLEMENTATION.md - Part 3: Deterministic Meal Auto-Balancer (Linear Programming Solver)

## 1. Project Context & Architecture

### Goal
Implement a deterministic client-side optimization engine that calculates exact gram amounts for 2–6 selected food items to hit user-defined target macronutrients (Protein, Carbs, Fat, Calories) within configurable min/max boundary constraints using linear programming.

### Tech Stack & Dependencies
- **Runtime & Framework:** TypeScript (v5.5+), React 19, Vite (from Part 1)
- **Mathematical Optimization Engine:** `javascript-lp-solver` (v0.4+)
- **Local Persistence & Models:** `dexie` (v4+), Zod schemas (from Part 1 & 2)
- **UI Components:** Tailwind CSS, `lucide-react`, `radix-ui` slider/dialog/popover

#### Installation Commands:
```bash
npm install javascript-lp-solver
npm install -D @types/javascript-lp-solver

```

*(Note: If `@types/javascript-lp-solver` is missing or incomplete, create an ambient module declaration in `src/types/lp-solver.d.ts`)*

### File Structure

```text
src/
├── types/
│   ├── lp-solver.d.ts
│   └── balancer.types.ts
├── schemas/
│   └── balancer.schema.ts
├── services/
│   ├── lpSolverService.ts
│   └── balancerTransformer.ts
├── hooks/
│   ├── useMealBalancer.ts
│   └── useMealLogger.ts
├── components/
│   └── balancer/
│       ├── BalancerContainer.tsx
│       ├── MacroTargetControls.tsx
│       ├── SelectedFoodList.tsx
│       ├── FoodConstraintRow.tsx
│       ├── BalancerResultsCard.tsx
│       └── OptimizationErrorAlert.tsx
└── utils/
    └── macroCalculations.ts

```

### Attention Points & DSGVO

* **Purely Local Execution:** The linear solver must run 100% on the main thread / web worker on the client device. Zero calculation requests or nutrient profiles leave the phone.
* **Strict Determinism:** Eliminate LLM guesswork by solving a constrained linear system:

$$\min \sum w_i \cdot (\text{deviation}_i) \quad \text{subject to} \quad \mathbf{A} \cdot \mathbf{x} \approx \mathbf{b}, \quad \mathbf{l} \le \mathbf{x} \le \mathbf{u}$$


* **Gram Quantization & Rounding:** Raw solver results (e.g., $142.387\text{ g}$) must be intelligently rounded to discrete whole grams ($142\text{ g}$) with automatic re-verification of final macro totals.
* **Infeasible Problem Handling:** When conflicting constraints occur (e.g., target 200g protein with 300 kcal max, or strict upper boundaries that cannot reach the target), the engine must fail gracefully, state the exact limiting constraint, and suggest the closest feasible configuration without crashing.

---

## 2. Execution Phases

#### Phase 1: Type Definitions & Zod Schemas

* [x] **Step 1.1:** In `src/types/lp-solver.d.ts`, declare typings for `javascript-lp-solver` model structure (`optimize`, `opType`, `constraints`, `variables`, `ints`, and `Solve` result status).
* [x] **Step 1.2:** In `src/schemas/balancer.schema.ts`, define:
* `MacroTargetSchema`: `calories` (number), `protein` (number), `carbs` (number), `fat` (number), `priority` (enum: `balanced`, `protein-first`, `exact-calories`).
* `IngredientConstraintSchema`: `foodId` (string), `minGrams` (number, default 0), `maxGrams` (number, default 1000), `stepSize` (optional number, e.g., 5g or whole units).
* `BalancerInputSchema`: `targets` (`MacroTargetSchema`), `ingredients` (array of `IngredientConstraintSchema`, min 1, max 8).
* `BalancerResultSchema`: `status` (`feasible` | `infeasible` | `bounded`), `solution` (array of `{ foodId, grams, computedCalories, computedProtein, computedCarbs, computedFat }`), `totalMacros`, `deviation` (`{ deltaCalories, deltaProtein, deltaCarbs, deltaFat }`).


* [x] **Step 1.3:** In `src/types/balancer.types.ts`, export inferred TypeScript types from all balancer schemas.
* [ ] **Verification:** Run `npx tsc --noEmit` and confirm zero typing or schema declaration errors. (Pending dependency synchronization.)

#### Phase 2: LP Problem Transformer & Solver Engine

* [ ] **Step 2.1:** In `src/utils/macroCalculations.ts`, write pure calculation helpers to convert per-100g nutritional vectors into per-1g unit rates ($P/100, C/100, F/100, Kcal/100$).
* [ ] **Step 2.2:** In `src/services/balancerTransformer.ts`, implement `buildLpModel(input: BalancerInput, foodCatalog: Map<string, Food>)`:
* Map each ingredient to an LP variable with per-gram macro coefficients.
* Construct bounded constraints for min/max grams per ingredient.
* Implement slack/surplus penalty variables (`slack_protein`, `surplus_protein`, etc.) to formulate a goal-programming model that minimizes total weighted deviation from target macros.


* [ ] **Step 2.3:** In `src/services/lpSolverService.ts`, implement `solveMealBalance(input: BalancerInput, foodCatalog: Map<string, Food>): BalancerResult`:
* Invoke `solver.Solve(lpModel)`.
* Check solver result flag (`feasible` vs `infeasible`).
* Extract solved weights for each ingredient variable, round to nearest integer grams, and recalculate actual output macros.
* Return formatted `BalancerResult`.


* [ ] **Step 2.4:** In `src/services/lpSolverService.ts`, implement heuristic relaxation: if an exact match is infeasible, automatically relax the secondary macro bounds (e.g., carbs/fat) while keeping protein locked to return a "best effort" nearest match.
* [ ] **Verification:** Write and execute a test script solving for Target: `500 kcal, 40g Protein, 50g Carbs, 15g Fat` using `Haferflocken`, `Magerquark`, and `Whey Isolat`. Verify computed grams yield values within $\le 2\text{ g}$ of targets.

#### Phase 3: Balancer State Hook & Log Integration

* [ ] **Step 3.1:** In `src/hooks/useMealBalancer.ts`, implement state management for:
* Active target macros (prefilled from user's remaining daily allowance).
* Selected food pool (array of foods pulled from Part 2 search/local DB).
* Individual food constraint overrides (min/max sliders).
* Debounced automatic recalculation whenever targets or constraints change.


* [ ] **Step 3.2:** In `src/hooks/useMealLogger.ts`, implement `commitBalancedMealToLog(result: BalancerResult, mealType: MealType, date: string)`:
* Transform the solver output into a valid `MealSchema` object.
* Write meal and meal items directly into the Dexie `meals` table within an atomic transaction.


* [ ] **Verification:** Trigger `useMealBalancer` in a harness, mutate target protein from 30g to 60g, and verify the resulting gram quantities update reactively.

#### Phase 4: UI Components & Constraint Controls

* [ ] **Step 4.1:** In `src/components/balancer/MacroTargetControls.tsx`, build numeric/slider inputs for target Calories, Protein, Carbs, and Fat with quick-preset buttons (e.g., "Fill Remaining Day Deficit", "High Protein Snack").
* [ ] **Step 4.2:** In `src/components/balancer/SelectedFoodList.tsx` and `FoodConstraintRow.tsx`, render selected ingredients with:
* Visual macro badges per item.
* Dual-thumb range slider for min/max gram limits (e.g., `50g - 250g`).
* Lock toggle (e.g., pin an ingredient to exactly `100g` while the other items balance around it).
* Delete/remove button.


* [ ] **Step 4.3:** In `src/components/balancer/BalancerResultsCard.tsx`, display:
* Solved gram amount highlighted in large typography for each food.
* Macro comparison progress bars (Target vs Actual achieved).
* Discrepancy delta indicators (e.g., `+1.2g Protein, -0.5g Fat`).
* "Log This Meal" primary action button.


* [ ] **Step 4.4:** In `src/components/balancer/OptimizationErrorAlert.tsx`, render an actionable alert when constraints cannot be solved, explaining the blocker (e.g., *"Cannot reach 60g Protein: Max limit of Quark (200g) reached. Increase max limit or add another protein source."*).
* [ ] **Step 4.5:** In `src/components/balancer/BalancerContainer.tsx`, integrate search modal trigger (from Part 2) to easily add foods from the local database into the active balancing pool.
* [ ] **Verification:** In UI, select 3 foods, lock one food to 100g, adjust target protein, and confirm that only the unlocked foods adjust their gram amounts.

---

## 3. Global Testing Strategy

### Critical Path Edge Cases

1. **Single Food Target Matching:** Select only 1 food (e.g., Chicken Breast) with target 60g Protein. Verify the solver outputs exact required grams without error.
2. **Impossible Physics (Zero Macro Constraint):** Target 50g Protein using only Olive Oil (pure fat). Verify the solver flags this as impossible, displays the `OptimizationErrorAlert`, and avoids infinite loops or NaN values.
3. **Locked Ingredient Constraints:** Set Oats min = max = 80g, and let Whey + Milk balance the remaining 30g Protein. Verify Oats outputs exactly 80g.
4. **Rounding Drift Protection:** Check that rounding decimal weights (e.g., 33.33g) to whole numbers (33g) does not produce a cumulative macro error greater than $\pm 1.5\text{ g}$ or $\pm 10\text{ kcal}$.
