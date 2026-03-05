# Phase 3: Type Safety & Error Handling

**Procjena:** 2-3 dana
**Prioritet:** Nakon Phase 2, za dugoročnu maintainability

---

### Task 13: Zamijeniti `as unknown as` castove

**Problem:** Supabase response tipovi se castaju s `as unknown as AppType` na 10+ mjesta. Ovo skriva type mismatch greške između DB schema i app tipova. Ako se DB schema promijeni, TypeScript neće uhvatiti bug.
**Severity:** HIGH
**Fajlovi:**
- `src/hooks/useBoats.ts:70` — `return data as unknown as BoatWithDetails`
- `src/hooks/useQuotes.ts:147-151` — `return data as unknown as QuoteWithDetails & {...}`
- `src/hooks/useCompanies.ts:31` — `return data as unknown as (CompanyWithContacts & {...})[]`
- `src/hooks/useCompanies.ts:48-49` — `return data as unknown as CompanyWithContacts & {...}`
- `src/hooks/useCompanies.ts:69` — `return data as unknown as CompanyWithContacts[]`
- `src/hooks/useTemplateGroups.ts:34` — `return data as unknown as QuoteTemplateGroup[]`
- `src/hooks/useTemplateGroups.ts:56` — `return data as unknown as QuoteTemplateGroupWithDetails`
- `src/hooks/useTemplateGroups.ts:83` — `return data as unknown as QuoteTemplateGroupWithDetails[]`

**Primjer trenutnog koda:**
```typescript
// useBoats.ts:70
return data as unknown as BoatWithDetails
```

**Fix — Type guard pristup:**
```typescript
// src/lib/type-guards.ts
import type { BoatWithDetails, QuoteWithDetails } from '@/types'

/** Parse Supabase boat response into typed BoatWithDetails */
export function parseBoatWithDetails(data: unknown): BoatWithDetails {
  const d = data as Record<string, unknown>
  return {
    id: d.id as string,
    name: d.name as string,
    brand: d.brand as string,
    model: d.model as string | null,
    year: d.year as number | null,
    category: d.category as 'new' | 'used',
    base_price: Number(d.base_price),
    hero_image_url: d.hero_image_url as string | null,
    description_hr: d.description_hr as string | null,
    description_en: d.description_en as string | null,
    status: d.status as string,
    created_at: d.created_at as string,
    created_by: d.created_by as string | null,
    specs: Array.isArray(d.specs) ? d.specs : [],
    images: Array.isArray(d.images) ? d.images : [],
    equipment_categories: Array.isArray(d.equipment_categories) ? d.equipment_categories : [],
  }
}

// Korištenje:
// return parseBoatWithDetails(data)  // umjesto: return data as unknown as BoatWithDetails
```

**Alternativni pristup — Zod parsing:**
```typescript
import { z } from 'zod'

const BoatWithDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  // ... definirati prema app tipu
})

// return BoatWithDetailsSchema.parse(data)
```

**Koraci:**
1. Kreirati `src/lib/type-guards.ts` s parser funkcijama za svaki composite tip
2. Postupno zamijeniti `as unknown as` castove s odgovarajućim parserima
3. Početi s najkorištenijim tipovima (BoatWithDetails, QuoteWithDetails)
4. Koristiti Zod za validaciju ili ručne type guards — ovisi o preferenciji

**Verifikacija:**
- [ ] `npm run build` prolazi bez grešaka
- [ ] Simulirati DB schema promjenu — type guard hvata mismatch u runtime-u
- [ ] Nema regresija u app ponašanju

---

### Task 14: Ukloniti non-null assertions

**Problem:** Non-null assertions (`!`) na query parametrima skrivaju potencijalne null pointer greške. Ako se hook pozove bez ID-a unatoč `enabled` guard-u, app crashira.
**Severity:** MEDIUM
**Fajlovi:**
- `src/hooks/useBoats.ts:66` — `.eq('id', id!)`
- `src/hooks/useQuotes.ts:143` — `.eq('id', quoteId!)`
- `src/hooks/useCompanies.ts:44` — `.eq('id', id!)`
- `src/hooks/useTemplateGroups.ts:52` — `.eq('id', id!)`

**Trenutni kod:**
```typescript
// useBoats.ts:55-66
export function useBoat(id: string | undefined) {
  return useQuery<BoatWithDetails>({
    queryKey: ['boat', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boats')
        .select(`...`)
        .eq('id', id!)     // <-- non-null assertion
        .single()
      // ...
    },
    enabled: !!id,         // Guard postoji, ali nije dovoljno
  })
}
```

