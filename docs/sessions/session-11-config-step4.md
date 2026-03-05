# Session 11: Configurator Step 4 — Review + Save ⚠️ HIGH RISK

## Prerequisites
- Sessions 8-10 complete (all 3 configurator steps working)

## Goal
Review screen showing complete quote summary with ability to save as draft or send. Quote saved to Supabase with snapshots.

## Detailed Steps

### 1. Create `ReviewSummary.tsx` (`src/components/configurator/ReviewSummary.tsx`)
Read-only summary of the entire quote:

**Section: Boat**
- Hero image (thumbnail)
- Name, year, brand
- Base price (formatted)

**Section: Equipment**
- Grouped by category
- Each category: heading + list of items
- Standard items: name + "Standard" badge (no price)
- Optional items: name + price
- Category subtotals

**Section: Discounts** (if any — will be empty until Session 16)
- List of applied discounts with descriptions and amounts

**Section: Price Breakdown**
- Base price: €X
- Equipment total: €Y
- Discounts: -€Z (if any)
- Divider
- **Grand Total: €(X+Y-Z)** — large font, gold accent, bold

**Section: Client**
- Name, email, phone, company
- Notes (if any)

**Section: Quote Settings**
- Language: HR or EN
- Currency: EUR

### 2. Create `Step4Review.tsx` (`src/pages/configurator/Step4Review.tsx`)
- Renders `<ReviewSummary />`
- **Action buttons (bottom):**
  - "← Back" → Step 3
  - "Save as Draft" → saves with status 'draft'
  - "Save & Send" → saves with status 'sent'
- **Loading state:** Show spinner while saving

### 3. Quote save logic (`src/hooks/useQuotes.ts` — partial, expand later)
Create `useSaveQuote()` mutation:

```typescript
async function saveQuote(data: SaveQuoteInput): Promise<Quote> {
  // 1. Generate quote number
  const lastQuote = await supabase
    .from('quotes')
    .select('quote_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  const quoteNumber = generateQuoteNumber(lastQuote?.data?.quote_number ?? null)

  // 2. Create company + contact if new client
  let companyId = data.clientData.companyId
  let contactId = data.clientData.contactId
  if (!companyId) {
    const { data: company } = await supabase
      .from('companies')
      .insert({ name: data.clientData.companyName || data.clientData.name, ... })
      .select()
      .single()
    companyId = company.id
    // Create contact
    const { data: contact } = await supabase
      .from('contacts')
      .insert({ company_id: companyId, full_name: data.clientData.name, ... })
      .select()
      .single()
    contactId = contact.id
  }

  // 3. Calculate final prices
  const breakdown = calculatePriceBreakdown(data.boat.base_price, selectedItems, discounts)

  // 4. Insert quote
  const { data: quote } = await supabase
    .from('quotes')
    .insert({
      quote_number: quoteNumber,
      boat_id: data.boat.id,
      company_id: companyId,
      contact_id: contactId,
      status: data.status, // 'draft' or 'sent'
      language: data.clientData.language,
      boat_base_price: data.boat.base_price,
      equipment_subtotal: breakdown.equipmentSubtotal,
      boat_discount: breakdown.boatDiscounts,
      equipment_discount: breakdown.equipmentItemDiscounts + breakdown.equipmentAllDiscounts,
      total_discount: breakdown.totalDiscount,
      total_price: breakdown.grandTotal,
      notes: data.clientData.notes,
      created_by: currentUserId,
      sent_at: data.status === 'sent' ? new Date().toISOString() : null,
      template_group_id: data.templateGroupId,
    })
    .select()
    .single()

  // 5. Insert quote_items (snapshot of equipment)
  const quoteItems = [...selectedEquipment.values()].map((item, i) => ({
    quote_id: quote.id,
    equipment_item_id: item.id,
    item_type: item.is_standard ? 'equipment_standard' : 'equipment_optional',
    name_hr: item.name_hr,
    name_en: item.name_en,
    category_name_hr: getCategoryName(item, 'hr'),
    category_name_en: getCategoryName(item, 'en'),
    price: item.price,
    item_discount: 0, // calculated from discounts
    sort_order: i,
  }))
  await supabase.from('quote_items').insert(quoteItems)

  // 6. Insert quote_discounts (snapshot)
  if (discounts.length > 0) {
    const quoteDiscounts = discounts.map((d, i) => ({
      quote_id: quote.id,
      discount_level: d.level,
      discount_type: d.type,
      value: d.value,
      equipment_item_id: d.equipmentItemId || null,
      description: d.description,
      sort_order: i,
    }))
    await supabase.from('quote_discounts').insert(quoteDiscounts)
  }

  // 7. Insert status history
  await supabase.from('quote_status_history').insert({
    quote_id: quote.id,
    old_status: null,
    new_status: data.status,
    changed_by: currentUserId,
  })

  return quote
}
```

### 4. After save
- Toast notification: "Quote NM-2025-001 saved successfully"
- Reset configurator store: `configuratorStore.reset()`
- Redirect to `/quotes/{quote.id}`

### 5. Error handling
- Network error → show toast error, keep on review page
- Validation error → show inline
- Duplicate quote number (race condition) → retry with next number

## Verification Checklist
- [ ] Review page shows all boat details correctly
- [ ] Equipment listed grouped by category with correct prices
- [ ] Price breakdown matches Step 2 totals
- [ ] Client data displayed correctly
- [ ] "Save as Draft" → creates quote with status 'draft'
- [ ] "Save & Send" → creates quote with status 'sent' + sent_at timestamp
- [ ] Quote number generated correctly: NM-{year}-001, incrementing
- [ ] Quote items contain snapshot data (names, prices at time of creation)
- [ ] New client → company + contact created in database
- [ ] Existing client → uses existing company_id + contact_id
- [ ] After save → redirected to `/quotes/{id}`
- [ ] Toast shows "Quote NM-2025-001 saved successfully"
- [ ] Configurator store reset after save
- [ ] Complete full wizard: select boat → equipment → client → review → save
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/pages/configurator/Step4Review.tsx` — new
- `src/components/configurator/ReviewSummary.tsx` — new
- `src/hooks/useQuotes.ts` — new (partial, save mutation)
- `src/lib/quote-number.ts` — verify (should already exist)
