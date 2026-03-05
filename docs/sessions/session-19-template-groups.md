# Session 19: Quote Template Groups (Fairs/Events)

## Prerequisites
- Session 18 complete (all PDF templates working)

## Goal
Predefined quote template groups for fairs/events with special pricing, preselected equipment, and automatic discounts.

## Detailed Steps

### 1. Create admin page: `/settings/groups`
Add tab to SettingsPage or separate route `/settings/groups`:
- **List view:**
  - Table: group name, description, valid from/until, status (active/inactive), actions
  - "Create Group" button
  - Edit/Delete per row

### 2. Create group form (dialog or full page)
# Session 18: PDF — Detailed + Luxury Templates + EPC QR ⚠️ HIGH RISK

## Prerequisites
- Session 17 complete (compact PDF working)

## Goal
Two more PDF templates (Detailed 2-page, Luxury 2-3 page) and EPC QR code for SEPA payments on English quotes.

## Detailed Steps

### 1. Create `PDFDetailedTemplate.tsx` (`src/components/pdf/PDFDetailedTemplate.tsx`)
Two A4 pages:

**Page 1:**
- Header: logo, quote number, date (same as compact)
- Client info block (larger, more prominent)
- Boat info with specs table:
  - Boat name, brand, year, base price
  - Specifications table (from boat_specs): 2-column grid
  - Grouped by spec category (Technical, Interior, Performance)

**Page 2:**
- Equipment table:
  - Full-width table with columns: Item, Category, Type (Std/Opt), Price
  - Grouped by category with category headers
  - Alternating row colors for readability
- Discount breakdown section (if any)
- Price summary (same layout as compact but larger)
- Terms & conditions:
  - Full text from `company_settings.terms_hr` or `terms_en`
  - Small font, justified text
- Signature lines:
  - Two columns: "Seller" / "Buyer" (or "Prodavatelj" / "Kupac")
  - Line for signature + "Date:" + line
- Payment barcode (HUB-3 for HR, EPC QR for EN)
- Footer: company details

### 2. Create `PDFLuxuryTemplate.tsx` (`src/components/pdf/PDFLuxuryTemplate.tsx`)
Two to three A4 pages, premium design:

**Page 1 — Cover:**
- Gold accent bar at top (gradient `#c9a961` → `#d4bc7e`, 4px height)
- Full-width hero boat image (takes ~60% of page height)
  - Dark gradient overlay (bottom half)
  - Boat name overlaid (Playfair Display, large, white)
  - Year + Brand (smaller, below name)
- Below image:
  - Quote number + date (right-aligned, small)
  - Client info card: semi-transparent navy background box
    - Company name, contact name, email
- Gold accent bar at bottom

**Page 2 — Details:**
- Boat specifications grid:
  - 4-column layout of spec cards
  - Each card: label + value, navy border-left accent
- Equipment breakdown:
  - Table with elegant styling
  - Category headers in navy background
  - Alternating row background (white / very light gray)
  - Standard items: italic, no price
  - Optional items: name + price
- Price summary box:
  - Navy background card
  - Gold accent text for total
  - Full discount breakdown

**Page 3 (if needed) — Terms + Signatures:**
- Terms & conditions in 2-column layout (6-point grid)
- Signature area: two signature blocks side by side
- Payment info + barcodes (HUB-3 or EPC QR)
- Footer: gold accent line + company details + logo small

### 3. Add EPC QR code (`src/components/pdf/BarcodeEPC.tsx`)
```bash
npm install qrcode
```

EPC QR (SEPA Credit Transfer) format:
```typescript
export function generateEPCQR(data: {
  bic: string
  recipientName: string
  iban: string
  amount: number
  reference: string
  text: string
}): Promise<string> {
  // Build EPC QR payload:
  // BCD\n002\n1\nSCT\n{BIC}\n{Name}\n{IBAN}\nEUR{amount}\n\n\n{reference}\n{text}
  // Generate QR code as data URL
}
```
- For EN language quotes
- Label: "Scan for SEPA payment"
- QR code rendered as Image in PDF

### 4. Update template selector on QuoteDetailPage
- Dropdown (or radio buttons): Compact / Detailed / Luxury
- Default: from `pdf_templates` table (or Compact if not set)
- Selected template persists during session

### 5. PDF preview modal
- "Preview" button next to "Download"
- Opens modal showing PDF pages as rendered images
- Pages rendered via `@react-pdf/renderer` `<PDFViewer>` component (if supported in browser)
- Or: render to blob → create object URL → embed in iframe
- "Download" button in preview modal
- Close button

