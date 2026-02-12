# Navis Marine Yacht Configurator - Plan

## Kontekst

Navis Marine je ovlašteni distributer Azimut Yachts za 13 zemalja srednje i istočne Europe. Njihov sales tim (2-5 ljudi) trenutno **ručno kreira ponude** za luksuzne jahte - kopiraju podatke iz brošura, kalkuliraju cijene u Excelu, formatiraju Word/PDF dokumente. Cilj je napraviti **interni konfigurator** koji automatizira cijeli proces: od odabira broda i opreme do generiranja profesionalnog PDF-a ponude.

---

## Tech Stack

| Kategorija | Tehnologija | Razlog |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR, Vercel deploy, TypeScript |
| Styling | **Tailwind CSS + shadcn/ui** | Brz razvoj, profesionalni UI |
| Baza | **Supabase** (PostgreSQL) | Auth + Storage + DB u jednom |
| PDF | **@react-pdf/renderer** | React komponente → PDF |
| Excel | **xlsx** (SheetJS) | Parse Excel za import |
| Forme | **react-hook-form + zod** | Validacija i upravljanje formama |
| State | **@tanstack/react-query** | Server state, caching |
| i18n | **next-intl** | HR/EN prijevodi |
| Deploy | **Vercel** | Cloud, automatski SSL |

## Branding

- Logo: `https://navis-marine.com/wp-content/uploads/2024/07/Navis-Marine-Logo.svg`
- Primary: `#2ea3f2` (plava), `#1a1a2e` (tamno navy)
- Background: `#ffffff`, Text: `#333333`
- Stil: Minimalistički, luxury, puno bijelog prostora

---

## Database Schema

```sql
-- Brodovi
boats (
  id uuid PK DEFAULT gen_random_uuid(),
  name text NOT NULL,              -- "Azimut Grande 120"
  brand text DEFAULT 'Azimut',
  model text NOT NULL,
  year int,
  category text CHECK (category IN ('new', 'used')),
  base_price decimal(12,2) NOT NULL,
  currency text DEFAULT 'EUR',
  description_hr text,
  description_en text,
  hero_image_url text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Specifikacije broda (po kategorijama)
boat_specs (
  id uuid PK,
  boat_id uuid FK → boats ON DELETE CASCADE,
  category text NOT NULL,          -- 'technical'|'interior'|'exterior'|'engines'|'navigation'
  label_hr text NOT NULL,
  label_en text NOT NULL,
  value text NOT NULL,
  sort_order int DEFAULT 0
)

-- Slike broda (galerija po kategorijama)
boat_images (
  id uuid PK,
  boat_id uuid FK → boats ON DELETE CASCADE,
  url text NOT NULL,
  category text,                   -- 'exterior'|'interior'|'detail'|'plan'
  is_primary boolean DEFAULT false,
  sort_order int DEFAULT 0
)

-- Kategorije opreme (po brodu)
equipment_categories (
  id uuid PK,
  boat_id uuid FK → boats ON DELETE CASCADE,
  name_hr text NOT NULL,
  name_en text NOT NULL,
  sort_order int DEFAULT 0
)

-- Stavke opreme
equipment_items (
  id uuid PK,
  category_id uuid FK → equipment_categories ON DELETE CASCADE,
  name_hr text NOT NULL,
  name_en text NOT NULL,
  description_hr text,
  description_en text,
  price decimal(12,2) DEFAULT 0,
  is_standard boolean DEFAULT false,  -- true = uključeno u baznu cijenu
  sort_order int DEFAULT 0
)

-- Ponude
quotes (
  id uuid PK,
  quote_number text UNIQUE,        -- auto: "NM-2025-001"
  boat_id uuid FK → boats,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  client_company text,
  language text DEFAULT 'hr',      -- 'hr'|'en'
  currency text DEFAULT 'EUR',
  base_price decimal(12,2),
  options_total decimal(12,2),
  discount decimal(12,2) DEFAULT 0,
  total_price decimal(12,2),
  notes text,
  status text DEFAULT 'draft',     -- 'draft'|'sent'|'accepted'|'rejected'
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Stavke ponude (snapshot odabrane opreme)
quote_items (
  id uuid PK,
  quote_id uuid FK → quotes ON DELETE CASCADE,
  equipment_item_id uuid,
  name_hr text NOT NULL,
  name_en text NOT NULL,
  category_name_hr text,
  category_name_en text,
  price decimal(12,2) NOT NULL,
  is_standard boolean DEFAULT false
)
```

---

## App Struktura (Routes)

```
/                        → Dashboard (nedavne ponude, brze akcije, statistike)
/boats                   → Katalog brodova (grid, pretraga, filter)
/boats/new               → Dodaj novi brod (forma)
/boats/[id]              → Detalji broda + edit
/boats/[id]/equipment    → Upravljanje opremom za taj brod
/boats/import            → Excel import wizard
/configurator            → Konfigurator (glavni feature)
  → Step 1: Odabir broda
  → Step 2: Konfiguracija opreme + live cijena
  → Step 3: Podaci klijenta + napomene
  → Step 4: Pregled + generiranje PDF-a
/quotes                  → Povijest ponuda (lista, pretraga, filter)
/quotes/[id]             → Detalj ponude (pregled, PDF, status)
/settings                → Postavke (info firme, logo, uvjeti)
```

---

## Konfigurator - UX Flow (4 koraka)

