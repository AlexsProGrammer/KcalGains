# IMPLEMENTATION.md - Part 4: Clipboard AI Bridge & Smart Ingestion/Validation Engine

## 1. Project Context & Architecture

### Goal
Implement a zero-backend, privacy-first AI bridge and resilient data ingestion engine. This module allows users to generate structured, context-aware prompt templates (containing remaining daily macros, dietary preferences, and logged pantry foods) for external LLMs (Gemini/ChatGPT), and provides a clipboard listener/paste parser that validates and ingests AI-generated meals and full data snapshots directly into Dexie.js using strict Zod schemas.

### Tech Stack & Dependencies
- **Runtime & Framework:** TypeScript (v5.5+), React 19, Vite (from Part 1)
- **Validation & Parsing:** `zod` (v3+)
- **Storage & State:** `dexie` (v4+), `dexie-react-hooks` (from Part 1)
- **UI & Interaction:** `lucide-react`, Tailwind CSS, `radix-ui` toast/dialog
- **Clipboard & File Utilities:** Browser Native Async Clipboard API (`navigator.clipboard`), Native File API

#### Installation Commands:
```bash
npm install clsx tailwind-merge

```

### File Structure

```text
src/
├── schemas/
│   ├── aiPrompt.schema.ts
│   └── aiResponse.schema.ts
├── services/
│   ├── promptSynthesizerService.ts
│   ├── aiResponseParserService.ts
│   └── clipboardService.ts
├── hooks/
│   ├── useAiPromptGenerator.ts
│   └── useAiIngestion.ts
├── components/
│   └── ai-bridge/
│       ├── AiBridgeContainer.tsx
│       ├── PromptGeneratorModal.tsx
│       ├── PromptCopyCard.tsx
│       ├── AiPasteModal.tsx
│       ├── IngestionPreviewTable.tsx
│       └── SchemaValidationAlert.tsx
└── utils/
    └── promptTemplates.ts

```

### Attention Points & DSGVO

* **100% Client-Side Prompt Composition:** All prompt generation and text ingestion happen locally in memory. No user dietary records, weights, or food data are sent to any intermediate proxy server.
* **Zero API Key Overhead:** Avoid costly third-party API keys and token consumption by utilizing standard copy-paste protocols between the PWA and the user's preferred LLM web interface or app.
* **Robust Schema Sandboxing:** External AI outputs are non-deterministic and prone to syntax errors (e.g., Markdown wrapping `json ... `, trailing commas, missing units). The parser must sanitize raw LLM text, strip markdown blocks, and parse through Zod before committing any record to IndexedDB.
* **Atomic Dexie Transactions:** Multi-item meals or database snapshots parsed from AI imports must be written atomically to ensure partial failures do not leave IndexedDB in an inconsistent state.

---

## 2. Execution Phases

#### Phase 1: AI Prompt & Response Schema Contracts

* [x] **Step 1.1:** In `src/schemas/aiPrompt.schema.ts`, define `PromptContextSchema` containing:
* `remainingMacros`: `{ calories: number, protein: number, carbs: number, fat: number }`
* `mealType`: enum `['breakfast', 'lunch', 'dinner', 'snack', 'flexible']`
* `pantryFoods`: array of string (names of available food items)
* `dietaryPreferences`: array of string (e.g., `['vegan', 'high-protein', 'low-sugar']`)
* `maxIngredients`: optional number (default 4)


* [x] **Step 1.2:** In `src/schemas/aiResponse.schema.ts`, define `AiMealItemSchema` (`name`, `grams`, `calories`, `protein`, `carbs`, `fat`) and `AiMealResponseSchema`:
* `title`: string (e.g., "Post-Workout High-Protein Quark Bowl")
* `description`: optional string
* `items`: array of `AiMealItemSchema` (min 1)
* `totalCalories`: number
* `totalProtein`: number
* `totalCarbs`: number
* `totalFat`: number


* [x] **Step 1.3:** In `src/types/index.ts`, export inferred TypeScript types `PromptContext`, `AiMealItem`, and `AiMealResponse`.
* [ ] **Verification:** Run `npx tsc --noEmit` to confirm all schema contracts compile cleanly without type mismatches. (Editor diagnostics are clean; command verification pending.)

#### Phase 2: Prompt Synthesizer & Clipboard Service

* [x] **Step 2.1:** In `src/utils/promptTemplates.ts`, construct the system prompt template engineered for Gemini and ChatGPT:
* Enforce explicit instructions for the AI to respond **exclusively** with a raw JSON block matching `AiMealResponseSchema`.
* Include example input/output schema definitions and instruction to calculate accurate grams based on real macronutrient densities ($4\text{ kcal/g}$ for P & C, $9\text{ kcal/g}$ for F).


* [x] **Step 2.2:** In `src/services/promptSynthesizerService.ts`, implement `generatePrompt(context: PromptContext): string`:
* Dynamically inject remaining daily deficits and available pantry ingredients into the prompt template.
* Return the sanitized, ready-to-paste prompt string.


