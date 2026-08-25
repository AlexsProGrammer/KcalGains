# QA Checklist

Use this checklist before shipping a feature pass or a bigger stability fix.

## Core flow checks

- [ ] Onboarding completes and the app does not reset saved preferences after reopening.
- [ ] Quick actions from the Today page create the correct record and stay in the expected route.
- [ ] Weight, meal, and workout quick adds work from both Today and other pages.
- [ ] New profile creation persists a new record and immediately selects it in the UI.
- [ ] Duplicate and default plans do not create extra copies in the training plan dropdown.
- [ ] The selected training plan remains active after create, duplicate, or save actions.

## Nutrition checks

- [ ] Meal add, edit, and delete flows all update totals and visible summaries.
- [ ] Logging a meal shows a visible success state and the item appears in the daily log.
- [ ] Meal log list items render as read-only text without broken dropdown/input controls.
- [ ] Micro nutrient views respect the selected appearance setting and default to list mode.
- [ ] Barcode route allows scan review, item editing, and add-to-library actions.

## Training checks

- [ ] Training day selector does not drift backward or prevent forward navigation.
- [ ] Header training mode reflects the active rest or workout mode for the selected day.
- [ ] Finish workout logs the actual sets and weights without showing zero values.
- [ ] Manual plan day actions work in edit mode and read mode without duplicated state.
- [ ] Repeat weeks includes 4-week and infinite options when editing a plan.

## Progress and target checks

- [ ] Selected date drives the target resolver for calorie and macro calculations.
- [ ] Progress chart uses an average over the selected time period for macro breakdown.
- [ ] Training context changes alter the effective daily targets consistently.
- [ ] Goal-chained targets remain stable when settings are valid and persisted.

## Appearance and settings checks

- [ ] Theme, density, motion, and today hero changes apply immediately and persist after Save.
- [ ] A saved appearance change does not reset unrelated settings or dropdown selections.
- [ ] Micronutrient view changes are reflected on Today, meal cards, and nutrition tabs.

## Backup and data integrity checks

- [ ] Export and import preserve data, including workouts and nutrition entries.
- [ ] Legacy data without sets or older schema fields still renders without crashing.
- [ ] Backup imports with workouts enabled succeed without throwing a runtime error.

## Final sign-off

- [ ] Type-check passes with the project lint/build validation.
- [ ] Vitest smoke tests pass for the critical logic paths.
- [ ] A manual regression pass was performed after the final fix batch.
