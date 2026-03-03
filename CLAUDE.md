# Navis Marine Yacht Configurator

## Project Context
Interni SPA konfigurator za Navis Marine (Azimut Yachts distributer za 13 EU zemalja). Sales tim koristi app za kreiranje ponuda jahti - od odabira broda i opreme do generiranja profesionalnog PDF-a. B2B SaaS sa 2-5 korisnika, bilingualni (HR/EN).

## Tech Stack
- **Frontend:** React 19 + TypeScript (strict) + Vite 7
- **Styling:** Tailwind CSS v4 (custom theme u `src/styles/globals.css`)
- **State:** Zustand (configurator wizard) + React Query v5 (server state)
- **Forms:** react-hook-form + Zod validacija
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **PDF:** @react-pdf/renderer (3 templatea: Compact, Detailed, Luxury)
- **Charts:** Recharts (dashboard)
- **i18n:** react-i18next (HR/EN)
- **Icons:** Lucide React
- **Deploy:** Vercel

## Commands
```bash
npm run dev      # Dev server na localhost:5173
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint provjera
npm run preview  # Preview production builda
```

## Supabase MCP (OBAVEZNO)
- **Project ID:** `ekjvnqslullpmidmrqfx`
- UVIJEK koristi Supabase MCP tools za sve operacije s bazom
- Za schema provjere: `execute_sql`, `list_tables`, `generate_typescript_types`
- Za migracije: `apply_migration`
- RLS politike su uključene na svim tablicama
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Frontend Design Skill (OBAVEZNO)
- UVIJEK koristi `frontend-design` skill kad se radi bilo što s UI-om
- Za nove komponente, stranice, layouts, vizualne promjene
- Poštuj brand: navy (#1a1a2e), primary blue (#2ea3f2), gold (#c9a961)
- Fontovi: Playfair Display (headings), Plus Jakarta Sans (body)

## Project Structure
```
src/
├── components/    # Reusable komponente po domeni (boats/, clients/, configurator/, pdf/, ui/)
├── pages/         # Page komponente po domeni (auth/, boats/, configurator/, quotes/, settings/)
├── hooks/         # Custom hooks: useBoats, useQuotes, useAuth, useSettings...
├── lib/           # Utilities: supabase.ts, pricing.ts, formatters.ts, validators.ts, utils.ts
├── stores/        # Zustand: configurator-store.ts
├── types/         # TypeScript: index.ts (app types), supabase.ts (DB types)
├── i18n/          # Prijevodi: en.json, hr.json, config.ts
├── styles/        # globals.css (Tailwind theme + brand colors)
├── router.tsx     # React Router v7 route config
├── App.tsx        # Root: QueryClient + Router + i18n init
└── main.tsx       # Entry point
```

## Code Conventions

### TypeScript
- Strict mode UVIJEK uključen, NIKAD `any`
- `const` po defaultu, `let` samo kad je reassignment nužan
- Path alias: `@/*` → `./src/*`
- Explicit return types na exported funkcijama

### Components
- Funkcionalne komponente, NIKAD class components
- PascalCase za komponente, camelCase za utilities
- Props definirani kao `interface`, ne `type`
- Jedna komponenta po datoteci

### State Management
- **Server state (React Query):** Svi Supabase podaci (boats, quotes, clients)
  - Stale times: boats/equipment 5min, quotes 30s, settings 10min, dashboard 1min
  - Prefetch on hover za cards/rows
- **Client state (Zustand):** Samo configurator wizard (privremeno, resetira se nakon save)
- NIKAD React Context za globalni state

### Styling
- Tailwind-first, NIKAD CSS modules ili inline styles
- `cn()` utility za class merging (iz `@/lib/utils`)
- Brand boje: `navy`, `primary`, `gold` (definirane u theme)
- 44px minimum touch targets za mobile

### Forms
- react-hook-form + Zod schema (definirani u `lib/validators.ts`)
- Bilingualni inputi: tab-based switching (hr/en)
- Inline error messages ispod polja

## Architecture Patterns

### Bilingual Content
- DB: `name_hr`/`name_en`, `description_hr`/`description_en` (odvojeni stupci, NE JSON)
- UI: react-i18next za labelove, DB stupci za content
- PDF: jezik ponude (hr/en) određuje jezik labela i sadržaja

### Quote Immutability
- Quote items su SNAPSHOT opreme u trenutku kreiranja (čuvaju historijske cijene)
- Edit = kreira NOVU ponudu, nikad ne mijenja postojeću
- Status flow: Draft → Sent → Accepted/Rejected

### Discount System (3 razine)
- Boat base discount (% ili fiksno na baznu cijenu)
- Equipment-wide discount (% ili fiksno na ukupnu opremu)
- Per-item discount (% ili fiksno na pojedinu stavku)
- Stacking: postoci se primjenjuju PRIJE fiksnih iznosa

### Quote Number Format
- Pattern: `NM-{YYYY}-{NNN}` (npr. NM-2025-001)
- Generira se u `lib/quote-number.ts`

### Data Patterns
- Soft delete: `status = 'archived'`, NIKAD hard delete
- Audit trail: `created_by`, `created_at` na svim resursima
- Quote status history u zasebnoj tablici s timestamps

## Database (15+ tablica)
- **Auth:** profiles (email, role: admin|sales, is_active)
- **Products:** boats, boat_specs, boat_images
- **Equipment:** equipment_categories, equipment_items (per boat)
- **Clients:** companies, contacts (CRM s VIP/Regular/Prospect)
- **Quotes:** quotes, quote_items, quote_discounts, quote_status_history
- **Templates:** quote_template_groups + boats/equipment/discounts (fair campaigns)
- **Settings:** company_settings (singleton), pdf_templates

## Responsive Design
- Mobile-first pristup (375px → 1920px)
- Breakpoints: sm(640) md(768) lg(1024) xl(1280) 2xl(1536)
- Mobile sidebar: slide-in overlay s hamburger menu
- Configurator Step 2: floating price bar na mobileu
- Skeleton loading states za sve liste i kartice

## Important Rules
- NIKAD commitaj `.env.local` ili secrets
- EUR format cijena: `€12.500.000` (European format, definirano u formatters.ts)
- Svi CRUD hookovi koriste React Query mutations s cache invalidation
- PDF renderer se lazy-loada (React.lazy) - učitava se samo kad korisnik klikne
- Route-based code splitting s React.lazy() + Suspense
- Supabase RLS politike su PRIMARY sigurnosni sloj, frontend provjere su UX
