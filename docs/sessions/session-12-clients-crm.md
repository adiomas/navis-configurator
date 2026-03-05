# Session 12: Clients CRM

## Prerequisites
- Session 11 complete (configurator saves quotes with client data)

## Goal
Full CRM with company management, contacts, category/lead tracking, and quote history per client.

## Detailed Steps

### 1. Create `useCompanies.ts` hook (`src/hooks/useCompanies.ts`)
```typescript
export function useCompanies(filters?: { search?: string; category?: ClientCategory }) {
  return useQuery({
    queryKey: ['companies', filters],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('*, contacts(*), quotes:quotes(count)')
        .order('name')
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      if (filters?.category) query = query.eq('client_category', filters.category)
      return (await query).data
    }
  })
}

export function useCompany(id: string) {
  // Fetch company with contacts, and related quotes
}

export function useCreateCompany() { ... }
export function useUpdateCompany() { ... }
export function useDeleteCompany() { ... }
```

### 2. Create `useContacts.ts` hook (`src/hooks/useContacts.ts`)
```typescript
export function useContacts(companyId: string) { ... }
export function useCreateContact() { ... }
export function useUpdateContact() { ... }
export function useDeleteContact() { ... }
```

### 3. Create `ClientsListPage.tsx` (`src/pages/clients/ClientsListPage.tsx`)
- **Data table columns:**
  - Company name (bold, primary link)
  - Primary contact name + email
  - Category badge (VIP=gold, Regular=blue, Prospect=gray)
  - Lead source
  - Quotes count
  - Created date
  - Actions (View, Edit, Delete)
- **Filters:**
  - Search by name/email (debounced)
  - Category tabs: All | VIP | Regular | Prospect
  - Sort: Name | Quotes count | Created date
- **"Add Company" button** (top right)
- **Row click:** Navigate to `/clients/{id}`
- **Loading:** Table skeleton
- **Empty:** "No clients yet. Add your first company."

### 4. Create `CompanyForm.tsx` (`src/components/clients/CompanyForm.tsx`)
Dialog modal for create/edit company:
- **Fields:**
  - Company Name (required)
  - Registration Number (OIB)
  - Address, City, Postal Code, Country
  - Phone, Email, Website
  - Client Category (dropdown: VIP / Regular / Prospect)
  - Lead Source (dropdown: Fair / Referral / Website / Cold Call / Other)
  - Preferred Language (radio: HR / EN)
  - Preferred Currency (default EUR)
  - Tags (multi-input: type + enter to add tag)
  - Notes (textarea)
- Zod validation via `companySchema`

### 5. Create `ContactForm.tsx` (`src/components/clients/ContactForm.tsx`)
Dialog modal for create/edit contact:
- Fields: Full Name (required), Email, Phone, Position, Is Primary (toggle)
- Zod validation via `contactSchema`

### 6. Create `ClientDetailPage.tsx` (`src/pages/clients/ClientDetailPage.tsx`)
- **Company info card** (top):
  - All company details in a grid layout
  - Category badge (prominent)
  - "Edit" button (opens CompanyForm in edit mode)
- **Contacts section:**
  - List of contacts (cards or table)
  - Each: name, email, phone, position, primary badge
  - "Add Contact" button
  - Edit/Delete per contact
- **Quote history section:**
  - Table of all quotes for this company
  - Columns: Quote #, Boat, Status badge, Amount, Date
  - Row click → navigate to quote detail
  - "No quotes yet" empty state
- **Tags display:** Colored pills

### 7. Create `ClientCategoryBadge.tsx` (`src/components/clients/ClientCategoryBadge.tsx`)
- VIP: gold background + "VIP" text
- Regular: blue background + "Regular" text
- Prospect: gray background + "Prospect" text

## Verification Checklist
- [ ] Clients list shows all companies with correct data
- [ ] Search by "Moreau" → shows matching company
- [ ] Filter by VIP → only VIP companies shown
- [ ] Create company "Test Co" → appears in list
- [ ] Edit company name → updates
- [ ] Delete company → removed from list
- [ ] Client detail shows company info + contacts + quote history
- [ ] Add contact → appears in contacts list
- [ ] Primary contact has "Primary" badge
- [ ] Quote history shows related quotes with correct status badges
- [ ] VIP/Regular/Prospect badges display correctly
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/hooks/useCompanies.ts` — new
- `src/hooks/useContacts.ts` — new
- `src/pages/clients/ClientsListPage.tsx` — full implementation
- `src/pages/clients/ClientDetailPage.tsx` — full implementation
- `src/components/clients/CompanyForm.tsx` — new
- `src/components/clients/ContactForm.tsx` — new
- `src/components/clients/ClientCategoryBadge.tsx` — new
