# Phase 2: Performance optimizacije

**Procjena:** 3-5 dana
**Prioritet:** Nakon Phase 1, prije značajnijeg rasta korisnika

---

### Task 7: Dashboard RPC za agregacije

**Problem:** `useDashboard` dohvaća SVE ponude i radi sve agregacije client-side (status counts, revenue by month, top boats, salesperson performance, campaign data, conversion funnel, monthly trend). Za 100+ ponuda ovo je nepotrebno sporo i troši bandwidth.
**Severity:** HIGH
**Fajlovi:** `src/hooks/useDashboard.ts:94-357`

**Trenutni kod:**
```typescript
// useDashboard.ts:97-113 — dohvaća SVE quote podatke s relacijama
const quotesQuery = useQuery({
  queryKey: ['dashboard', 'quotes', timeRange],
  queryFn: async () => {
    let query = supabase
      .from('quotes')
      .select('id, status, total_price, created_at, boat_id, created_by, boat:boats(name), company:companies(name), created_by_profile:profiles(full_name), template_group_id, template_group:quote_template_groups(name)')
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },
  staleTime: 60 * 1000,
})

// useDashboard.ts:160-320 — 160 linija client-side agregacija u useMemo
const aggregated = useMemo(() => {
  // ... status counts, revenue by month, top boats, salesperson perf...
}, [quotesQuery.data])
```

**Fix — Supabase RPC:**
```sql
-- Migracija: create_dashboard_stats_rpc.sql
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_date_from timestamptz DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  WITH filtered AS (
    SELECT * FROM quotes
    WHERE (p_date_from IS NULL OR created_at >= p_date_from)
  ),
  stats AS (
    SELECT
      count(*) as total_quotes,
      count(*) FILTER (WHERE status IN ('draft', 'sent')) as active_quotes,
      CASE
        WHEN count(*) FILTER (WHERE status IN ('accepted', 'rejected')) > 0
        THEN round(
          count(*) FILTER (WHERE status = 'accepted')::numeric /
          count(*) FILTER (WHERE status IN ('accepted', 'rejected')) * 100, 1
        )
        ELSE 0
      END as acceptance_rate,
      coalesce(sum(total_price) FILTER (WHERE status = 'accepted'), 0) as total_revenue,
      CASE
        WHEN count(*) > 0
        THEN round(coalesce(sum(total_price), 0)::numeric / count(*), 2)
        ELSE 0
      END as avg_quote_value,
      count(*) FILTER (WHERE status = 'draft') as draft_count,
      count(*) FILTER (WHERE status = 'sent') as sent_count,
      count(*) FILTER (WHERE status = 'accepted') as accepted_count,
      count(*) FILTER (WHERE status = 'rejected') as rejected_count
    FROM filtered
  ),
  revenue_by_month AS (
    SELECT
      to_char(created_at, 'YYYY-MM') as month,
      sum(total_price) as revenue
    FROM filtered
    WHERE status = 'accepted' AND total_price > 0
    GROUP BY to_char(created_at, 'YYYY-MM')
    ORDER BY month
  ),
  top_boats AS (
    SELECT
      b.name as boat_name,
      sum(f.total_price) as revenue,
      count(*) as quote_count
    FROM filtered f
    JOIN boats b ON b.id = f.boat_id
    WHERE f.status = 'accepted' AND f.total_price > 0
    GROUP BY b.name
    ORDER BY revenue DESC
    LIMIT 5
  )
  SELECT json_build_object(
    'stats', (SELECT row_to_json(stats) FROM stats),
    'revenueByMonth', (SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) FROM revenue_by_month r),
    'topBoats', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM top_boats t)
  ) INTO result;

  RETURN result;
END;
$$;
```

```typescript
// useDashboard.ts — zamjena za stats dio
const statsQuery = useQuery({
  queryKey: ['dashboard', 'stats', timeRange],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      p_date_from: dateFrom,
    })
    if (error) throw error
    return data as DashboardRPCResult
  },
  staleTime: 60 * 1000,
})
```

**Koraci:**
1. Kreirati RPC funkciju s osnovnim agregacijama (stats, revenue, top boats)
2. Dodati salesperson + campaign agregacije u isti RPC ili odvojeni
3. Refaktorirati `useDashboard.ts` da koristi RPC umjesto `useMemo` agregacija
4. Zadržati `recentQuery` i `equipmentQuery` odvojeno (mali dataseti)

