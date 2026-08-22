
## Plan: Full Frontend Rework — Dark, Themed, Mobile-First

Replace the single-scroll dev page with a real app shell: token-driven dark design system, runtime-switchable accent color, react-router with 5 sections, mobile bottom tab bar + FAB, tablet rail, desktop sidebar. All 51 components get rewritten against new primitives. Business logic (hooks, services, Dexie) is untouched — this is purely presentation.

---

### Phase 0 — Foundation *(blocking, everything depends on it)*

1. Add deps: `react-router@7`, `framer-motion`, `@radix-ui/react-{dialog,tabs,switch,select,slider,popover,tooltip,scroll-area,accordion,radio-group,toast}`. All bundled locally — no CDN, offline-first preserved.
2. **Design tokens** in `index.css` as CSS variables on `:root`: surface ramp (`--surface-0` #0a0b0d → `--surface-3`), border, text ramp, semantic (success/warn/danger/info), and an accent ramp `--accent-50…--accent-950` + `--accent-contrast`.
3. Rewrite `tailwind.config.js`: map `accent`, `surface`, `line`, `ink` to `rgb(var(--x) / <alpha-value>)` so utilities like `bg-accent-500/20` work and re-theme instantly. Add `spacing.safe-*` using `env(safe-area-inset-*)`, `minHeight.touch: 44px`, custom shadows/blur scale, font sizes with tabular-nums for stats.
4. Fix `index.html` + `vite.config.ts` manifest: name/short_name → KcalGains, `theme_color` driven from surface-0, `orientation: any` (tablet/desktop landscape), add `viewport-fit=cover` to the viewport meta and `maskable` icon check.
5. Delete the 4 scaffolding cards and the "Local workspace initialized" alert.

### Phase 1 — Design System *(depends on 0)*

Rebuild `ui` as the single styling source. Every component below only uses tokens, never raw `emerald-*`/`slate-*`.

1. **Primitives**: `Button` (primary/secondary/ghost/danger/tonal · sm/md/lg/icon · `loading` state, 44px min), `IconButton`, `Card` (`elevation` 0-2, `interactive`), `Surface`, `Badge`, `Chip`, `Divider`, `Skeleton`, `Spinner`.
2. **Forms**: `Field`, `TextInput`, `NumberStepper` (thumb-friendly +/− for grams/reps/kg), `SelectInput` (Radix Select — native-feeling on mobile), `Switch` (Radix), `SegmentedControl` (Radix Tabs styled as pill group), `Slider` (Radix), `SearchInput` with clear + debounce.
3. **Overlays**: `Sheet` (Radix Dialog — bottom sheet on mobile with drag-to-dismiss, centered modal ≥md), `Dialog`, `Popover`, `Tooltip`, `ConfirmDialog`, `Toast` provider replacing scattered inline success/error strings.
4. **Data display**: `StatTile`, `MetricRow`, `ProgressBar`, `ProgressRing` (SVG, animated, used by the calorie hero), `MacroBar` (P/C/F stacked), `EmptyState` (icon + title + body + CTA — fixes the "History section renders nothing" gap), `ErrorState`, `ListRow` (with swipe-to-delete on touch), `Section` (title + action slot).
5. **Charts**: `ChartCard`, `ChartTooltip` (touch-anchored, large hit area), `chartTheme.ts` reading accent tokens so Recharts recolors with the theme, `Sparkline` (plain SVG) for small inline trends.

### Phase 2 — Routing & App Shell *(depends on 1)*

1. `src/routes/` with `createBrowserRouter`; add SPA fallback to the workbox config so deep links work offline. Routes: `/today`, `/nutrition`, `/train`, `/progress`, `/more/*`, `/onboarding`. Redirect `/` → `settings.defaultView` landing route.
2. `AppShell.tsx` — responsive chrome:
   - **Mobile (<768px)**: fixed bottom `TabBar` (5 items, safe-area padded, active indicator, haptic-ish scale animation) + `TopBar` (contextual title, back, action slot).
   - **Tablet (768–1279px)**: collapsed icon `NavRail` on the left, content max-width, 2-column grids.
   - **Desktop (≥1280px)**: expanded `Sidebar` with labels, persistent, plus a wider 3-column dashboard grid.
3. `QuickActionFab` — floating above the tab bar (mobile) / bottom-right (desktop), opens `QuickActionSheet`: Log meal · Log weight · Start workout · Scan barcode · AI import. Each routes or opens the relevant sheet.
4. `ScrollRestoration`, per-route `PageTransition` (framer-motion, slide+fade, disabled under `prefers-reduced-motion`), and a route-level `ErrorBoundary` + `Suspense` with lazy chunks per section.
5. PWA overlays (`ReloadPrompt`, `InstallBanner`, `OfflineIndicator`) get restyled and mounted in the shell — offline becomes a slim top strip, update becomes a toast, install becomes a dismissible bottom card that respects safe area.

### Phase 3 — Theming Engine *(depends on 1, parallel with 2)*

1. Extend `settings.schema.ts`: `accent` (enum of 8), `todayHero` (enum of 4), `locale` (`en`/`de`), `reduceMotion` (`system`/`on`/`off`), `density` (`comfortable`/`compact`). Bump the Dexie version in `schema.ts` with defaults for existing rows.
2. `src/theme/accents.ts` — 8 curated ramps (Emerald default, Lime, Teal, Cyan, Violet, Amber, Rose, Blue), each pre-validated for WCAG AA against surface-0/1 and carrying its own `--accent-contrast` for text on filled buttons.
3. `ThemeProvider` — reads `useSettings()`, writes the ramp to `document.documentElement.style`, syncs the `<meta name="theme-color">`. Apply the persisted accent in a tiny inline script in `index.html` to avoid a first-paint flash.
4. `AccentPicker` in Settings — swatch grid with live preview, keyboard-navigable radio group.

### Phase 4 — i18n *(depends on 1, parallel with 2/3)*

1. `src/i18n/` — lightweight typed provider (no i18next; keeps bundle small and fully offline): `en.ts` / `de.ts` dictionaries with a shared key union type so a missing translation is a **compile error**.
2. `useT()` hook with interpolation + plural helper; `formatNumber`/`formatDate`/`formatWeight` via `Intl` bound to the active locale.
3. Language selector in Settings; `<html lang>` kept in sync. Extract every hardcoded string during the phase 5–9 rewrites rather than in a separate pass.

### Phase 5 — Today Screen *(depends on 2, 3, 4)*

1. `TodayPage` — date strip (swipe/arrow to previous days), hero slot, then compact cards.
2. **Hero variants** (selectable in Settings, default = ring):
   - `CalorieRingHero` — big animated `ProgressRing` for kcal remaining, three `MacroBar`s under it, over/under color shift.
   - `WeightBmiHero` — sparkline + BMI gauge + ideal range.
   - `StatGridHero` — 2×3 dense `StatTile` grid.
   - `StreakHero` — adherence % + 7-day dot calendar (derived from `useNutritionTrend`, no new logic).
3. Below the hero: `TodayMealsCard` (grouped by meal type, tap to edit, swipe to delete), `WorkoutStatusCard` (resume active session or start), `TargetSourceBadge` ("from goal" / "manual" from `useDynamicTargets`), `QuickStatsRow` (TDEE, weight, streak).
4. `SetupChecklist` card appears only while the profile is incomplete, deep-linking into the wizard.

### Phase 6 — Nutrition Screen *(depends on 5)*

One route, `SegmentedControl` with 4 tabs, tab state in the URL query so back/forward and refresh work.
1. **Log** — today's meals, add-food flow, per-meal macro totals.
2. **Plan** — rewritten `AutoMealPlanner`: pool filter chips, meal-type selector, generated meals as cards with grams + macro deltas vs target, regenerate/log actions.
3. **Balance** — rewritten `BalancerContainer`: target row, food pool as a horizontally scrollable chip rail (0/8), focus `Slider`, constraint rows in a `Sheet` on mobile, results card with feasible/infeasible states.
4. **Library** — search + barcode + OpenFoodFacts; `FoodItemCard` redesigned for touch, `FoodDetailModal` → `Sheet`, `CustomFoodForm` → full-screen sheet on mobile. Barcode scanner gets a proper full-bleed camera view with a reticle overlay.

### Phase 7 — Train Screen *(depends on 5, parallel with 6)*

1. Active-session-first layout: current exercise large, `ExerciseSetTable` rewritten as tap-friendly rows (`NumberStepper` for reps/kg, big completion checkbox, swipe to delete a set).
2. `RestTimerOverlay` → persistent bottom bar with a circular countdown, continues across navigation; wake-lock hint.
3. `ExercisePickerModal` → searchable sheet with muscle-group filter chips.
4. Session summary on finish (volume, duration, PRs) + recent workouts list.

### Phase 8 — Progress Screen *(depends on 5, parallel with 6/7)*

1. Range selector (7d / 30d / 90d / all) shared by all charts.
2. `WeightTrendChart`, `MacroTrendChart`, `MealBreakdownChart`, plus a new volume trend — all through `ChartCard`/`chartTheme`, with target reference lines and touch tooltips.
3. `ViewModeToggle` becomes a proper `SegmentedControl`; **fixes the current bug where history lists render nothing in graph mode** — every list/chart pair must render either data, a chart, or an `EmptyState`.
4. `MealHistoryList`, `WorkoutHistoryList`, `FoodHistoryList`, `WeightHistoryList` → shared `HistoryList` pattern: date-grouped sticky headers, inline edit sheet, swipe-delete with undo toast, virtualized when long.
5. `BmiCard` + `TdeeStatsCard` restyled with calibration progress ring.

### Phase 9 — More / Settings / Data *(depends on 2, 3, 4)*

Sub-routes under `/more`: `profile`, `goals`, `appearance`, `modules`, `data`, `ai`, `about`, `developer`.
1. `appearance` — accent picker, Today-hero picker, density, motion, language, default view.
2. `profile` / `goals` — rewritten `ProfileGoalForm` with grouped fields, inline validation from the Zod schemas, unit clarity.
3. `modules` — rewritten `ModuleSettingsPanel` using the new `Switch`, grouped with explanatory copy.
4. `data` — rewritten `BackupManager`: export card, import drop zone with mode selector, summary table, "Import from tracked notes with AI" as a guided 3-step flow.
5. `ai` — rewritten `AiBridgeContainer` as a 3-step wizard (configure → copy prompt → paste reply), `IngestionPreviewTable` becomes a mobile-friendly card list, validation errors via `SchemaValidationAlert` restyled.
6. `developer` — hidden route (only linked after 7 taps on the version number, or when `import.meta.env.DEV`) hosting `DatabaseDebugger` + `BalancerDevPanel`.
7. `StorageStatus` moves into `data` as a quota card.

### Phase 10 — Onboarding *(depends on 5, 9)*

`/onboarding` full-screen wizard, shown when the profile is incomplete: Welcome → Body (height, birth year, sex) → Activity → Goal + rate → First weight → Accent pick → Done. Progress dots, back/skip, writes through existing `useProfile`/`useSettings`, then routes to `/today`. Re-runnable from Settings.

### Phase 11 — Polish *(depends on 5–10)*

1. Motion pass: page transitions, sheet springs, `ProgressRing` sweep, number count-ups; all gated on a `useReducedMotion` hook combining the OS setting with the app override.
2. A11y pass: contrast check on all 8 accents, focus-visible rings on every interactive element, ARIA labels/roles on tab bar, sheets, sliders, charts (with a text summary fallback), logical tab order, `aria-live` for toasts.
3. Empty/loading/error states everywhere — no blank sections, `Skeleton` for all `useLiveQuery` loading.
4. Perf: lazy-load routes, code-split Recharts and the ZXing scanner, memoize chart data, check the bundle budget.

---

**Relevant files**
- `tailwind.config.js` · `index.css` — token system, the backbone of accent switching
- `App.tsx` — reduced to providers + `RouterProvider`
- `ui` — 5 primitives grow to ~30; keep the existing `clsx` + `twMerge` pattern
- `settings.schema.ts` · `schema.ts` — accent/hero/locale/density fields + Dexie version bump
- `useSettings.ts` — consumed by `ThemeProvider` and `I18nProvider`
- `index.html` · `vite.config.ts` — viewport-fit, theme-color, manifest naming, SPA navigate fallback
- All 51 files under `components` — rewritten presentation, unchanged hook contracts

**Verification**
1. `pnpm exec tsc --noEmit` after every phase; `pnpm build` green at the end.
2. Switch accent through all 8 presets — tab bar, buttons, charts, rings, and the browser theme-color all recolor with no reload and no flash on refresh.
3. Chrome DevTools device toolbar at 360×640, 390×844 (notch), 768×1024, 1440×900 — no horizontal scroll, tab bar clears the home indicator, sidebar appears at ≥1280px.
4. Keyboard-only run through Today → Nutrition tabs → open a sheet → Esc closes and focus returns to the trigger.
5. Toggle OS reduced-motion — transitions become instant, nothing breaks.
6. Switch EN ↔ DE — every visible string changes, dates/numbers reformat, `<html lang>` updates.
7. Fresh profile (clear IndexedDB) → onboarding wizard runs → lands on Today with real targets, no empty-looking sections anywhere.
8. Install as PWA on Android/iOS, go offline, deep-link to `/progress` — loads from the service worker.
9. Lighthouse mobile: Accessibility ≥95, PWA installable.

**Decisions**
- Accent is a full CSS-variable ramp, not a single hue, so hover/border/glow states stay AA-contrast on every preset.
- i18n is hand-rolled and typed rather than i18next — smaller bundle, missing keys fail at compile time.
- Nutrition tab state lives in the URL, so back/refresh/share behave correctly in a standalone PWA.
- Dev panels are hidden but retained (Settings → Developer), not deleted.
- Excluded: light theme, custom hex picker, ESLint/Prettier/Vitest, cloud sync, notifications, any change to services/solver/Dexie logic beyond the settings migration.

**Further Considerations**
1. **Deployment path for react-router** — `createBrowserRouter` needs a host SPA-fallback rule. If you deploy to plain static hosting without one, `createHashRouter` is safer. *(Recommended: browser router + workbox `navigateFallback`; tell me if your host can't rewrite.)*
2. **Rewrite strategy** — big-bang branch, or route-by-route behind a `?newUi` flag so the old page stays usable during the migration? *(Recommended: big-bang on a branch; the phases are individually type-checkable.)*
3. **Date navigation on Today** — swipe-between-days plus a calendar picker, or a simple prev/today/next control? *(Recommended: swipe + prev/next, calendar picker only on ≥md.)*