**Fix:**
```typescript
export function useBoat(id: string | undefined) {
  return useQuery<BoatWithDetails>({
    queryKey: ['boat', id],
    queryFn: async () => {
      if (!id) throw new Error('Boat ID is required')

      const { data, error } = await supabase
        .from('boats')
        .select(`...`)
        .eq('id', id)       // <-- sad je TypeScript sretan
        .single()
      // ...
    },
    enabled: !!id,
  })
}
```

**Koraci:**
1. Dodati explicit null check na početku svake `queryFn` koja koristi `!`
2. Zamijeniti sve `param!` s `param` (TypeScript će sad prihvatiti jer je check iznad)
3. Ponoviti za sve hookove koji koriste `enabled` pattern

**Verifikacija:**
- [ ] `npm run build` — nema TypeScript grešaka
- [ ] Sve stranice se normalno učitavaju
- [ ] ESLint ne javlja `no-non-null-assertion` upozorenja

---

### Task 15: Literal union types u supabase.ts

**Problem:** Supabase auto-generated tipovi koriste `string` umjesto literal union types za status, category, role polja. Ovo znači da TypeScript ne može uhvatiti pogreške kao `status: 'draf'` (typo).
**Severity:** MEDIUM
**Fajlovi:** `src/types/supabase.ts` (auto-generated), `src/types/index.ts` (app types)

**Trenutni kod (supabase.ts):**
```typescript
// Generičke string tipove za status, category itd.
// boats.Row.category → string (umjesto 'new' | 'used')
// quotes.Row.status → string (umjesto 'draft' | 'sent' | 'accepted' | 'rejected')
// profiles.Row.role → string (umjesto 'admin' | 'sales')
```

**Fix — Override u app types:**
```typescript
// src/types/index.ts — eksplicitni override
export type BoatStatus = 'active' | 'archived'
export type BoatCategory = 'new' | 'used'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type UserRole = 'admin' | 'sales'
export type ClientCategory = 'vip' | 'regular' | 'prospect'

// Koristiti u app tipovima:
export interface Boat {
  // ...
  status: BoatStatus
  category: BoatCategory
}
```

**Koraci:**
1. Provjeriti postoje li već literal union types u `src/types/index.ts`
2. Ako ne, definirati ih i koristiti u app interface-ovima
3. Regenerirati supabase tipove s `supabase gen types` i vidjeti mogu li se konfigurirati enums
4. Alternativno: koristiti Supabase Enums u DB umjesto text polja

**Verifikacija:**
- [ ] TypeScript hvata typo u status stringovima (npr. `'draf'` umjesto `'draft'`)
- [ ] `npm run build` prolazi
- [ ] Nema novih type grešaka

---

### Task 16: Error handling na mutacijama

**Problem:** Većina mutacija u `useEquipment` i `useSettings` nema `onError` handler. Ako mutacija failira, korisnik ne dobije nikakav feedback — greška se tiho proguta.
**Severity:** HIGH
**Fajlovi:**
- `src/hooks/useEquipment.ts` — svi mutation hookovi (8 mutacija bez onError)
- `src/hooks/useSettings.ts` — `useUpdateCompanySettings`, `useUpdateTerms`, `useUploadLogo`, `useRemoveLogo`, `useSetDefaultPDFTemplate` (5 mutacija bez onError)

**Trenutni kod:**
```typescript
// useEquipment.ts:8-25 — primjer
export function useCreateCategory(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EquipmentCategoryFormData) => {
      const { data: category, error } = await supabase
        .from('equipment_categories')
        .insert({ ...data, boat_id: boatId })
        .select()
        .single()
      if (error) throw error
      return category as EquipmentCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
    // ❌ Nema onError handlera
  })
}
```

**Fix — Toast-based error handling:**
```typescript
// Opcija 1: onError u svakoj mutaciji
onError: (error) => {
  toast.error(t('equipment.error'))
  console.error('Create category failed:', error)
},

// Opcija 2: Global error handler na QueryClient (App.tsx)
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        console.error('Mutation failed:', error)
        // Prikazati generičku toast poruku
      },
    },
  },
})
```

**Koraci:**
1. Dodati `onError` handler na sve mutacije u `useEquipment.ts` (8 mutacija)
2. Dodati `onError` handler na sve mutacije u `useSettings.ts` (5 mutacija)
3. Razmotriti globalnu strategiju (Opcija 2) za catch-all
4. Koristiti i18n ključeve za error poruke

**Verifikacija:**
- [ ] Simulirati network error → korisnik vidi toast s porukom
- [ ] Simulirati RLS violation → korisnik vidi razumljivu poruku
- [ ] `npm run build` prolazi

---

### Task 17: ConfiguratorDiscount Zod schema

**Problem:** `ConfiguratorDiscount` tip nema runtime validaciju. Discount values se proslijeđuju iz formi bez provjere — negativni postoci, popusti veći od 100%, ili prazni opisi mogu proći.
**Severity:** MEDIUM
**Fajlovi:** `src/lib/validators.ts`, `src/types/index.ts`

