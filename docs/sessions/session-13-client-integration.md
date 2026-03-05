# Session 13: Client Integration

## Prerequisites
- Session 12 complete (CRM working)

## Goal
Clients integrated throughout the app — configurator uses real company data, quotes link to clients, dashboard shows top clients.

## Detailed Steps

### 1. Update Step 3 ClientDropdown to use real data
- `ClientDropdown.tsx` should fetch from `companies` table (not mock data)
- Search by company name and contact email
- Show primary contact info in dropdown results
- On select: populate form with real data from company + primary contact

### 2. Auto-set preferences when selecting existing client
- When existing company selected in configurator Step 3:
  - Auto-set quote language from `company.preferred_language`
  - Auto-set currency from `company.preferred_currency`
  - User can still override these in the form

### 3. Client link on quote detail page
- On QuoteDetailPage (Session 15), the client section should show:
  - Company name as a link → `/clients/{company_id}`
  - Contact name, email, phone

### 4. Quote detail shows company info
- When viewing a quote, display:
  - Company name + category badge
  - Contact: name, email, phone, position

### 5. Dashboard "Top Clients" widget
- On DashboardPage (placeholder for now, implement data in Session 20):
  - "Top Clients" card showing top 5 companies by total quote revenue
  - Company name + total revenue + quote count

### 6. Quotes list: filter by client
- On QuotesListPage (Session 14), add client filter:
  - Dropdown to filter quotes by company
  - Show company name in quotes table

### 7. Bidirectional navigation
- From client detail → click quote → goes to quote detail
- From quote detail → click client → goes to client detail
- From configurator Step 3 → "View client details" link (if existing client)

## Verification Checklist
- [ ] Configurator Step 3: search shows real companies from database
- [ ] Select company → form auto-fills with company data + primary contact
- [ ] Select company → preferred language auto-set
- [ ] Creating quote with existing client: company_id and contact_id saved
- [ ] Creating quote with new client: new company + contact created
- [ ] Quote detail → click company name → navigates to client detail
- [ ] Client detail → quote history table → click quote → navigates to quote detail
- [ ] Quotes list shows company name column
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/components/configurator/ClientDropdown.tsx` — update to use real Supabase data
- `src/components/configurator/ClientForm.tsx` — auto-set preferences
- `src/pages/configurator/Step3Client.tsx` — integration
- `src/pages/quotes/QuoteDetailPage.tsx` — client link (preparation)
- `src/pages/clients/ClientDetailPage.tsx` — quote history links