* [x] **Step 2.3:** In `src/services/clipboardService.ts`, implement `copyToClipboard(text: string): Promise<boolean>` and `readFromClipboard(): Promise<string>` with permission fallback handlers for non-supported browsers.
* [x] **Step 2.4:** In `src/hooks/useAiPromptGenerator.ts`, create a React hook that reads today's target deficits from Dexie `dailyLogs` and exports the generated prompt to the clipboard.
* [ ] **Verification:** Invoke `generatePrompt()` with mock deficits (e.g., 40g Protein, 500 kcal) and verify the generated string contains the correct schema structure and numerical parameters. (Pending browser/clipboard runtime verification.)

#### Phase 3: AI Output Sanitizer & Zod Ingestion Pipeline

* [x] **Step 3.1:** In `src/services/aiResponseParserService.ts`, implement `extractJsonFromText(rawText: string): string`:
* Strip markdown formatting fences (e.g., `json ... ` or `...`).
* Use regular expressions to extract the outermost JSON object `{ ... }` from surrounding explanatory text.
* Clean up common LLM syntax anomalies (e.g., unescaped newlines, trailing commas).


* [x] **Step 3.2:** In `src/services/aiResponseParserService.ts`, implement `parseAndValidateAiResponse(rawText: string)`:
* Run JSON extraction and parse into a JavaScript object.
* Execute `AiMealResponseSchema.safeParse()`.
* Return `{ success: true, data: AiMealResponse }` or `{ success: false, errors: string[] }`.


* [x] **Step 3.3:** In `src/services/aiResponseParserService.ts`, implement `resolveAndLinkFoods(aiMeal: AiMealResponse, db: FitnessTrackerDB)`:
* For each ingredient in `aiMeal.items`, search existing `foods` table by name.
* If food exists, link its `foodId`; if not, flag as a new custom food to be automatically registered in Dexie.


* [x] **Step 3.4:** In `src/hooks/useAiIngestion.ts`, implement stateful workflow handling raw text input, real-time validation feedback, parsed preview state, and committing confirmed meals to Dexie.
* [ ] **Verification:** Pass a messy LLM response string (containing conversational intro, markdown code blocks, and valid JSON) to `parseAndValidateAiResponse()`, verifying successful parsing into typed data. (Pending parser/browser runtime verification.)

#### Phase 4: UI Components & Ingestion Workflow

* [ ] **Step 4.1:** In `src/components/ai-bridge/PromptGeneratorModal.tsx`, build a configuration dialog allowing users to adjust prompt parameters (target meal type, remaining macros, pantry food selection) with a prominent "Copy Prompt for Gemini/ChatGPT" button.
* [ ] **Step 4.2:** In `src/components/ai-bridge/PromptCopyCard.tsx`, display a copy confirmation toast and a quick step-by-step indicator (*"1. Paste into Gemini -> 2. Copy Gemini's reply -> 3. Paste back here"*).
* [ ] **Step 4.3:** In `src/components/ai-bridge/AiPasteModal.tsx`, create a pasteboard dialog featuring an auto-paste button (`navigator.clipboard.readText()`), a manual textarea fallback, and instant validation status badges.
* [ ] **Step 4.4:** In `src/components/ai-bridge/IngestionPreviewTable.tsx`, render the parsed meal:
* Itemized food names, computed gram amounts, and individual macros.
* Indicator showing whether an item will be linked to an existing food or created as a new library item.
* Editable gram inputs allowing the user to tweak values before committing.
* "Log Meal & Save Foods" submit button.


* [ ] **Step 4.5:** In `src/components/ai-bridge/SchemaValidationAlert.tsx`, render descriptive, friendly error alerts when LLM outputs are invalid (e.g., *"The AI returned an invalid format. Click below to regenerate the prompt."*).
* [ ] **Step 4.6:** In `src/components/ai-bridge/AiBridgeContainer.tsx`, integrate the modals and quick-access buttons into the main dashboard navigation.
* [ ] **Verification:** Open `AiPasteModal`, paste a valid mock AI JSON payload, verify `IngestionPreviewTable` renders all items accurately, and clicking "Log Meal" commits the record to the Dexie `meals` table.

---

## 3. Global Testing Strategy

### Critical Path Edge Cases

1. **Conversational LLM Text Wrapping:** Test pasting an output starting with *"Sure, here is your high protein meal plan:"* followed by code fences. Ensure the JSON extractor isolates the JSON body and parses successfully.
2. **Missing/Corrupted Macronutrient Fields:** Test pasting an AI response where `totalFat` is missing or `grams` is provided as a string with units (e.g., `"150g"` instead of `150`). Verify the sanitizer coerces strings or flags the exact validation error without throwing runtime crashes.
3. **Clipboard Permission Block:** Deny clipboard reading permissions in browser settings. Verify the UI smoothly falls back to the manual textarea input without unhandled promise rejections.
4. **Duplicate Food Creation Prevention:** Ingest an AI meal containing "Haferflocken" when "Haferflocken" is already present in the local database. Verify the resolver links to the existing database record rather than creating a duplicate entry.
