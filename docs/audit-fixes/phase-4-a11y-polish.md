# Phase 4: Accessibility & Polish

**Procjena:** 2-3 dana
**Prioritet:** Ongoing improvement, ali security headeri su high priority

---

### Task 19: ARIA labels

**Problem:** Interaktivni elementi bez labela — icon buttoni, chartovi, custom form kontrole. Screen reader korisnici ne mogu razlikovati buttone niti razumjeti chart podatke.
**Severity:** HIGH
**Fajlovi:** Raspršeno po komponentama — primarno:
- Dashboard chart komponente (Recharts)
- Icon-only buttoni (edit, delete, sort)
- Custom form elementi (search inputi, toggles)

**Primjeri problema:**
```tsx
// Icon button bez labela
<button onClick={onDelete}>
  <Trash2 className="h-4 w-4" />
</button>

// Chart bez opisa
<BarChart data={data}>
  <Bar dataKey="revenue" />
</BarChart>

// Search input bez labela
<input type="text" placeholder="Search..." />
```

**Fix:**
```tsx
// Icon button s aria-label
<button onClick={onDelete} aria-label={t('common.delete')}>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</button>

// Chart s opisom
<BarChart data={data} role="img" aria-label={t('dashboard.revenueByMonth')}>
  <Bar dataKey="revenue" />
</BarChart>

// Search s labela
<label htmlFor="search-input" className="sr-only">{t('common.search')}</label>
<input id="search-input" type="text" placeholder={t('common.search')} />
```

**Koraci:**
1. Audit svih icon-only buttona — dodati `aria-label`
2. Dodati `aria-label` ili `role="img"` na Recharts chartove
3. Dodati `sr-only` labele na inpute bez vidljivih labela
4. Dodati `aria-hidden="true"` na dekorativne ikone

**Verifikacija:**
- [ ] Chrome Accessibility inspector — nema unnamed buttona
- [ ] VoiceOver/NVDA: svaki button ima razumljivo ime
- [ ] Recharts chartovi imaju opisni label

---

### Task 20: Keyboard navigation

**Problem:** Table rows, card grids, i custom liste nisu keyboard navigabilni. Korisnik ne može koristiti Tab/Enter za navigaciju bez miša.
**Severity:** MEDIUM
**Fajlovi:** Table komponente, card grid komponente

**Primjeri problema:**
```tsx
// Table row — klikabilan ali ne focusable
<tr onClick={() => navigate(`/quotes/${quote.id}`)}>
  <td>{quote.quote_number}</td>
</tr>

// Card — klikabilan ali ne focusable
<div onClick={() => onSelect(boat)} className="cursor-pointer">
  <BoatCard boat={boat} />
</div>
```

**Fix:**
```tsx
// Table row — keyboard accessible
<tr
  onClick={() => navigate(`/quotes/${quote.id}`)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/quotes/${quote.id}`)
    }
  }}
  tabIndex={0}
  role="link"
  className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
>
  <td>{quote.quote_number}</td>
</tr>

// Card — keyboard accessible
<div
  onClick={() => onSelect(boat)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(boat)
    }
  }}
  tabIndex={0}
  role="button"
  className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
>
  <BoatCard boat={boat} />
</div>
```

**Koraci:**
1. Identificirati sve klikabilne elemente koji nisu `<button>` ili `<a>`
2. Dodati `tabIndex={0}`, `role`, i `onKeyDown` handler
3. Dodati `focus-visible` style za visual feedback
4. Testirati Tab navigaciju kroz cijelu app

**Verifikacija:**
- [ ] Tab navigacija: svaki interaktivni element je focusable
- [ ] Enter/Space: aktivira klikabilne elemente
- [ ] Focus ring je vidljiv na svakom focusable elementu

---

### Task 21: Focus trap u modalima

**Problem:** Kad se otvori modal ili dialog, focus može "pobjeći" izvan modala koristeći Tab. Korisnici assistive technology-ja mogu interactati s elementima iza modala.
**Severity:** MEDIUM
**Fajlovi:** Modal/Dialog komponente (ResponsiveModal, ConfirmDialog)

**Fix:**
```tsx
// Opcija 1: Koristiti Radix UI Dialog (već ima focus trap)
// Ako već koristite headless UI library, ovo je built-in

// Opcija 2: Custom focus trap hook
import { useEffect, useRef } from 'react'

