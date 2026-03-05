# Session 15: Quote Detail + Copy + Edit

## Prerequisites
- Session 14 complete (quotes list working)

## Goal
Quote detail page with full information, copy quote functionality, edit via configurator, and status timeline.

## Detailed Steps

### 1. Create `QuoteDetailPage.tsx` (`src/pages/quotes/QuoteDetailPage.tsx`)
- **Header:**
  - Quote number (large, monospaced): "NM-2025-001"
  - Status badge (large)
  - Created date + "by {name}"
- **Action buttons row:**
  - "Download PDF" (primary) — placeholder for Session 17
  - "Copy Quote" (secondary)
  - Status actions:
    - If draft: "Mark as Sent" button
    - If sent: "Accept" (green) + "Reject" (red) buttons
    - If accepted/rejected: "Revert to Draft" button
  - "Edit Quote" (secondary) — opens configurator with this quote's data

- **Detail sections (cards):**
  1. **Client Info Card:**
     - Company name (link to client detail)
     - Contact: name, email, phone, position
     - Quote language + currency
  2. **Boat Info Card:**
     - Hero image (medium size)
     - Name, brand, year
     - Base price
  3. **Equipment Breakdown:**
     - Grouped by category (from quote_items snapshot)
     - Standard items: name + "Standard" badge
     - Optional items: name + price
     - Category subtotals
  4. **Discount Breakdown** (if any):
     - List of discounts: description, type (% or €), amount
  5. **Price Summary Card** (highlighted):
     - Base price
     - Equipment total
     - Discounts
     - **Grand Total** (large, gold, bold)
  6. **Notes** (if any)

### 2. Create `QuoteTimeline.tsx` (`src/components/quotes/QuoteTimeline.tsx`)
- Visual timeline showing status changes
- Each entry: status badge + timestamp + changed by name
- Vertical line connecting events
- Most recent at top
- Data from `quote_status_history` table

### 3. Copy quote logic
On "Copy Quote" click:
1. Create new quote with new number (next in sequence)
2. Copy all quote data (boat, client, prices, language, currency)
3. Copy all quote_items (new IDs, same data)
4. Copy all quote_discounts (new IDs, same data)
5. Status = 'draft'
6. created_by = current user
7. Insert initial status_history entry
8. Toast: "Quote copied as NM-2025-XXX"
9. Redirect to new quote detail (`/quotes/{newId}`)
10. Original quote unchanged

### 4. Edit quote logic
On "Edit Quote" click:
1. Load quote data into Zustand configurator store:
   - `setBoat(quote.boat)`
   - `setSelectedEquipment(...)` from quote_items
   - `setClientData(...)` from quote company/contact
   - Add discounts from quote_discounts
   - `setStep(1)`
2. Navigate to `/configurator`
3. User goes through wizard (can modify anything)
4. On save: creates **NEW** quote (old one unchanged)
5. Toast: "New quote NM-2025-XXX created from edit"

### 5. Status change
- Each status change:
  - Update quote.status
  - Set timestamp (sent_at, accepted_at, rejected_at)
  - Insert quote_status_history entry
  - Invalidate React Query cache
  - Toast notification

## Verification Checklist
- [ ] Quote detail shows all data correctly (boat, equipment, client, prices)
- [ ] Equipment grouped by category with correct prices
- [ ] Price summary matches quote data
- [ ] Status badge correct
- [ ] Timeline shows status changes with timestamps and who changed
- [ ] "Copy Quote" → creates new quote with new number, original unchanged
- [ ] Copied quote redirects to new detail page
- [ ] "Edit Quote" → opens configurator with preselected boat + equipment + client
- [ ] Edit → save → creates NEW quote (not overwrites old)
- [ ] Status buttons: Draft → Mark as Sent → Accept/Reject
- [ ] Each status change adds timeline entry
- [ ] Client name links to client detail page
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/pages/quotes/QuoteDetailPage.tsx` — full implementation
- `src/components/quotes/QuoteTimeline.tsx` — new
- `src/hooks/useQuotes.ts` — add copyQuote, useQuote detail query
- `src/stores/configurator-store.ts` — may need `loadFromQuote()` action