### 6. Update barcode logic
- HR quotes: HUB-3 barcode (PDF417) — from Session 17
- EN quotes: EPC QR code (SEPA transfer)
- Both: only shown if company_settings has IBAN configured

## Verification Checklist
- [ ] Detailed template: 2 pages, specs table, equipment table, signatures
- [ ] Luxury template: cover page with hero image + gold accents
- [ ] Luxury page 2: specs grid, equipment table, navy price box
- [ ] Luxury page 3: terms, signatures (if content overflows)
- [ ] EPC QR code appears on EN quotes
- [ ] HUB-3 barcode appears on HR quotes
- [ ] Template selector dropdown works (switch between 3 templates)
- [ ] PDF preview modal opens and shows pages
- [ ] Download from preview modal works
- [ ] All 3 templates in HR language → Croatian labels
- [ ] All 3 templates in EN language → English labels
- [ ] Fonts render correctly in all templates
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/components/pdf/PDFDetailedTemplate.tsx` — new
- `src/components/pdf/PDFLuxuryTemplate.tsx` — new
- `src/components/pdf/BarcodeEPC.tsx` — new
- `src/lib/barcode.ts` — add EPC QR generation
- `src/lib/pdf-generator.ts` — update to support all 3 templates
- `src/pages/quotes/QuoteDetailPage.tsx` — template selector + preview modal
- **Basic info:**
  - Name (e.g., "Boot Düsseldorf 2025")
  - Description (textarea)
  - Valid From (date picker)
  - Valid Until (date picker)
  - Active (toggle)

### 3. Group boat configuration
- **Select boats to include:**
  - Multi-select from all active boats (checkboxes or transfer list)
  - For each selected boat: optional "Special Price" override
    - If set: this price replaces boat.base_price when using this group
    - If null: use default base price

### 4. Group equipment configuration
- **Per selected boat:**
  - Show equipment items (accordion by category)
  - Checkbox each item to pre-select it for quotes using this group
  - Optional special price per item
  - Standard items always included (not configurable)

### 5. Group discounts
- Define discounts that auto-apply when using this group:
  - Discount level: boat_base / equipment_all
  - Type: percentage / fixed
  - Value
  - Description (e.g., "Fair special: 10% on base price")
- Multiple discounts per group

### 6. Database operations
- Create: insert into `quote_template_groups`, `quote_template_group_boats`, `quote_template_group_equipment`, `quote_template_group_discounts`
- Update: upsert group + related records
- Delete: cascade delete all related records

### 7. Configurator integration
- **Step 1 — "Start from Template" button/dropdown** at top of page:
  - Shows active groups within their valid date range
  - Selecting a group:
    1. Filters boat grid to only show boats in this group
    2. Sets `templateGroupId` in Zustand store
  - "Clear template" option to go back to full catalog

- **Step 2 — Auto-configure:**
  - When template group is active:
    - Equipment items from group config are pre-checked
    - Special prices shown instead of default prices
    - Group discounts auto-added to discount list
  - User can still:
    - Add/remove optional equipment
    - Modify discounts (add their own, remove group ones)

- **Quote save:**
  - `template_group_id` stored on the quote
  - Can be used later for analytics (performance per campaign)

### 8. Create hooks
```typescript
export function useTemplateGroups() { ... }
export function useTemplateGroup(id: string) { ... }
export function useCreateTemplateGroup() { ... }
export function useUpdateTemplateGroup() { ... }
export function useDeleteTemplateGroup() { ... }
```

## Verification Checklist
- [ ] Create "Boot 2025" group with 2 boats + predefined equipment + 10% discount
- [ ] Group appears in list with correct dates and status
- [ ] Edit group → changes saved
- [ ] Configurator Step 1: "Start from Template" dropdown shows active groups
- [ ] Select group → only group boats shown in grid
- [ ] Select boat → Step 2: equipment pre-checked per group config
- [ ] Special prices shown where configured
- [ ] Group discounts auto-applied
- [ ] User can modify selections (add/remove equipment, edit discounts)
- [ ] Complete wizard → quote saved with template_group_id
- [ ] Admin only can manage groups
- [ ] Expired groups (past valid_until) not shown in configurator
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/pages/settings/TemplateGroupsPage.tsx` — new (or tab in SettingsPage)
- `src/components/settings/TemplateGroupForm.tsx` — new
- `src/hooks/useTemplateGroups.ts` — new
- `src/pages/configurator/Step1BoatSelect.tsx` — add "Start from Template"
- `src/pages/configurator/Step2Equipment.tsx` — auto-configure from group
- `src/stores/configurator-store.ts` — templateGroupId already exists
- `src/router.tsx` — add /settings/groups route