function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]

    // Focus first element on open
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return containerRef
}
```

**Koraci:**
1. Provjeriti koristi li se već Radix/Headless UI za modals (ako da, focus trap je built-in)
2. Ako su custom modali, implementirati focus trap hook
3. Dodati `aria-modal="true"` i `role="dialog"` na modal container
4. Return focus na trigger element kad se modal zatvori

**Verifikacija:**
- [ ] Otvoriti modal → Tab ciklira samo unutar modala
- [ ] Shift+Tab — isto ciklira unutar modala
- [ ] Zatvoriti modal → focus se vraća na element koji je otvorio modal
- [ ] Escape zatvara modal

---

### Task 22: Security headeri (vercel.json)

**Problem:** Vercel config nema security headere. Aplikacija je ranjiva na clickjacking (iframe embedding), XSS, i druge napade.
**Severity:** HIGH
**Fajlovi:** `vercel.json`

**Trenutni kod:**
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    }
  ]
}
```

**Fix:**
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' data:; frame-ancestors 'none'"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    }
  ]
}
```

**Koraci:**
1. Dodati security headers section u `vercel.json`
2. CSP treba biti testiran — dodati Supabase domenu u allowed sources
3. Testirati na staging prije produkcije
4. Provjeriti da PDF generiranje radi (blob: i data: sources za slike)

**Verifikacija:**
- [ ] Deploy na Vercel preview — provjeriti response headere
- [ ] `curl -I https://preview-url` prikazuje security headere
- [ ] App radi normalno (nije blokiran CSP-om)
- [ ] PDF generiranje i dalje radi (data: URLs za barkodove)
- [ ] Supabase auth i API pozivi rade (connect-src dozvoljava)

---

### Task 23: Responsive padding za chartove

**Problem:** Dashboard chartovi koriste fiksni padding koji je prevelik na mobileu i premalen na desktopu. Na malim ekranima chart labeli su odsječeni.
**Severity:** LOW
**Fajlovi:** Dashboard chart komponente

**Fix:**
```tsx
// Umjesto fiksnog padding-a:
<div className="p-4">
  <BarChart ...>

// Koristiti responsive classes:
<div className="p-2 sm:p-3 md:p-4 lg:p-6">
  <BarChart ...>
```

**Koraci:**
1. Identificirati sve chart wrapper elemente u dashboard komponentama
2. Zamijeniti fiksne p-* klase s responsive varijantama
3. Provjeriti da chart labeli nisu odsječeni na 375px širini

**Verifikacija:**
- [ ] Mobile (375px): chartovi su vidljivi s dovoljno padding-a, labeli nisu odsječeni
- [ ] Tablet (768px): chartovi su optimalno veliine
- [ ] Desktop (1920px): chartovi koriste prostor efektivno

---

### Task 24: Inline styles → Tailwind

**Problem:** 11 DOM komponenti koriste inline `style={}` umjesto Tailwind klasa. Ovo je inkonsistentno s ostatkom codebase-a i otežava theme-anje.
**Severity:** LOW
**Fajlovi:** Razbacano po komponentama (treba pretražiti codebase)

**Fix pristup:**

Pretražiti za `style={{` u `.tsx` fajlovima i zamijeniti s Tailwind klasama:

```tsx
// Prije:
<div style={{ maxHeight: '400px', overflow: 'auto' }}>

// Poslije:
<div className="max-h-[400px] overflow-auto">

// Prije:
<div style={{ minWidth: 200 }}>

// Poslije:
<div className="min-w-[200px]">

// Prije:
<div style={{ gap: '0.5rem' }}>

// Poslije:
<div className="gap-2">
```

**Izuzeci:** `@react-pdf/renderer` komponente MORAJU koristiti inline styles jer PDF renderer ne podržava Tailwind. Te fajlove treba preskočiti.

**Koraci:**
1. `grep -r "style={{" src/ --include="*.tsx" | grep -v "pdf/"` — lista svih inline style upotreba
2. Za svaki, zamijeniti s odgovarajućom Tailwind klasom
3. Preskočiti PDF komponente (koriste `@react-pdf/renderer` stil objekte)

**Verifikacija:**
- [ ] `grep "style={{" src/**/*.tsx | grep -v pdf/` — nema rezultata (osim PDF komponenti)
- [ ] Vizualni izgled ostaje identičan
- [ ] `npm run build` prolazi
