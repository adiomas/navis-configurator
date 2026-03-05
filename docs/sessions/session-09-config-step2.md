# Session 9: Configurator Step 2 — Equipment Selection ⚠️ HIGH RISK

## Prerequisites
- Session 8 complete (Step 1 boat selection working)
- Equipment data seeded for all boats

## Goal
Equipment selection with category accordion, checkboxes, real-time pricing sidebar, and mobile floating price bar.

## Detailed Steps

### 1. Create `EquipmentSelector.tsx` (`src/components/configurator/EquipmentSelector.tsx`)
- Fetches equipment categories + items for the selected boat
- **Accordion layout:** One accordion per equipment category
  - Category header: name + item count + optional equipment value subtotal
  - Expanded: list of equipment items

- **Standard items:**
  - Checkbox checked + disabled (cannot uncheck)
  - Green "Included" badge
  - Price shown but grayed out (included in base)

- **Optional items:**
  - Checkbox (unchecked by default)
  - Item name + description (if available)
  - Price (right-aligned, €-formatted)
  - Click anywhere on row toggles checkbox (not just the checkbox itself)

- **Selected state:**
  - Checked items have light blue background highlight
  - Count badge on category header updates: "3/5 selected"

- **Store interaction:**
  - Toggle checkbox → `configuratorStore.toggleEquipment(item)`
  - Standard items auto-added to selection (always included)

### 2. Create `PriceSummary.tsx` (`src/components/configurator/PriceSummary.tsx`)
**Desktop (right sidebar, sticky at top):**
- Boat thumbnail image + name
- Divider
- "Base Price:" + formatted price
- "Selected Equipment:" section
  - Scrollable list of selected optional items (name + price)
  - If empty: "No optional equipment selected"
- "Equipment Subtotal:" + sum
- Divider
- **"Grand Total:"** — large, bold, gold color (`text-gold`)
- "Next →" button at bottom of sidebar

**Mobile (floating bar at bottom):**
- Fixed position bar at bottom of screen
- Left: "Total: €X.XXX.XXX" (large text)
- Right: "Next →" button
- Tap on total → expands upward to show full breakdown (same as desktop sidebar)
- Backdrop behind expanded view

### 3. Update `lib/pricing.ts`
Already exists from Session 1. Verify it handles:
```typescript
calculatePriceBreakdown(basePrice, selectedEquipment, discounts) → PriceBreakdown
```
For Step 2, discounts are empty (added in Step 4 / Session 16), so:
- `grandTotal = basePrice + sum(selectedOptionalItems.price)`

### 4. Create `Step2Equipment.tsx` (`src/pages/configurator/Step2Equipment.tsx`)
- **Desktop layout:** Two-panel
  - Left (2/3): `<EquipmentSelector />`
  - Right (1/3, sticky): `<PriceSummary />`
- **Mobile layout:**
  - Full-width `<EquipmentSelector />`
  - Floating `<PriceSummary />` bar at bottom

- **Search:** Optional search input above accordion to filter items by name
- **Real-time updates:** Every toggle recalculates totals via `useMemo` using `calculatePriceBreakdown`

### 5. Step navigation
- "Back" → returns to Step 1 with boat selection preserved
- "Next" → moves to Step 3 (no minimum selection required — 0 optional items is valid)

### 6. Performance
- Use `useMemo` for price calculations (recalculate only when selectedEquipment changes)
- Accordion items render lazily (only expanded category renders full item list)

## Verification Checklist
- [ ] Step 2 shows all equipment categories for the selected boat
- [ ] Standard items checked + disabled with "Included" badge
- [ ] Click optional item row → checkbox toggles
- [ ] Price summary updates in real-time on every toggle
- [ ] Select 0 items → total equals base price only
- [ ] Select 3 items → total = base + sum of 3 item prices
- [ ] Deselect 1 → total updates immediately
- [ ] Desktop: right sidebar shows full breakdown, sticky on scroll
- [ ] Mobile: floating bar at bottom shows total + Next button
- [ ] Mobile: tap total → expands to show full breakdown
- [ ] Back → Step 1, boat still selected
- [ ] Next → Step 3
- [ ] Search filters equipment items by name
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/pages/configurator/Step2Equipment.tsx` — new
- `src/components/configurator/EquipmentSelector.tsx` — new
- `src/components/configurator/PriceSummary.tsx` — new
- `src/lib/pricing.ts` — verify (should already work)
