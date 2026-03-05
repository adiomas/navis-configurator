# Session 17: PDF — Compact Template ⚠️ HIGH RISK

## Prerequisites
- Session 16 complete (discount system working)
- Full quote with equipment + discounts can be created and viewed

## Goal
Downloadable PDF quote with compact single-page layout, bilingual support, and HUB-3 barcode for Croatian payments.

## Detailed Steps

### 1. Install and configure `@react-pdf/renderer`
Already installed in Session 1. Verify import works:
```typescript
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer'
```

Register fonts for PDF:
```typescript
import { Font } from '@react-pdf/renderer'
Font.register({
  family: 'Plus Jakarta Sans',
  fonts: [
    { src: '/fonts/PlusJakartaSans-Regular.ttf' },
    { src: '/fonts/PlusJakartaSans-Bold.ttf', fontWeight: 'bold' },
  ]
})
Font.register({
  family: 'Playfair Display',
  fonts: [
    { src: '/fonts/PlayfairDisplay-Regular.ttf' },
    { src: '/fonts/PlayfairDisplay-Bold.ttf', fontWeight: 'bold' },
  ]
})
```
Download font files to `public/fonts/`.

### 2. Create `PDFCompactTemplate.tsx` (`src/components/pdf/PDFCompactTemplate.tsx`)
Single A4 page layout using @react-pdf/renderer:

**Header (top of page):**
- Left: Navis Marine logo (Image component)
- Center/Right: "QUOTE" / "PONUDA" heading + quote number + date

**Client Info Block:**
- "Bill To:" label
- Company name, contact name, email, phone
- Address (if available)

**Boat Info:**
- Boat name + year + brand (one line, bold)
- Base price

**Equipment List:**
- Section heading: "Equipment" / "Oprema"
- Grouped by category:
  - Category name (bold, underlined)
  - Items: name + price (right-aligned)
  - Standard items: name + "Std." label (no price)
- Compact: small font, minimal spacing

**Discount Breakdown (if any):**
- "Discounts:" heading
- Each discount: description + amount

**Price Summary Box:**
- Light gray background box
- Base price: €X
- Equipment total: €Y
- Discounts: -€Z
- Divider line
- **GRAND TOTAL: €(X+Y-Z)** (bold, large)

**Footer:**
- Company info: Navis Marine d.o.o., address, phone, email
- Terms summary (1-2 lines from company_settings.terms_hr/en)
- Small print: "This quote is valid for 30 days"

### 3. Bilingual content
- If `quote.language === 'hr'`:
  - Labels: "PONUDA", "Datum", "Kupac", "Oprema", "Ukupno"
  - Equipment names: `name_hr`
  - Category names: `category_name_hr`
  - Terms: `terms_hr`
- If `quote.language === 'en'`:
  - Labels: "QUOTE", "Date", "Bill To", "Equipment", "Total"
  - Equipment names: `name_en`
  - Category names: `category_name_en`
  - Terms: `terms_en`

### 4. Create HUB-3 barcode (`src/lib/barcode.ts`)
```bash
npm install pdf417-generator
```
HUB-3 barcode format for Croatian payments:
```typescript
export function generateHUB3Barcode(data: {
  amount: number
  senderName: string
  senderAddress: string
  recipientName: string
  recipientAddress: string
  recipientIBAN: string
  model: string // "HR99"
  reference: string // quote number
  description: string
}): string {
  // Format HUB-3 data string according to FINA specification
  // Generate PDF417 barcode
  // Return as base64 data URL
}
```

### 5. Add HUB-3 barcode to PDF
- Only for HR language quotes
- Bottom of price section
- Label: "Skenirajte za uplatu"
- Barcode image rendered via `<Image src={barcodeDataUrl} />`

### 6. Create `lib/pdf-generator.ts` (`src/lib/pdf-generator.ts`)
```typescript
export async function generatePDF(
  quote: QuoteWithDetails,
  template: 'compact' | 'detailed' | 'luxury',
  companySettings: CompanySettings,
): Promise<Blob> {
  const Component = template === 'compact' ? PDFCompactTemplate : ...
  const doc = <Component quote={quote} settings={companySettings} />
  const blob = await pdf(doc).toBlob()
  return blob
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

### 7. Add "Download PDF" button on QuoteDetailPage
- Button: "Download PDF" with download icon
- On click:
  1. Show loading spinner on button
  2. Fetch company settings (React Query)
  3. Call `generatePDF(quote, 'compact', settings)`
  4. Call `downloadPDF(blob, `NM-2025-001_compact.pdf`)`
- Template selector dropdown: for now only "Compact" available

### 8. Create `useSettings.ts` hook (`src/hooks/useSettings.ts`)
```typescript
export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('*').single()
      return data
    }
  })
}
```

## Verification Checklist
- [ ] Click "Download PDF" on a quote → downloads .pdf file
- [ ] Open PDF: header with logo, quote number, date
- [ ] Client info section shows correct data
- [ ] Boat info correct
- [ ] Equipment list grouped by category with prices
- [ ] Standard items marked as "Std."
- [ ] Discounts section shows (if any applied)
- [ ] Price summary box with correct totals
- [ ] Footer with company info
- [ ] HR quote → Croatian labels + HUB-3 barcode present
- [ ] EN quote → English labels, no HUB-3 barcode
- [ ] Price calculations match UI values
- [ ] PDF filename: `NM-2025-001_compact.pdf`
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/components/pdf/PDFCompactTemplate.tsx` — new
- `src/components/pdf/BarcodeHUB3.tsx` — new
- `src/lib/barcode.ts` — new
- `src/lib/pdf-generator.ts` — new
- `src/hooks/useSettings.ts` — new
- `src/pages/quotes/QuoteDetailPage.tsx` — add Download PDF button
- `public/fonts/` — font files for PDF rendering