**Verifikacija:**
- [ ] Dashboard prikazuje iste brojke kao prije
- [ ] Network tab: 1 RPC poziv umjesto dohvaćanja svih quotes
- [ ] Responsivnost dashboarda ostaje ista

---

### Task 8: useBoat over-fetch (equipment)

**Problem:** `useBoat()` dohvaća specs, images I equipment u jednom query-u. Kad se koristi na stranicama koje ne trebaju equipment (npr. boat detail view bez configuratora), dohvaća nepotrebne podatke.
**Severity:** MEDIUM
**Fajlovi:** `src/hooks/useBoats.ts:54-75`

**Trenutni kod:**
```typescript
// useBoats.ts:57-67
const { data, error } = await supabase
  .from('boats')
  .select(`
    *,
    specs:boat_specs(*),
    images:boat_images(*),
    equipment_categories(*, items:equipment_items(*))
  `)
  .eq('id', id!)
  .single()
```

**Fix:**
```typescript
// Novi hook: useBoatEquipment
export function useBoatEquipment(boatId: string | undefined) {
  return useQuery<EquipmentCategoryWithItems[]>({
    queryKey: ['boat', boatId, 'equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*, items:equipment_items(*)')
        .eq('boat_id', boatId!)
        .order('sort_order')
      if (error) throw error
      return data as EquipmentCategoryWithItems[]
    },
    enabled: !!boatId,
    staleTime: 5 * 60 * 1000,
  })
}

// useBoat — ukloniti equipment_categories iz select-a
export function useBoat(id: string | undefined) {
  return useQuery<BoatWithDetails>({
    queryKey: ['boat', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boats')
        .select('*, specs:boat_specs(*), images:boat_images(*)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as BoatWithDetails
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}
```

**Koraci:**
1. Kreirati `useBoatEquipment(boatId)` hook
2. Koristiti ga u `EquipmentStep.tsx` i equipment management stranicama
3. Iz `useBoat` ukloniti equipment join (ili ga ostaviti kao opciju)
4. Ažurirati tipove ako je potrebno

**Verifikacija:**
- [ ] Boat detail stranica učitava brže (bez equipment podataka)
- [ ] Equipment Step i dalje prikazuje opremu ispravno
- [ ] Equipment management radi kao prije

---

### Task 9: N+1 quote status counts

**Problem:** `useQuoteStatusCounts` dohvaća SVE quote redove da bi prebrojao statuse client-side. S rastom broja ponuda, ovo je sve sporije.
**Severity:** MEDIUM
**Fajlovi:** `src/hooks/useQuotes.ts:73-98`

**Trenutni kod:**
```typescript
// useQuotes.ts:73-98
export function useQuoteStatusCounts(templateGroupId?: string) {
  return useQuery({
    queryKey: ['quotes', 'status-counts', templateGroupId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select('status')  // dohvaća SVE redove

      if (templateGroupId) {
        query = query.eq('template_group_id', templateGroupId)
      }

      const { data, error } = await query
      if (error) throw error

      // Client-side count
      const counts: Record<string, number> = { all: 0, draft: 0, sent: 0, accepted: 0, rejected: 0 }
      for (const row of data ?? []) {
        counts.all++
        counts[row.status] = (counts[row.status] ?? 0) + 1
      }
      return counts
    },
    staleTime: 30 * 1000,
  })
}
```

**Fix — SQL GROUP BY:**
```typescript
export function useQuoteStatusCounts(templateGroupId?: string) {
  return useQuery({
    queryKey: ['quotes', 'status-counts', templateGroupId ?? 'all'],
    queryFn: async () => {
      // Koristimo RPC ili raw SQL za efikasan GROUP BY
      const { data, error } = await supabase.rpc('get_quote_status_counts', {
        p_template_group_id: templateGroupId ?? null,
      })
      if (error) throw error
      return data as Record<string, number>
    },
    staleTime: 30 * 1000,
  })
}
```

```sql
-- RPC funkcija
CREATE OR REPLACE FUNCTION get_quote_status_counts(p_template_group_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'all', count(*),
    'draft', count(*) FILTER (WHERE status = 'draft'),
    'sent', count(*) FILTER (WHERE status = 'sent'),
    'accepted', count(*) FILTER (WHERE status = 'accepted'),
    'rejected', count(*) FILTER (WHERE status = 'rejected')
  )
  FROM quotes
  WHERE (p_template_group_id IS NULL OR template_group_id = p_template_group_id);
$$;
```

