# Session 1: Project Scaffold + Core Setup

## Prerequisites
- Empty directory (or existing prototype at `/prototype/`)
- Node.js 20+ installed
- Supabase account ready

## Goal
Fully configured React + Vite project with all dependencies, Tailwind branding, i18n, Supabase client, TypeScript types, and complete database schema.

## Detailed Steps

### 1. Create Vite + React + TypeScript project
```bash
npm create vite@latest . -- --template react-ts
```

### 2. Install all dependencies
```bash
npm install @supabase/supabase-js @tanstack/react-query react-router-dom \
  zustand react-hook-form @hookform/resolvers zod \
  react-i18next i18next lucide-react recharts date-fns \
  @react-pdf/renderer clsx tailwind-merge

npm install -D tailwindcss @tailwindcss/vite
```

### 3. Configure Vite
Update `vite.config.ts`:
- Add `@tailwindcss/vite` plugin
- Add `@/` path alias resolving to `./src/`

### 4. Configure Tailwind CSS v4 with Navis branding
Create `src/styles/globals.css` with `@import "tailwindcss"` and `@theme` block:
- **Colors:** navy `#1a1a2e`, primary `#2ea3f2`, gold `#c9a961` (with light/dark variants)
- **Semantic colors:** background, foreground, muted, border, card, popover, sidebar, destructive, success, warning
- **Fonts:** `--font-sans: 'Plus Jakarta Sans'`, `--font-display: 'Playfair Display'`
- **Border radius:** sm/md/lg/xl
- **Shadows:** sm/md/lg
- **Animations:** fade-in, slide-in, slide-out

### 5. Setup Google Fonts
In `index.html`, add preconnect and stylesheet links for:
- Playfair Display (400, 500, 600, 700)
- Plus Jakarta Sans (300, 400, 500, 600, 700)

### 6. Create `cn()` utility
`src/lib/utils.ts` — combines `clsx` + `tailwind-merge` for className merging (shadcn/ui pattern).

### 7. Setup react-i18next
- `src/i18n/config.ts` — initialize i18next with `en` and `hr` resources
- `src/i18n/en.json` — English translations for all sections: common, nav, auth, dashboard, boats, equipment, configurator, clients, quotes, settings, pdf
- `src/i18n/hr.json` — Croatian translations (same structure)
- Default language: `en`, fallback: `en`

### 8. Create Supabase client
`src/lib/supabase.ts`:
- Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env
- Warn if not configured (dev-friendly fallback)
- Export typed `supabase` client using `Database` type

### 9. Define ALL TypeScript types

**`src/types/supabase.ts`** — Database type matching all 15+ tables:
- profiles, company_settings, boats, boat_specs, boat_images
- equipment_categories, equipment_items
- companies, contacts
- quotes, quote_items, quote_discounts, quote_status_history
- quote_template_groups, quote_template_group_boats, quote_template_group_equipment, quote_template_group_discounts
- pdf_templates

Each table has Row, Insert, and Update types.

**`src/types/index.ts`** — App-level types:
- Re-exports all DB Row types as convenient aliases (Boat, Quote, etc.)
- Insert/Update types for mutations
- Composite types: `BoatWithDetails`, `EquipmentCategoryWithItems`, `CompanyWithContacts`, `QuoteWithDetails`
- Configurator types: `ConfiguratorDiscount`, `PriceBreakdown`, `ClientFormData`
- Enums: `QuoteStatus`, `BoatCategory`, `ClientCategory`, `UserRole`

### 10. Create utility libraries

**`src/lib/formatters.ts`:**
- `formatPrice(amount, currency)` — European format: `€12.500.000`
- `formatDate(dateString, locale)` — `12 Mar 2025`
- `formatDateTime(dateString, locale)` — with time
- `formatPercentage(value)` — `10.0%`

