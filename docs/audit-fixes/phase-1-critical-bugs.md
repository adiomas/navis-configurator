# Phase 1: Kritični bugovi

**Procjena:** 1-2 dana
**Prioritet:** Popraviti PRIJE sljedećeg deploya

---

### Task 1: Quote number race condition

**Problem:** Dva korisnika mogu istovremeno dohvatiti isti `lastQuote`, generirati isti quote number, i jedan insert će ili failati (ako je unique constraint) ili kreirati duplikat.
**Severity:** CRITICAL
**Fajlovi:** `src/hooks/useQuotes.ts:223-230`, `src/hooks/useQuotes.ts:341-348`, `src/lib/quote-number.ts:1-15`

**Trenutni kod:**
```typescript
// useQuotes.ts:341-348 (useCreateQuote)
const { data: lastQuote } = await supabase
  .from('quotes')
  .select('quote_number')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

const quoteNumber = generateQuoteNumber(lastQuote?.quote_number ?? null)
```

**Fix — Supabase RPC:**
```sql
-- Migracija: create_generate_quote_number_rpc.sql
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  current_year text := EXTRACT(YEAR FROM NOW())::text;
  prefix text := 'NM-' || current_year || '-';
  last_number text;
  next_seq int;
BEGIN
  -- Lock the quotes table row to prevent concurrent reads
  SELECT quote_number INTO last_number
  FROM quotes
  WHERE quote_number LIKE prefix || '%'
  ORDER BY quote_number DESC
  LIMIT 1
  FOR UPDATE;

  IF last_number IS NULL THEN
    next_seq := 1;
  ELSE
    next_seq := COALESCE(
      NULLIF(substring(last_number FROM length(prefix) + 1), '')::int, 0
    ) + 1;
  END IF;

  RETURN prefix || LPAD(next_seq::text, 3, '0');
END;
$$;
```

```typescript
// useQuotes.ts — zamijeniti oba mjesta (linija 223 i 341)
const { data: quoteNumber, error: numError } = await supabase.rpc('generate_quote_number')
if (numError) throw numError
```

**Koraci:**
1. Kreirati Supabase migraciju s RPC funkcijom
2. Zamijeniti client-side generaciju s `supabase.rpc('generate_quote_number')` na oba mjesta (useCopyQuote i useCreateQuote)
3. Dodati unique constraint na `quotes.quote_number` ako ne postoji
4. Ukloniti `src/lib/quote-number.ts` ako se više nigdje ne koristi

**Verifikacija:**
- [ ] Otvoriti app u dva browser taba, kliknuti "Create Quote" istovremeno
- [ ] Oba trebaju dobiti različit quote number
- [ ] `npm run build` prolazi bez grešaka

---

### Task 2: Set primary image race condition

**Problem:** `useSetPrimaryImage` izvršava 3 odvojene operacije (clear all → set one → update boat) bez transakcije. Ako neka failira, ostaje inconsistent state (nijedna slika nije primary, ili hero URL ne odgovara primary slici).
**Severity:** CRITICAL
**Fajlovi:** `src/hooks/useBoats.ts:216-254`

**Trenutni kod:**
```typescript
// useBoats.ts:220-247
mutationFn: async (imageId: string) => {
  // Clear all primary flags for this boat
  const { error: clearError } = await supabase
    .from('boat_images')
    .update({ is_primary: false })
    .eq('boat_id', boatId)
  if (clearError) throw clearError

  // Set the selected image as primary
  const { error: setError } = await supabase
    .from('boat_images')
    .update({ is_primary: true })
    .eq('id', imageId)
  if (setError) throw setError

  // Update boat hero_image_url
  const { data: image } = await supabase
    .from('boat_images')
    .select('display_url')
    .eq('id', imageId)
    .single()

  if (image) {
    await supabase
      .from('boats')
      .update({ hero_image_url: image.display_url })
      .eq('id', boatId)
  }
},
```

**Fix — Supabase RPC:**
```sql
-- Migracija: create_set_primary_boat_image_rpc.sql
CREATE OR REPLACE FUNCTION set_primary_boat_image(p_boat_id uuid, p_image_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_display_url text;
BEGIN
  -- Clear all primary flags
  UPDATE boat_images SET is_primary = false WHERE boat_id = p_boat_id;

  -- Set selected as primary
  UPDATE boat_images SET is_primary = true WHERE id = p_image_id
  RETURNING display_url INTO v_display_url;

  -- Update hero image on boat
  IF v_display_url IS NOT NULL THEN
    UPDATE boats SET hero_image_url = v_display_url WHERE id = p_boat_id;
  END IF;
END;
$$;
```

```typescript
// useBoats.ts — zamjena useSetPrimaryImage mutationFn
mutationFn: async (imageId: string) => {
  const { error } = await supabase.rpc('set_primary_boat_image', {
    p_boat_id: boatId,
    p_image_id: imageId,
  })
  if (error) throw error
},
```

**Koraci:**
1. Kreirati Supabase migraciju s RPC funkcijom
2. Zamijeniti 3 odvojena API poziva jednim `supabase.rpc()` pozivom
3. Testirati s raznim edge cases (nova slika, jedina slika, nepostojeći ID)

**Verifikacija:**
- [ ] Postaviti primarnu sliku — boat card prikazuje ispravan hero
- [ ] Kliknuti brzo 2x na različite slike — nema inconsistent statea
- [ ] `npm run build` prolazi

---

### Task 3: setBoat ne briše equipment/discounts

