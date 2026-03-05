# Session 10: Configurator Step 3 — Client Data

## Prerequisites
- Session 9 complete (Step 2 equipment selection working)

## Goal
Client data form with existing client lookup (typeahead search) and manual entry, stored in Zustand.

## Detailed Steps

### 1. Create `ClientDropdown.tsx` (`src/components/configurator/ClientDropdown.tsx`)
- Typeahead search input
- On type (debounced 300ms): fetch companies from Supabase matching name/email
- Dropdown results: company name + primary contact name + email
- On select:
  - Auto-fill form fields from company + primary contact data
  - Store `companyId` and `contactId` in Zustand
  - Auto-set language from `company.preferred_language`
- "New Client" option at top of dropdown (or button):
  - Clears form for manual entry
  - Removes companyId/contactId from Zustand

### 2. Create `ClientForm.tsx` (`src/components/configurator/ClientForm.tsx`)
Form using `react-hook-form` + `zodResolver(clientFormSchema)`:
- **Search section:** `<ClientDropdown />` at top — "Search existing client or enter new"
- **Form fields:**
  - Full Name (required)
  - Email (required, email format validation)
  - Phone (optional)
  - Company Name (optional, auto-filled if existing client)
  - Notes (textarea, optional)
- **Quote language:** Radio buttons: HR / EN
  - Auto-set when existing client selected (from `preferred_language`)
  - User can override
- **Validation:** Zod schema from `lib/validators.ts`
  - Name required
  - Email required + valid format
  - Phone optional but valid format if provided

### 3. Create `Step3Client.tsx` (`src/pages/configurator/Step3Client.tsx`)
- **Layout:** Form centered on page (`max-w-2xl mx-auto`)
- Renders `<ClientForm />`
- **Prefill:** If editing existing quote, form pre-populated from Zustand `clientData`
- **Action buttons:**
  - "← Back" → Step 2 (equipment preserved)
  - "Next →" → Step 4 (validate form first)
  - "Save as Draft" → save quote immediately with status 'draft' (skip Step 4)

### 4. Store client data
- On form change: debounced save to Zustand `setClientData()`
- On "Next": validate form, then `setClientData()` and `setStep(4)`
- If existing client: store `companyId` and `contactId`

### 5. Handle "Save as Draft" from Step 3
- Validate minimum fields (name, email)
- Create quote with status 'draft' (same logic as Step 4 save, but skip review)
- Redirect to `/quotes/{id}`

## Verification Checklist
- [ ] Step 3 shows centered client form
- [ ] Type "Mor" in search → shows matching companies in dropdown
- [ ] Select company → auto-fills name, email, phone, company, language
- [ ] "New Client" option → clears form
- [ ] Manual entry: fill name + email → Next enabled
- [ ] Validation: submit without email → error shown inline
- [ ] Language radio: HR/EN toggles correctly
- [ ] Auto-set language when selecting existing client
- [ ] Back → Step 2, equipment selections preserved
- [ ] Next → Step 4, client data stored
- [ ] "Save as Draft" creates quote and redirects
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/pages/configurator/Step3Client.tsx` — new
- `src/components/configurator/ClientForm.tsx` — new
- `src/components/configurator/ClientDropdown.tsx` — new
