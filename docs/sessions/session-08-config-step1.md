# Session 8: Configurator Step 1 — Boat Selection

## Prerequisites
- Session 7 complete (boats + equipment polished)

## Goal
Step 1 of the 4-step configurator wizard: boat selection with grid, search, and detail panel.

## Detailed Steps

### 1. Verify/update Zustand store (`src/stores/configurator-store.ts`)
Should already exist from Session 1. Verify it has:
```typescript
interface ConfiguratorState {
  currentStep: 1 | 2 | 3 | 4
  selectedBoat: Boat | null
  selectedEquipment: Map<string, EquipmentItem>
  clientData: ClientFormData
  discounts: ConfiguratorDiscount[]
  templateGroupId: string | null
  // Actions
  setStep(step): void
  setBoat(boat): void
  toggleEquipment(item): void
  setSelectedEquipment(items): void
  setClientData(data): void
  addDiscount(discount): void
  removeDiscount(id): void
  setTemplateGroupId(id): void
  reset(): void
}
```

### 2. Create `StepIndicator.tsx` (`src/components/configurator/StepIndicator.tsx`)
- Horizontal progress bar with 4 circles connected by lines
- Each circle: number inside (1-4)
- **States:**
  - Completed: green bg + white checkmark
  - Active: primary blue bg + white number
  - Upcoming: gray border + gray number
- Lines between circles: solid green (completed) / dashed gray (upcoming)
- Labels below circles: "Select Boat" → "Configure" → "Client" → "Review"
- Responsive: labels hide on very small screens, circles stay

### 3. Create `ConfiguratorPage.tsx` (`src/pages/configurator/ConfiguratorPage.tsx`)
- **Layout:**
  - StepIndicator at top (full width)
  - Current step component below (takes remaining height)
  - Navigation bar at bottom: "← Back" (left) + "Next →" (right)
- **Logic:**
  - Read `currentStep` from Zustand store
  - Render Step1/Step2/Step3/Step4 based on step
  - Back: `setStep(currentStep - 1)`, disabled on step 1
  - Next: `setStep(currentStep + 1)`, disabled based on step validation
  - Step 1: Next disabled until boat selected
  - Step 4: "Next" replaced by "Save" actions

### 4. Create `Step1BoatSelect.tsx` (`src/pages/configurator/Step1BoatSelect.tsx`)
- **Desktop layout (lg+):** Two-panel
  - Left (2/3 width): Boat grid (same cards as BoatsListPage but selection mode)
  - Right (1/3 width, sticky): Selected boat detail panel
- **Mobile layout:** Single column
  - Boat grid
  - Selected boat expands inline below the selected card

- **Boat cards in selection mode:**
  - Same design as BoatCard
  - Click → selected state: blue border (`ring-2 ring-primary`), checkmark overlay (top-right corner)
  - Click again → deselect (or click another card to switch)

- **Selected boat detail panel (desktop right sidebar):**
  - Hero image (large)
  - Boat name (Playfair Display)
  - Year + Brand
  - Base price (gold, large)
  - Key specs (first 4-5 specs in a mini-grid)
  - "Configure This Yacht →" button (primary, full width)

- **Selected boat inline (mobile):**
  - Appears directly below the selected card
  - Same content as sidebar but in horizontal card layout
  - "Configure This Yacht →" button

- **Search + filter:**
  - Search by name/brand (top of grid)
  - Filter tabs: All | New | Used
  - Same as BoatsListPage but simpler

- **Store interaction:**
  - Click card → `setBoat(boat)` in Zustand
  - "Configure This Yacht" or "Next" → `setStep(2)`

### 5. Navigation validation
- "Next" button in ConfiguratorPage: disabled unless `selectedBoat !== null`
- Visual feedback: grayed out + "Select a boat first" tooltip

## Verification Checklist
- [ ] Navigate to `/configurator` shows Step 1 with step indicator
- [ ] Step indicator shows "Select Boat" as active (blue circle)
- [ ] Boat grid displays all active boats
- [ ] Click boat card → blue border + checkmark
- [ ] Desktop: selected boat detail appears in right sidebar
- [ ] Mobile: selected boat detail appears inline below card
- [ ] Switch selection → sidebar/inline updates to new boat
- [ ] "Next" button disabled when no boat selected
- [ ] Click "Next" or "Configure This Yacht" → moves to Step 2
- [ ] Search by name filters correctly
- [ ] Category filter (All/New/Used) works
- [ ] Back button disabled on Step 1
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/pages/configurator/ConfiguratorPage.tsx` — full wizard container
- `src/pages/configurator/Step1BoatSelect.tsx` — boat selection step
- `src/components/configurator/StepIndicator.tsx` — progress indicator
- `src/stores/configurator-store.ts` — verify/update if needed