**`src/lib/pricing.ts`:**
- `calculatePriceBreakdown(basePrice, selectedEquipment, discounts)` → `PriceBreakdown`
- `applyDiscounts(amount, discounts)` — percentage first, then fixed
- Handles 3 discount levels: boat_base, equipment_all, equipment_item

**`src/lib/quote-number.ts`:**
- `generateQuoteNumber(lastNumber)` → `NM-2025-001` format

**`src/lib/validators.ts`:**
- Zod schemas: loginSchema, boatSchema, equipmentCategorySchema, equipmentItemSchema, companySchema, contactSchema, clientFormSchema
- Exported inferred types for each

### 11. Create Zustand store
`src/stores/configurator-store.ts`:
```typescript
interface ConfiguratorState {
  currentStep: 1 | 2 | 3 | 4
  selectedBoat: Boat | null
  selectedEquipment: Map<string, EquipmentItem>
  clientData: ClientFormData
  discounts: ConfiguratorDiscount[]
  templateGroupId: string | null
  // Actions: setStep, setBoat, toggleEquipment, setSelectedEquipment,
  //          setClientData, addDiscount, removeDiscount, setTemplateGroupId, reset
}
```

### 12. Create App entry points
- `src/main.tsx` — imports `styles/globals.css`, renders `<App />`
- `src/App.tsx` — wraps with `QueryClientProvider` (staleTime: 5min) + `RouterProvider`
- `src/router.tsx` — all routes with placeholder components

### 13. Create folder structure
```
src/
├── pages/{auth,dashboard,boats,configurator,clients,quotes,settings}/
├── components/{layout,boats,equipment,configurator,quotes,pdf,clients,dashboard,ui}/
├── hooks/
├── stores/
├── lib/
├── types/
├── i18n/
└── styles/
```

### 14. Setup tsconfig path alias
In `tsconfig.app.json` add:
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

### 15. Create `.env.example`
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 16. Create complete database schema via Supabase SQL editor
Run all CREATE TABLE statements for the 15 tables defined in the design doc. See `docs/design/` for full SQL.

### 17. Setup RLS policies
- Boats, Equipment, PDF Templates: all authenticated can read, only admin can write
- Companies, Contacts: all can read, creator or admin can write
- Quotes: all can read, creator can write, admin can write all
- Settings: all can read, admin can write
- Profiles: users see own, admin sees all

### 18. Create storage buckets
1. `boat-images/` — public read, auth write
2. `company-assets/` — public read, auth write
3. `generated-pdfs/` — auth read/write

### 19. Generate Supabase types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```
(Replace the manual types with auto-generated ones)

## Verification Checklist
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds with no warnings
- [ ] TypeScript types compile (`npx tsc -b`)
- [ ] Supabase dashboard shows all tables created
- [ ] Path alias `@/` resolves correctly
- [ ] Fonts load (Playfair Display, Plus Jakarta Sans)
- [ ] Tailwind custom colors work (test with `bg-navy`, `text-primary`, `text-gold`)

## Files Created/Modified
- `package.json` — all dependencies
- `vite.config.ts` — Tailwind + path alias
- `tsconfig.app.json` — path alias
- `index.html` — title, fonts, meta
- `.gitignore` — updated
- `.env.example` — Supabase keys template
- `src/main.tsx` — entry point
- `src/App.tsx` — providers
- `src/router.tsx` — all routes (placeholders)
- `src/styles/globals.css` — Tailwind + branding
- `src/lib/utils.ts` — cn() utility
- `src/lib/supabase.ts` — Supabase client
- `src/lib/formatters.ts` — price/date formatters
- `src/lib/pricing.ts` — price calculation
- `src/lib/quote-number.ts` — quote number generator
- `src/lib/validators.ts` — Zod schemas
- `src/types/supabase.ts` — database types
- `src/types/index.ts` — app types
- `src/stores/configurator-store.ts` — Zustand store
- `src/i18n/config.ts` — i18next config
- `src/i18n/en.json` — English translations
- `src/i18n/hr.json` — Croatian translations