### Step 1: Odabir broda
- Grid prikaz svih aktivnih brodova (slika, naziv, bazna cijena)
- Klik na brod → prikaže detalje sa strane (specs, galerija)
- Gumb "Konfiguriraj" → prelazi na Step 2

### Step 2: Konfiguracija opreme
- Lijevo: accordion po kategorijama opreme
  - Svaka kategorija ima checkbox stavke
  - Standard oprema = označena i zaključana
  - Opcionalna oprema = toggle on/off
- Desno (sticky): Price Summary
  - Bazna cijena: €X
  - Odabrane opcije: €Y
  - **UKUPNO: €X+Y**
- Cijena se mijenja u realnom vremenu (klijentski, bez API poziva)

### Step 3: Podaci klijenta
- Forma: ime, email, telefon, tvrtka
- Napomene (slobodni tekst za PDF)
- Jezik ponude: HR / EN
- Valuta: EUR

### Step 4: Pregled i generiranje
- Sažetak: brod + oprema + cijena + klijent
- Gumbi: "Spremi kao draft" | "Generiraj PDF"
- PDF preview u modalu prije downloada

---

## PDF Ponuda - Struktura

```
┌─────────────────────────────────────┐
│  [NAVIS MARINE LOGO]                │
│  PONUDA ZA JAHTU / YACHT QUOTATION  │
│  Br: NM-2025-042  |  Datum: ...     │
├─────────────────────────────────────┤
│  KLIJENT                            │
│  Ime, email, telefon, tvrtka        │
├─────────────────────────────────────┤
│  JAHTA                              │
│  [Hero slika broda]                 │
│  Azimut Grande 120 | 2024           │
│  Specifikacije (tablica)            │
├─────────────────────────────────────┤
│  ODABRANA OPREMA                    │
│  ┌ INTERIJER ────────────────────┐  │
│  │ • Premium koža       €50.000  │  │
│  │ • Mramorno podne     €75.000  │  │
│  ├ NAVIGACIJA ───────────────────┤  │
│  │ • Satelitski WiFi    €45.000  │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  CIJENA                             │
│  Bazna cijena:     €12.500.000      │
│  Oprema:              €170.000      │
│  ─────────────────────────────      │
│  UKUPNO:           €12.670.000      │
├─────────────────────────────────────┤
│  UVJETI                             │
│  • Ponuda vrijedi 30 dana          │
│  • PDV nije uključen               │
├─────────────────────────────────────┤
│  Navis Marine d.o.o.               │
│  www.navis-marine.com               │
└─────────────────────────────────────┘
```

---

## Excel Import

**Format template-a:**
| Brand | Model | Year | Base Price EUR | Category | Description HR | Description EN |
|-------|-------|------|----------------|----------|----------------|----------------|

**Import wizard (3 koraka):**
1. Upload .xlsx/.csv → preview prvih 5 redova
2. Validacija (obavezna polja, format cijena, duplikati)
3. Potvrda + import u bazu

---

## Faze Implementacije

### Faza 1: Temelj
- Next.js 15 scaffold + TypeScript strict
- Supabase setup (baza, auth, storage)
- Tailwind + shadcn/ui + Navis branding (boje, font, logo)
- Layout: sidebar navigacija + header
- i18n (HR/EN) setup
- Auth (login stranica, Supabase Auth)

### Faza 2: Katalog brodova
- CRUD za brodove (forma, lista, detalji)
- Specifikacije po kategorijama
- Upload i galerija slika (Supabase Storage)
- Grid prikaz kataloga s pretragom

### Faza 3: Upravljanje opremom
- CRUD kategorija opreme po brodu
- CRUD stavki opreme (standard/opcional, cijena)
- UI za upravljanje opremom na stranici broda

### Faza 4: Konfigurator
- 4-step wizard komponenta
- Odabir broda → konfiguracija opreme → klijent → pregled
- Real-time price kalkulacija
- Spremanje ponude u bazu

### Faza 5: PDF generiranje
- @react-pdf/renderer template s Navis brandingom
- Bilingual PDF (HR/EN)
- API endpoint za generiranje
- Preview + download

### Faza 6: Excel import
- Upload wizard s validacijom
- Template za preuzimanje
- Bulk import brodova

### Faza 7: Povijest ponuda + polish
- Lista ponuda s pretragom i filterom
- Status tracking (draft/sent/accepted/rejected)
- Duplikacija ponude
- Settings stranica (info firme, uvjeti ponude)

---

## Ključne Datoteke

| Datoteka | Svrha |
|---|---|
| `src/lib/supabase.ts` | Supabase klijent + helperi |
| `src/types/index.ts` | TypeScript tipovi (Boat, Quote, Equipment) |
| `src/components/configurator/ConfiguratorWizard.tsx` | Glavni wizard |
| `src/components/pdf/QuotePDFTemplate.tsx` | PDF layout |
| `src/lib/pricing.ts` | Kalkulacija cijena |
| `src/lib/i18n/` | Prijevodi HR/EN |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout sa sidebar |

---

## Verifikacija

1. **Build**: `npm run build` bez grešaka
2. **Lint**: `npm run lint` čisto
3. **Auth**: Login/logout radi s Supabase
4. **CRUD**: Kreiranje/editiranje broda s opremom
5. **Konfigurator**: Prolazak kroz sva 4 koraka → spremi ponudu
6. **PDF**: Generirani PDF izgleda profesionalno, sadrži sve podatke
7. **Import**: Excel import uspješno unosi brodove
8. **Responsive**: Radi na desktopu i tabletu
9. **i18n**: Prebacivanje HR/EN radi na UI i PDF-u
