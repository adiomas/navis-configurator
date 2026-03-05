# Session 22: Settings — Company + Terms

## Prerequisites
- Session 21 complete (dashboard analytics)

## Goal
Company settings management that feeds into PDF generation and quotes. Logo upload, IBAN for barcodes, terms & conditions.

## Detailed Steps

### 1. Create `SettingsPage.tsx` with tabs (`src/pages/settings/SettingsPage.tsx`)
- Tab navigation: Company | Terms | PDF Templates | Users (admin only)
- Each tab renders a settings section
- Only accessible by admin users

### 2. Company tab
Form for company_settings table:
- **Company Details:**
  - Name (e.g., "Navis Marine d.o.o.")
  - OIB / Tax ID
  - Address, City, Postal Code
  - Phone, Email, Website
- **Payment Details:**
  - IBAN (used in HUB-3 barcode and EPC QR)
  - BIC/SWIFT code
  - Bank Name
- **Logo:**
  - Current logo preview
  - Upload button: accepts SVG, PNG, JPG (max 5MB)
  - Upload to Supabase Storage: `company-assets/logo.{ext}`
  - After upload: update `logo_url` in company_settings
- **Defaults:**
  - Default currency (dropdown, default EUR)
  - Default language (radio: HR / EN)
- **Save button:** Upserts into company_settings (singleton row)
- **Toast:** "Settings saved" on success

### 3. Terms tab
- **Bilingual editor:**
  - HR tab: large textarea for Croatian terms
  - EN tab: large textarea for English terms
  - Alternatively: rich text editor (if desired, but textarea is simpler)
- **Preview:** "Preview in PDF" button
  - Shows how terms will appear in the Detailed/Luxury PDF template
  - Uses a sample layout (not full PDF, just the terms section)
- **Default terms pre-filled:**
  - If terms are empty, provide default template text:
    - HR: "Ponuda vrijedi 30 dana od datuma izdavanja. Cijene su izražene u EUR..."
    - EN: "This quote is valid for 30 days from the date of issue. Prices are in EUR..."
- **Save button:** Updates company_settings terms_hr / terms_en

### 4. PDF Templates tab
- **List of templates:** Compact, Detailed, Luxury
- Each shown as a card:
  - Template name
  - Preview thumbnail (static image or mini-render)
  - "Default" badge on the default template
  - "Set as Default" button
- **Set default:** Updates pdf_templates table `is_default` flag
- **Configuration (future):** Placeholder for custom colors, layout options
  - For now: just show template descriptions and default toggle

### 5. Settings data flow
- Settings loaded via `useCompanySettings()` hook (React Query, cached)
- PDF generator reads from this cache
- Barcode generation reads IBAN/BIC from settings
- Quote creation uses default_currency and default_language

### 6. Seed company_settings
If no company_settings row exists, create one on first Settings page load:
```sql
INSERT INTO company_settings (name, email, default_currency, default_language)
VALUES ('Navis Marine d.o.o.', 'info@navis-marine.com', 'EUR', 'hr')
ON CONFLICT DO NOTHING;
```

### 7. Hooks
Update `src/hooks/useSettings.ts`:
```typescript
export function useCompanySettings() { ... } // already exists
export function useUpdateCompanySettings() {
  return useMutation({
    mutationFn: async (data: Partial<CompanySettings>) => {
      await supabase.from('company_settings').upsert({ id: existingId, ...data })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-settings'] })
  })
}
export function usePDFTemplates() { ... }
export function useSetDefaultTemplate() { ... }
```

## Verification Checklist
- [ ] Settings page loads with tabs (Company, Terms, PDF Templates)
- [ ] Company tab: fill in name, OIB, address → save → persists on refresh
- [ ] Upload logo → preview shows → appears in next generated PDF
- [ ] IBAN saved → HUB-3 barcode uses it in PDF
- [ ] Terms tab: edit HR terms → save → appears in PDF
- [ ] Terms tab: edit EN terms → save → appears in PDF
- [ ] PDF Templates tab: see 3 templates, set default
- [ ] Default currency/language used in new quotes
- [ ] Only admin can access settings
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/pages/settings/SettingsPage.tsx` — full implementation with tabs
- `src/hooks/useSettings.ts` — expand with mutations
- `src/components/settings/CompanySettingsForm.tsx` — new
- `src/components/settings/TermsEditor.tsx` — new
- `src/components/settings/PDFTemplatesList.tsx` — new
