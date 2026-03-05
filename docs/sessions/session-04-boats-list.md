# Session 4: Boats List + Detail (Read-only)

## Prerequisites
- Session 3 complete (auth working)

## Goal
Boats catalog with grid view and detail pages showing specs, gallery, and equipment. Seeded with 6 Azimut boats.

## Detailed Steps

### 1. Create `useBoats.ts` hook (`src/hooks/useBoats.ts`)
```typescript
export function useBoats(filters?: { search?: string; category?: BoatCategory; status?: string }) {
  return useQuery({ queryKey: ['boats', filters], queryFn: ... })
}

export function useBoat(id: string) {
  return useQuery({ queryKey: ['boat', id], queryFn: ... })
  // Fetches boat with specs, images, equipment_categories (with items)
}
```

### 2. Seed 6 Azimut boats into Supabase
Insert via SQL or Supabase dashboard:

| Name | Base Price | Year | Category |
|------|-----------|------|----------|
| Azimut Grande 120 | €12,500,000 | 2025 | new |
| Azimut S8 | €4,200,000 | 2025 | new |
| Azimut Magellano 66 | €3,800,000 | 2024 | new |
| Azimut Verve 47 | €1,950,000 | 2025 | new |
| Azimut Flybridge 78 | €6,500,000 | 2024 | new |
| Azimut S7 | €3,200,000 | 2024 | new |

For each boat, add:
- 3 spec categories (Technical, Interior, Performance) with 4-5 specs each
- 1 hero image URL (use Azimut official imagery or placeholder)
- 5 equipment categories × 3-5 items each (mix of standard + optional)

### 3. Create `BoatCard.tsx` (`src/components/boats/BoatCard.tsx`)
- Hero image (aspect-ratio 16/10) with gradient overlay at bottom
- Boat name (font-display, white, over gradient)
- Brand + Year below image
- Base price (formatted: €12.500.000) — gold color
- Category badge (top-right): "New" green / "Used" amber
- Hover: subtle scale transform + shadow increase
- Click: navigate to `/boats/{id}`

### 4. Create `BoatGrid.tsx` (`src/components/boats/BoatGrid.tsx`)
- CSS Grid: 3 columns desktop (lg), 2 tablet (md), 1 mobile
- Gap: 6 (1.5rem)
- Renders array of `<BoatCard />`

### 5. Create `BoatsListPage.tsx` (`src/pages/boats/BoatsListPage.tsx`)
- **Header:** "Boat Catalog" title + "Add Boat" button (admin only, links to `/boats/new`)
- **Filters bar:**
  - Search input (by name/brand) — debounced 300ms
  - Category tabs: All | New | Used
  - Sort dropdown: Price ↑ | Price ↓ | Name | Year
- **Content:** `<BoatGrid>` with filtered/sorted boats
- **Loading:** Skeleton cards (3 cards with pulse animation)
- **Empty:** "No boats found" message

### 6. Create `BoatDetailPage.tsx` (`src/pages/boats/BoatDetailPage.tsx`)
- **Hero section:** Full-width hero image with dark gradient overlay
  - Boat name (large, Playfair Display)
  - Year + Brand
  - Base price (gold, large)
  - Action buttons: "Edit" + "Manage Equipment" (admin only)
- **Tabs:** Specifications | Gallery | Equipment
  - **Specs tab:** Grid of spec cards grouped by category
    - Category heading (e.g., "Technical Specifications")
    - 2-column grid of label: value pairs
  - **Gallery tab:** Image grid (masonry or uniform grid)
    - Click image → lightbox/modal with full-size view
    - Navigation arrows in lightbox
  - **Equipment tab:** Accordion per category (read-only view)
    - Category name as accordion trigger
    - Items listed with name + price
    - Standard items with green "Included" badge
- **Back button:** "← Back to Catalog"

### 7. Create `BoatImageGallery.tsx` (`src/components/boats/BoatImageGallery.tsx`)
- Read-only gallery grid (upload comes in Session 5)
- 3-column grid with click-to-enlarge

## Verification Checklist
- [ ] 6 boats render in grid with proper images and formatted prices
- [ ] Search by "Grande" shows only Grande 120
- [ ] Filter "New" shows all new boats
- [ ] Sort by Price ↓ shows Grande 120 first
- [ ] Click boat card → navigates to detail page
- [ ] Detail page hero shows boat info
- [ ] Specs tab displays grouped specifications
- [ ] Equipment tab shows accordion with items and prices
- [ ] Mobile: grid becomes 1 column
- [ ] Loading skeletons shown while data fetches
- [ ] "Add Boat" button visible for admin only
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/hooks/useBoats.ts`
- `src/pages/boats/BoatsListPage.tsx`
- `src/pages/boats/BoatDetailPage.tsx`
- `src/components/boats/BoatCard.tsx`
- `src/components/boats/BoatGrid.tsx`
- `src/components/boats/BoatImageGallery.tsx`

## Database: Seed Data
Run SQL to insert 6 boats with specs, images, and equipment. See design doc for full data.
