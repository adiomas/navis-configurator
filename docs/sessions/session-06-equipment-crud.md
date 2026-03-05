# Session 6: Equipment Categories + Items CRUD

## Prerequisites
- Session 5 complete (boats CRUD with images)

## Goal
Full equipment management per boat — categories with items, create/edit/delete, bilingual names, pricing.

## Detailed Steps

### 1. Create `useEquipment.ts` hook (`src/hooks/useEquipment.ts`)
```typescript
// Queries
export function useEquipmentCategories(boatId: string) {
  // Fetches categories with nested items, sorted by sort_order
  return useQuery({
    queryKey: ['equipment', boatId],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipment_categories')
        .select('*, items:equipment_items(*)')
        .eq('boat_id', boatId)
        .order('sort_order')
      return data
    }
  })
}

// Mutations
export function useCreateCategory() { ... }
export function useUpdateCategory() { ... }
export function useDeleteCategory() { ... } // CASCADE deletes items
export function useCreateItem() { ... }
export function useUpdateItem() { ... }
export function useDeleteItem() { ... }
```
All mutations invalidate `['equipment', boatId]`.

### 2. Create `BoatEquipmentPage.tsx` (`src/pages/boats/BoatEquipmentPage.tsx`)
- **Header:**
  - Boat name (fetched)
  - "← Back to {boat.name}" link → `/boats/{id}`
  - "Add Category" button (top right)
- **Content:** List of equipment categories as accordion
- **Each category header:**
  - Category name (EN primary, HR secondary)
  - Item count badge: "5 items"
  - Actions: Edit (pencil icon), Delete (trash icon), Add Item (plus icon)
  - Expand/collapse arrow
- **Each item row (inside expanded category):**
  - Item name
  - Price (€ formatted, right-aligned)
  - "Standard" badge (green) if `is_standard`
  - Actions: Edit (pencil), Delete (trash)
- **Empty state:** "No equipment yet. Add a category to get started." with illustration

### 3. Create `EquipmentCategoryForm.tsx` (`src/components/equipment/EquipmentCategoryForm.tsx`)
Dialog modal for create/edit category:
- Fields: name_hr, name_en, sort_order (number)
- Zod validation via `equipmentCategorySchema`
- Create: `supabase.from('equipment_categories').insert({ boat_id, ...data })`
- Edit: `supabase.from('equipment_categories').update(data).eq('id', categoryId)`

### 4. Create `EquipmentItemForm.tsx` (`src/components/equipment/EquipmentItemForm.tsx`)
Dialog modal for create/edit item:
- **Fields:**
  - Name HR / Name EN (tabs for bilingual)
  - Description HR / Description EN (textarea, bilingual tabs)
  - Price (number input with EUR formatting — e.g., "45.000")
  - Is Standard (toggle switch)
- Zod validation via `equipmentItemSchema`
- Create: `supabase.from('equipment_items').insert({ category_id, ...data })`
- Edit: `supabase.from('equipment_items').update(data).eq('id', itemId)`

### 5. Delete category
- Confirmation dialog: "Delete category '{name}' and all {count} items?"
- `supabase.from('equipment_categories').delete().eq('id', categoryId)`
- CASCADE: all items under this category are also deleted

### 6. Delete item
- Confirmation dialog: "Delete '{name}'?"
- `supabase.from('equipment_items').delete().eq('id', itemId)`

### 7. Seed equipment data
For each of the 6 boats, insert via SQL:
- **Navigation** (5 items): GPS/Chartplotter (std), Radar (std), Satellite WiFi (opt, €45,000), AIS Transponder (std), Autopilot (std)
- **Comfort** (4 items): Air Conditioning (std), Wine Cooler (opt, €8,500), Jacuzzi (opt, €35,000), Underwater Lights (opt, €12,000)
- **Safety** (4 items): Life Rafts (std), EPIRB (std), Fire Suppression (std), Night Vision Camera (opt, €28,000)
- **Entertainment** (3 items): Bose Sound System (opt, €15,000), Satellite TV (opt, €22,000), Outdoor Cinema (opt, €18,000)
- **Tender & Toys** (3 items): Williams 345 Tender (opt, €85,000), Jet Ski (opt, €25,000), SeaBob (opt, €12,500)

Adjust prices proportionally per boat.

### 8. Create simple accordion UI component
If not using shadcn accordion yet, create a simple collapsible accordion in `src/components/ui/accordion.tsx` or use HTML details/summary with Tailwind styling.

## Verification Checklist
- [ ] Navigate to `/boats/{id}/equipment` shows categories + items
- [ ] Create category "Navigation" → appears in accordion
- [ ] Add item "Satellite WiFi €45.000" → appears under category
- [ ] Edit item name → updates
- [ ] Toggle standard on/off → badge updates
- [ ] Delete item → removed from list
- [ ] Delete category → all items also deleted
- [ ] Admin only can edit; Sales sees read-only view (no edit/delete buttons)
- [ ] Bilingual tabs (HR/EN) work on forms
- [ ] Price formatting consistent (€ prefix, dot thousands separator)
- [ ] Back link returns to boat detail page
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/hooks/useEquipment.ts` — new
- `src/pages/boats/BoatEquipmentPage.tsx` — full implementation
- `src/components/equipment/EquipmentCategoryForm.tsx` — new
- `src/components/equipment/EquipmentItemForm.tsx` — new
- `src/components/equipment/EquipmentAccordion.tsx` — new (optional)
