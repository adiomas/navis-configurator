# Session 16: Discount System ⚠️ HIGH RISK

## Prerequisites
- Session 15 complete (quotes detail + copy + edit working)

## Goal
Full 3-level discount system: boat base discounts, equipment-wide discounts, and per-item discounts. Real-time price recalculation.

## Detailed Steps

### 1. Create `DiscountEditor.tsx` (`src/components/configurator/DiscountEditor.tsx`)
Appears in Configurator Step 2 (below equipment list) and Step 4 (review page, editable).

**Three sections:**

**1. Boat Base Discount**
- "Add Discount" button
- Each discount row:
  - Type toggle: "%" or "€" (radio/tabs)
  - Value input (number)
  - Description (optional text, e.g., "Boot Fair 2025 special")
  - Remove button (X)
- Multiple discounts stack (shown as list)

**2. Equipment Total Discount**
- Same UI as boat base discount section
- Applies to entire equipment subtotal (after per-item discounts)

**3. Item Discounts**
- Shown inline next to each equipment item in `EquipmentSelector`
- Click "Add discount" on an item → opens mini-form:
  - Type: % or €
  - Value
  - Description
- Shows applied discount below item price: "~~€45.000~~ €40.500 (-10%)"

### 2. Update `lib/pricing.ts`
Already implements the logic (from Session 1). Verify full flow:
```
Base price:              €12.500.000
  ↳ Fair discount -10%:   -€1.250.000
  ↳ Special deal:           -€50.000
Boat final:              €11.200.000

Equipment total:            €170.000
  ↳ WiFi -5%:               -€2.250
Equipment after items:      €167.750
  ↳ Package discount -3%:    -€5.033
Equipment final:            €162.717

GRAND TOTAL:             €11.362.717
```

**Discount stacking rules:**
- Percentage discounts applied before fixed amounts (within same level)
- Boat discounts: applied to boat base price
- Item discounts: applied per individual item
- Equipment-all discounts: applied to equipment total after item discounts
- All amounts clamp at 0 (cannot go negative)

### 3. Update `PriceSummary.tsx`
Show full discount breakdown:
- Base price line
- If boat discounts: indented discount lines with descriptions
- Boat final price line
- Equipment subtotal line
- If item discounts: indented per-item discount lines
- Equipment after item discounts
- If equipment-all discounts: indented lines
- Equipment final
- Divider
- **Grand Total** (large, gold)

### 4. Update `Step4Review.tsx` / `ReviewSummary.tsx`
- Show complete discount breakdown in price section
- Each discount: description, type, value, calculated amount
- "Edit Discounts" link → goes back to Step 2

### 5. Quote save: store discounts
- Save each discount to `quote_discounts` table (already implemented in Session 11)
- Fields: quote_id, discount_level, discount_type, value, equipment_item_id, description, sort_order

### 6. Quote detail: show discounts
- On QuoteDetailPage, show discount section with all applied discounts
- Group by level (boat / equipment-all / equipment-item)

### 7. Copy quote preserves discounts
- When copying quote (Session 15), also copy all quote_discounts entries

### 8. Store integration
- `addDiscount(discount)` and `removeDiscount(id)` already in Zustand store
- Generate temporary UUID for each discount (client-side ID)
- On save: map to quote_discounts insert format

## Verification Checklist
- [ ] Add 10% boat discount → total recalculates correctly
- [ ] Add €5.000 equipment-all discount → correct calculation
- [ ] Add 5% on single equipment item → item price and total update
- [ ] Stack 2 discounts on boat (10% + €50.000) → both apply, percentage first
- [ ] Price summary shows full breakdown with all discount lines
- [ ] Remove discount → total recalculates
- [ ] Discounts saved in quote_discounts table
- [ ] Quote detail shows discount breakdown
- [ ] Copy quote preserves all discounts
- [ ] Edit quote loads discounts into configurator
- [ ] Negative total impossible (clamps at 0)
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/components/configurator/DiscountEditor.tsx` — new
- `src/components/configurator/PriceSummary.tsx` — update with discount breakdown
- `src/components/configurator/EquipmentSelector.tsx` — per-item discount UI
- `src/components/configurator/ReviewSummary.tsx` — discount section
- `src/pages/configurator/Step2Equipment.tsx` — integrate DiscountEditor
- `src/pages/quotes/QuoteDetailPage.tsx` — discount display
- `src/lib/pricing.ts` — verify (should already handle all cases)
