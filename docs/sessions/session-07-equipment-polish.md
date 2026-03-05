# Session 7: Equipment Polish + Copy

## Prerequisites
- Session 6 complete (equipment CRUD working)

## Goal
Polished equipment UX with copy between boats, drag-drop reorder, bulk actions, and consistent formatting.

## Detailed Steps

### 1. Copy equipment from another boat
- Add "Copy from..." dropdown button at top of BoatEquipmentPage
- Dropdown shows all other active boats (excluding current)
- On select: confirmation dialog showing "Copy {X} categories and {Y} items from {boat.name}?"
- Logic:
  - Fetch all categories + items from source boat
  - Insert copies with new UUIDs, same data, target boat_id
  - Items linked to new category IDs
  - Preserve sort_order
- On success: toast "Copied {X} categories and {Y} items" + refetch

### 2. Drag-drop reorder for categories
- Add drag handle (grip icon) on left of each category
- Dragging category reorders visually
- On drop: update `sort_order` for all affected categories
- Use HTML5 drag-and-drop or a simple move up/down button approach

### 3. Drag-drop reorder for items within category
- Same pattern within expanded category
- Update `sort_order` for items in that category

### 4. Bulk actions
- Add checkbox to each item row
- When items selected, show bulk action bar: "Delete {n} items"
- Confirmation: "Delete {n} selected items?"
- Batch delete via `supabase.from('equipment_items').delete().in('id', selectedIds)`

### 5. Price formatting consistency
- All price inputs: format on blur (e.g., user types "45000" → displays "€45.000")
- Use consistent `formatPrice()` from `lib/formatters.ts` everywhere
- Price inputs should strip formatting on focus (show raw number)

### 6. Empty states
- No categories: "No equipment yet. Add a category to get started." + icon illustration
- Category with no items: "No items in this category. Add the first item."

### 7. Equipment summary on boat detail page
- On the Equipment tab of BoatDetailPage, show summary:
  - Total categories count
  - Total items count (standard + optional)
  - Total optional equipment value (sum of non-standard item prices)
  - "Manage Equipment →" link (admin only)

## Verification Checklist
- [ ] Copy equipment from Grande 120 to new boat → all categories + items copied
- [ ] Reorder categories via drag/move → sort_order updates persist
- [ ] Reorder items within category → persists
- [ ] Select 3 items → bulk delete → all removed
- [ ] Price formatting: "45000" → "€45.000" on blur
- [ ] Empty states show when no data
- [ ] Equipment summary on boat detail shows correct counts
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/pages/boats/BoatEquipmentPage.tsx` — copy, reorder, bulk actions
- `src/hooks/useEquipment.ts` — add copyEquipment, reorder mutations
- `src/components/equipment/EquipmentAccordion.tsx` — drag-drop, bulk select
- `src/pages/boats/BoatDetailPage.tsx` — equipment summary on Equipment tab