**Koraci:**
1. Kreirati RPC funkciju za status count
2. Zamijeniti client-side count u `useQuoteStatusCounts`
3. Isti pristup za `useTemplateGroupQuoteCounts` (useQuotes.ts:100-122)

**Verifikacija:**
- [ ] Status tab counts na Quotes stranici prikazuju iste brojke
- [ ] Network tab: nema dohvaćanja svih quote redova za brojanje

---

### Task 10: useCompanies over-fetch

**Problem:** `useCompanies` dohvaća `*` (sve stupce) + sve kontakte za svaku tvrtku u list view-u. Za prikaz liste trebaju samo name, category, email, i quote count.
**Severity:** LOW
**Fajlovi:** `src/hooks/useCompanies.ts:11-35`

**Trenutni kod:**
```typescript
// useCompanies.ts:14-19
let query = supabase
  .from('companies')
  .select('*, contacts(*), quotes:quotes(count), created_by')
  .eq('status', 'active')
  .order('name')
```

**Fix:**
```typescript
let query = supabase
  .from('companies')
  .select('id, name, email, phone, client_category, city, country, created_at, contacts(id, full_name, is_primary), quotes:quotes(count)')
  .eq('status', 'active')
  .order('name')
```

**Koraci:**
1. Specificirati samo potrebne stupce u `.select()`
2. Iz contacts dohvaćati samo `id`, `full_name`, `is_primary`
3. Ažurirati tip ako je potrebno

**Verifikacija:**
- [ ] Client list prikazuje sve podatke kao prije
- [ ] Network payload je manji (provjeriti u DevTools)

---

### Task 11: Lazy-load bwip-js

**Problem:** `bwip-js` library (za HUB-3 barkod) se bundle-a u main chunk iako se koristi samo pri PDF generiranju za HR ponude. Dodaje ~150KB na initial load.
**Severity:** MEDIUM
**Fajlovi:** `src/lib/barcode.ts` (import na vrhu fajla)

**Fix:**
```typescript
// barcode.ts — dynamic import
export async function generateHUB3Barcode(
  quoteNumber: string,
  totalAmount: number,
  companyName: string,
  settings: CompanySettings,
  language: string,
): Promise<string | null> {
  // Lazy load bwip-js samo kad je potreban
  const bwipjs = await import('bwip-js')

  // ... ostatak implementacije ostaje isti
}
```

**Koraci:**
1. Zamijeniti top-level `import bwipjs from 'bwip-js'` s dynamic `import()` unutar funkcije
2. Provjeriti da se bwip-js koristi samo u `generateHUB3Barcode`
3. Verificirati bundle size prije i nakon

**Verifikacija:**
- [ ] `npm run build` — provjeriti chunk sizes, bwip-js u odvojenom chunku
- [ ] HR ponuda PDF — HUB-3 barkod se generira ispravno
- [ ] EN ponuda PDF — bwip-js se NE učitava

---

### Task 12: Template groups lightweight query

**Problem:** `useTemplateGroups()` na list view-u dohvaća boats, equipment i discounts relacije — a list prikazuje samo name, datume i count-ove.
**Severity:** LOW
**Fajlovi:** `src/hooks/useTemplateGroups.ts:19-38`

**Trenutni kod:**
```typescript
// useTemplateGroups.ts:22-32
const { data, error } = await supabase
  .from('quote_template_groups')
  .select(`
    *,
    boats:quote_template_group_boats(id),
    equipment:quote_template_group_equipment(id),
    discounts:quote_template_group_discounts(id)
  `)
  .order('created_at', { ascending: false })
```

**Fix:**
```typescript
// Novi hook za list view
export function useTemplateGroupsSummary() {
  return useQuery({
    queryKey: ['templateGroups', 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_template_groups')
        .select('id, name, description, valid_from, valid_until, is_active, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

**Koraci:**
1. Kreirati `useTemplateGroupsSummary()` hook za list view
2. Koristiti postojeći `useTemplateGroups()` samo gdje su relacije potrebne
3. Dodati count subquery ako je potreban za prikaz

**Verifikacija:**
- [ ] Template groups lista se učitava brže
- [ ] Detail view i dalje ima sve podatke
- [ ] Network payload za listu je manji
