# Session 5: Boats CRUD + Image Upload

## Prerequisites
- Session 4 complete (boats list + detail read-only, seed data)

## Goal
Full create/edit/delete boats with image management (upload, reorder, delete).

## Detailed Steps

### 1. Create `BoatForm.tsx` (`src/components/boats/BoatForm.tsx`)
Shared form component for create + edit:
- Uses `react-hook-form` with `zodResolver(boatSchema)`
- **Fields:**
  - Name (text input, required)
  - Brand (text input, default "Azimut")
  - Model (text input)
  - Year (number input, 2000-2030)
  - Base Price (number input with € formatting)
  - Category (select: New / Used)
  - Description HR / Description EN (textarea with HR/EN tab toggle)
- **Bilingual tabs:** A tab component that switches between HR and EN for description fields
- **Props:** `defaultValues` for edit mode, `onSubmit` callback, `isLoading` state

### 2. Create `BoatCreatePage.tsx` (`src/pages/boats/BoatCreatePage.tsx`)
- Page header: "Add New Boat"
- Renders `<BoatForm />` in create mode
- On submit: `supabase.from('boats').insert(data)`
- Set `created_by` to current user ID
- On success: toast "Boat created" + redirect to `/boats/{newId}`
- Cancel button → back to `/boats`

### 3. Edit mode on `BoatDetailPage.tsx`
- Add "Edit" button (admin only) → toggles edit mode
- In edit mode: hero section replaced by `<BoatForm defaultValues={boat} />`
- On submit: `supabase.from('boats').update(data).eq('id', boatId)`
- On success: toast "Boat updated" + exit edit mode
- Cancel → exit edit mode (discard changes)

### 4. Delete boat
- "Delete" button in action menu (admin only)
- Opens confirmation dialog: "Are you sure you want to delete {boat.name}?"
- Soft delete: `supabase.from('boats').update({ status: 'archived' }).eq('id', boatId)`
- On success: toast "Boat archived" + redirect to `/boats`
- Archived boats hidden from default list (already filtered by status='active')

### 5. Create `BoatImageGallery.tsx` with upload (`src/components/boats/BoatImageGallery.tsx`)
Upgrade the read-only gallery to support full image management (admin only):
- **Upload zone:**
  - Drag-and-drop area with dashed border
  - "Click to upload or drag images here" text
  - Accept: image/jpeg, image/png, image/webp
  - Max size: 10MB per image
- **Upload logic:**
  - Upload to Supabase Storage: `boat-images/{boat_id}/{uuid}.{ext}`
  - Get public URL after upload
  - Insert into `boat_images` table with category, sort_order
  - Show progress bar during upload
- **Gallery grid:**
  - 3-column grid of uploaded images
  - Each image: thumbnail + overlay with actions
  - Actions: Set as Primary (star icon), Delete (trash icon)
  - Primary image has gold star badge
- **Delete image:**
  - Confirmation dialog
  - Remove from Supabase Storage + delete from boat_images table

### 6. Boat specs management
On the Specs tab of BoatDetailPage (admin edit mode):
- "Add Spec" button per category
- Inline edit: click on spec → editable fields (label_hr, label_en, value)
- Delete spec: trash icon with confirmation
- Add new category: "Add Category" button → inline form

### 7. React Query mutations
Add mutations to `useBoats.ts`:
```typescript
export function useCreateBoat() { return useMutation({ ... }) }
export function useUpdateBoat() { return useMutation({ ... }) }
export function useDeleteBoat() { return useMutation({ ... }) }
```
All mutations should `invalidateQueries(['boats'])` on success.

## Verification Checklist
- [ ] Create a new boat → appears in grid
- [ ] Edit boat name → updates in detail
- [ ] Upload 3 images → display in gallery
- [ ] Set primary image → gold star badge
- [ ] Delete image → removed from gallery
- [ ] Delete boat → disappears from grid (soft delete, status='archived')
- [ ] Admin can CRUD, Sales cannot see edit/delete buttons
- [ ] Form validation: empty name shows error, negative price shows error
- [ ] Bilingual description tabs work (switch HR/EN)
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/components/boats/BoatForm.tsx` — new
- `src/pages/boats/BoatCreatePage.tsx` — full implementation
- `src/pages/boats/BoatDetailPage.tsx` — add edit mode + delete
- `src/components/boats/BoatImageGallery.tsx` — upload + management
- `src/hooks/useBoats.ts` — add mutations
