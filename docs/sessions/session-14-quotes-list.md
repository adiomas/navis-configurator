# Session 14: Quotes List + Status Workflow

## Prerequisites
- Session 13 complete (client integration)
- Quotes can be created from configurator

## Goal
Complete quotes management with data table, status badges, filtering, pagination, and status change workflow.

## Detailed Steps

### 1. Create `useQuotes.ts` hook — expand (`src/hooks/useQuotes.ts`)
```typescript
export function useQuotes(filters?: {
  search?: string
  status?: QuoteStatus
  companyId?: string
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select(`
          *,
          boat:boats(id, name, hero_image_url),
          company:companies(id, name),
          contact:contacts(id, full_name),
          created_by_profile:profiles!quotes_created_by_fkey(id, full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.search) query = query.or(`quote_number.ilike.%${filters.search}%`)
      if (filters?.companyId) query = query.eq('company_id', filters.companyId)

      // Pagination
      const page = filters?.page ?? 0
      const perPage = filters?.perPage ?? 10
      query = query.range(page * perPage, (page + 1) * perPage - 1)

      return await query
    }
  })
}

export function useQuote(id: string) {
  // Full quote with items, discounts, status_history
}

export function useUpdateQuoteStatus() {
  return useMutation({
    mutationFn: async ({ quoteId, newStatus, userId }) => {
      const { data: quote } = await supabase
        .from('quotes')
        .select('status')
        .eq('id', quoteId)
        .single()

      await supabase
        .from('quotes')
        .update({
          status: newStatus,
          ...(newStatus === 'sent' ? { sent_at: new Date().toISOString() } : {}),
          ...(newStatus === 'accepted' ? { accepted_at: new Date().toISOString() } : {}),
          ...(newStatus === 'rejected' ? { rejected_at: new Date().toISOString() } : {}),
        })
        .eq('id', quoteId)

      await supabase.from('quote_status_history').insert({
        quote_id: quoteId,
        old_status: quote.status,
        new_status: newStatus,
        changed_by: userId,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] })
  })
}
```

### 2. Create `QuotesListPage.tsx` (`src/pages/quotes/QuotesListPage.tsx`)
- **Data table columns:**
  - Quote # (monospaced, e.g., "NM-2025-001")
  - Boat (name + small image)
  - Client (company name)
  - Created By (salesperson name)
  - Status (badge)
  - Amount (formatted price, right-aligned)
  - Date (formatted)
  - Actions (icon buttons)
- **Filter tabs:** All | Draft | Sent | Accepted | Rejected
  - Show count per status
- **Search:** By quote number, client name, boat name
- **Sort:** Date (default desc), Amount, Status
- **Pagination:** 10 per page, page navigation (Previous/Next + page numbers)
- **Row click:** Navigate to `/quotes/{id}`
- **Loading:** Table skeleton rows

### 3. Create `QuoteStatusBadge.tsx` (`src/components/quotes/QuoteStatusBadge.tsx`)
Color-coded badge:
- Draft → gray background, "Draft" text
- Sent → blue background, "Sent" text
- Accepted → green background, "Accepted" text
- Rejected → red background, "Rejected" text

### 4. Quick actions per row
- **View** (eye icon) → navigate to detail
- **Change status** (dropdown):
  - Draft → can go to Sent
  - Sent → can go to Accepted or Rejected
  - Accepted/Rejected → can go back to Draft
- **Copy** (duplicate icon) → will be implemented in Session 15

### 5. Create "New Quote" button
- Links to `/configurator` (resets configurator store first)

## Verification Checklist
- [ ] All quotes listed with correct data in table
- [ ] Status badges show correct colors
- [ ] Filter by "Sent" → only sent quotes shown
- [ ] Search by quote number "001" → finds matching quote
- [ ] Sort by amount descending works
- [ ] Pagination: page 1 shows first 10, page 2 shows next batch
- [ ] Click row → navigates to quote detail
- [ ] Change status: draft → sent → badge updates immediately
- [ ] "New Quote" button → navigates to configurator
- [ ] Mobile: table scrolls horizontally or hides some columns
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/hooks/useQuotes.ts` — expand with list query + status mutation
- `src/pages/quotes/QuotesListPage.tsx` — full implementation
- `src/components/quotes/QuoteStatusBadge.tsx` — new
- `src/components/quotes/QuoteActions.tsx` — new (quick actions)