**Trenutni stanje:**
```typescript
// types/index.ts — samo TypeScript interface, nema runtime validacije
export interface ConfiguratorDiscount {
  id: string
  level: DiscountLevel
  type: DiscountType
  value: number
  equipmentItemId?: string
  description?: string
}
```

**Fix:**
```typescript
// validators.ts — dodati Zod schema
export const configuratorDiscountSchema = z.object({
  id: z.string().uuid(),
  level: z.enum(['boat', 'equipment_all', 'equipment_item']),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive('Discount must be positive'),
  equipmentItemId: z.string().uuid().optional(),
  description: z.string().max(200).optional(),
}).refine(
  (d) => d.type !== 'percentage' || d.value <= 100,
  { message: 'Percentage discount cannot exceed 100%' }
).refine(
  (d) => d.level !== 'equipment_item' || d.equipmentItemId !== undefined,
  { message: 'Item discount requires an equipment item' }
)

export type ConfiguratorDiscountData = z.infer<typeof configuratorDiscountSchema>
```

**Koraci:**
1. Dodati `configuratorDiscountSchema` u `validators.ts`
2. Validirati discount podatke prije dodavanja u store (`addDiscount` action)
3. Prikazati validation error u UI ako schema ne prolazi

**Verifikacija:**
- [ ] Pokušati dodati popust od 150% → validacija javlja grešku
- [ ] Pokušati dodati item discount bez equipment ID → validacija javlja grešku
- [ ] Normalni popusti (10%, €5000) rade bez promjena

---

### Task 18: useEffect dependency fix

**Problem:** `useEffect` u `EquipmentStep.tsx` ima eslint-disable za `react-hooks/exhaustive-deps`. Nedostajući dependency (`selectedEquipment`, `setSelectedEquipment`) znači da effect ne reagira na promjene tih vrijednosti. Zustand store actions su stabilni pa to nije bug u praksi, ali je anti-pattern.
**Severity:** LOW
**Fajlovi:** `src/pages/configurator/EquipmentStep.tsx:59`, `src/pages/configurator/EquipmentStep.tsx:88`

**Trenutni kod:**
```typescript
// EquipmentStep.tsx:38-59
useEffect(() => {
  if (!boatDetails?.equipment_categories) return
  const standardItems: EquipmentItem[] = []
  // ... select standard items ...
  if (changed) setSelectedEquipment(next)
}, [boatDetails?.equipment_categories]) // eslint-disable-line react-hooks/exhaustive-deps

// EquipmentStep.tsx:62-88
useEffect(() => {
  if (!templateGroup || !selectedBoat || !boatDetails?.equipment_categories || templateAppliedRef.current) return
  // ... apply template ...
}, [templateGroup, selectedBoat, boatDetails?.equipment_categories]) // eslint-disable-line react-hooks/exhaustive-deps
```

**Fix:**
```typescript
// Zustand actions su stabilni (ne mijenjaju referencu), pa ih je sigurno dodati
useEffect(() => {
  if (!boatDetails?.equipment_categories) return
  const standardItems: EquipmentItem[] = []
  for (const cat of boatDetails.equipment_categories) {
    for (const item of cat.items) {
      if (item.is_standard) standardItems.push(item)
    }
  }
  if (standardItems.length === 0) return
  const next = new Map(selectedEquipment)
  let changed = false
  for (const item of standardItems) {
    if (!next.has(item.id)) {
      next.set(item.id, item)
      changed = true
    }
  }
  if (changed) setSelectedEquipment(next)
}, [boatDetails?.equipment_categories, selectedEquipment, setSelectedEquipment])

// Za template effect — isti pristup + dodati addDiscount
useEffect(() => {
  if (!templateGroup || !selectedBoat || !boatDetails?.equipment_categories || templateAppliedRef.current) return
  templateAppliedRef.current = true
  // ...
}, [templateGroup, selectedBoat, boatDetails?.equipment_categories, selectedEquipment, setSelectedEquipment, addDiscount])
```

**Napomena:** Zustand `set*` akcije su referentially stable pa dodavanje u deps listu neće uzrokovati beskonačne petlje. Ali `selectedEquipment` (Map) se mijenja svaki put kad se oprema togglea, pa prvi effect treba biti pažljiv da ne uzrokuje loop — `changed` flag to već sprečava.

**Koraci:**
1. Dodati nedostajuće dependencies
2. Ukloniti `eslint-disable-line` komentare
3. Provjeriti da nema beskonačnih re-render petlji

**Verifikacija:**
- [ ] Equipment Step — standard items se auto-selektiraju jednom
- [ ] Template apply — primjenjuje se jednom, ne loopa
- [ ] `npm run lint` — nema exhaustive-deps upozorenja
