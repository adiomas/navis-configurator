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