**Problem:** Kad korisnik promijeni brod u Step 1, `selectedEquipment` i `discounts` ostaju od prethodnog broda. Equipment ID-evi ne odgovaraju novom brodu, kalkulacija cijena je kriva.
**Severity:** HIGH
**Fajlovi:** `src/stores/configurator-store.ts:53`

**Trenutni kod:**
```typescript
// configurator-store.ts:53
setBoat: (boat) => set({ selectedBoat: boat }),
```

**Fix:**
```typescript
setBoat: (boat) =>
  set({
    selectedBoat: boat,
    selectedEquipment: new Map(),
    discounts: [],
    templateGroupId: null,
  }),
```

**Koraci:**
1. Izmijeniti `setBoat` action u `configurator-store.ts`
2. Provjeriti ima li poziva koji oslanjaju na staro ponašanje (zadržavanje equipment-a)

**Verifikacija:**
- [ ] Odabrati brod → odabrati opremu → vratiti se na Step 1 → odabrati drugi brod
- [ ] Oprema i popusti trebaju biti prazni na Step 2
- [ ] Cijena treba biti samo base price novog broda

---

### Task 4: Env vars validacija

**Problem:** Supabase klient se inicijalizira s placeholder URL-om ako env vars nedostaju. App se renderira, ali svi API pozivi tiho failiraju ili idu na krivi URL. Trebao bi hard-failati pri pokretanju.
**Severity:** HIGH
**Fajlovi:** `src/lib/supabase.ts:4-14`

**Trenutni kod:**
```typescript
// supabase.ts:4-14
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
)
```

**Fix:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**Koraci:**
1. Zamijeniti `console.warn` s `throw new Error`
2. Ukloniti fallback placeholder vrijednosti
3. Verificirati da `.env.local` postoji u `.gitignore`

**Verifikacija:**
- [ ] Obrisati env vars, pokrenuti `npm run dev` — app crashira s jasnom porukom
- [ ] S ispravnim env vars, app radi normalno
- [ ] `npm run build` prolazi

---

### Task 5: Nedostaju i18n ključevi

**Problem:** Neki UI elementi nemaju prijevode — koriste hardkodirane stringove ili nedostajuće ključeve.
**Severity:** MEDIUM
**Fajlovi:** `src/i18n/en.json`, `src/i18n/hr.json`

**Nedostajući ključevi (iz audit analize):**

```json
// Dodati u oba fajla (en.json i hr.json):

// boats.deletBoat → trebao bi biti boats.deleteBoat (typo)
// Ovaj ključ postoji ali s typom "deletBoat" umjesto "deleteBoat"

// Mogući nedostajući ključevi za error handling:
"common.networkError": "Network error. Check your connection." / "Mrežna greška. Provjerite vezu.",
"common.sessionExpired": "Session expired. Please log in again." / "Sesija istekla. Prijavite se ponovo.",
"common.forbidden": "You don't have permission for this action." / "Nemate dozvolu za ovu akciju.",
"common.notFound": "Resource not found." / "Resurs nije pronađen."
```

**Koraci:**
1. Dodati nedostajuće ključeve u `en.json` i `hr.json`
2. Popraviti typo `deletBoat` → `deleteBoat` (ili dodati oba za backward compat)
3. Pretražiti codebase za hardkodirane stringove koji bi trebali koristiti i18n

**Verifikacija:**
- [ ] Prebaciti jezik na HR — nema missing translation upozorenja u konzoli
- [ ] Prebaciti na EN — isto bez upozorenja
- [ ] `npm run build` prolazi

---

### Task 6: BIC validacija za EPC QR

**Problem:** EPC QR kod (za EN ponude) prima BIC bez validacije. Neispravan BIC generira QR kod koji banke ne mogu procesirati. EPC069-12 spec zahtijeva validan 8 ili 11 znakova BIC.
**Severity:** MEDIUM
**Fajlovi:** `src/lib/barcode-unified.ts:43-44`

**Trenutni kod:**
```typescript
// barcode-unified.ts:43-44
const epcData = buildEPCData({
  bic: settings.bic ?? '',
  // ...
})
```

**Fix:**
```typescript
// barcode-unified.ts — dodati validaciju

function isValidBIC(bic: string): boolean {
  // BIC/SWIFT: 8 ili 11 alfanumeričkih znakova
  // Format: BANKCCLL ili BANKCCLLBBB
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic.toUpperCase())
}

async function generateEPCQRCode(
  quoteNumber: string,
  totalAmount: number,
  settings: CompanySettings,
): Promise<string | null> {
  if (!settings.iban) return null

  // BIC je opcionalan u EPC, ali ako postoji mora biti validan
  const bic = settings.bic?.trim() ?? ''
  if (bic && !isValidBIC(bic)) {
    console.warn('Invalid BIC format for EPC QR code:', bic)
    return null
  }

  const epcData = buildEPCData({
    bic,
    recipientName: settings.name ?? 'Navis Marine d.o.o.',
    iban: settings.iban,
    amount: totalAmount,
    reference: quoteNumber,
    text: `Quote ${quoteNumber}`,
  })
  // ...rest
}
```

**Koraci:**
1. Dodati `isValidBIC()` helper u `barcode-unified.ts`
2. Validirati BIC prije generiranja EPC data stringa
3. Opcionalno: dodati BIC format validaciju i u `companySettingsSchema` (validators.ts)

**Verifikacija:**
- [ ] Settings → unijeti neispravan BIC → PDF ne prikazuje QR ali i dalje radi
- [ ] Settings → validan BIC → PDF generira ispravan EPC QR
- [ ] Testirati s BIC od 8 i 11 znakova
