# Navis Marine Configurator — Audit Fix Plan

## Ukupna ocjena

| Područje | Ocjena | Opis |
|----------|--------|------|
| **Arhitektura** | 8/10 | Čist layered pristup, dobra separacija concerns |
| **Code Quality** | 7/10 | Konzistentno, ali ima `as unknown as` castova i missing error handlers |
| **Performance** | 6/10 | Client-side agregacije umjesto SQL, over-fetching, no lazy-load za bwip-js |
| **Security** | 7/10 | RLS je solidan, ali nedostaju security headeri i env validacija je slaba |
| **Type Safety** | 6/10 | Strict mode uključen ali zaobiđen s `as unknown as` i non-null assertions |
| **Accessibility** | 5/10 | Nedostaju ARIA labeli, keyboard navigacija i focus management |
| **i18n** | 9/10 | Odlična pokrivenost, par ključeva nedostaje |

## Faze popravki

| Faza | Opis | Taskova | Procjena |
|------|------|---------|----------|
| [Phase 1](./phase-1-critical-bugs.md) | Kritični bugovi | 6 | 1-2 dana |
| [Phase 2](./phase-2-performance.md) | Performance optimizacije | 6 | 3-5 dana |
| [Phase 3](./phase-3-type-safety.md) | Type safety & error handling | 6 | 2-3 dana |
| [Phase 4](./phase-4-a11y-polish.md) | Accessibility & polish | 6 | 2-3 dana |

## Master Tracking

| # | Task | Faza | Severity | Status |
|---|------|------|----------|--------|
| 1 | Quote number race condition | 1 | CRITICAL | ⬜ TODO |
| 2 | Set primary image race condition | 1 | CRITICAL | ⬜ TODO |
| 3 | setBoat ne briše equipment/discounts | 1 | HIGH | ⬜ TODO |
| 4 | Env vars validacija | 1 | HIGH | ⬜ TODO |
| 5 | Nedostaju i18n ključevi | 1 | MEDIUM | ⬜ TODO |
| 6 | BIC validacija za EPC QR | 1 | MEDIUM | ⬜ TODO |
| 7 | Dashboard RPC za agregacije | 2 | HIGH | ⬜ TODO |
| 8 | useBoat over-fetch (equipment) | 2 | MEDIUM | ⬜ TODO |
| 9 | N+1 quote status counts | 2 | MEDIUM | ⬜ TODO |
| 10 | useCompanies over-fetch | 2 | LOW | ⬜ TODO |
| 11 | Lazy-load bwip-js | 2 | MEDIUM | ⬜ TODO |
| 12 | Template groups lightweight query | 2 | LOW | ⬜ TODO |
| 13 | Zamijeniti `as unknown as` castove | 3 | HIGH | ⬜ TODO |
| 14 | Ukloniti non-null assertions | 3 | MEDIUM | ⬜ TODO |
| 15 | Literal union types u supabase.ts | 3 | MEDIUM | ⬜ TODO |
| 16 | Error handling na mutacijama | 3 | HIGH | ⬜ TODO |
| 17 | ConfiguratorDiscount Zod schema | 3 | MEDIUM | ⬜ TODO |
| 18 | useEffect dependency fix | 3 | LOW | ⬜ TODO |
| 19 | ARIA labels | 4 | HIGH | ⬜ TODO |
| 20 | Keyboard navigation | 4 | MEDIUM | ⬜ TODO |
| 21 | Focus trap u modalima | 4 | MEDIUM | ⬜ TODO |
| 22 | Security headeri (vercel.json) | 4 | HIGH | ⬜ TODO |
| 23 | Responsive padding za chartove | 4 | LOW | ⬜ TODO |
| 24 | Inline styles → Tailwind | 4 | LOW | ⬜ TODO |

## Napomene o validaciji

- **Svi audit nalazi su validirani čitanjem source koda** — linijski brojevi i code snippeti su točni
- **False positives:** Env vars validacija već postoji (console.warn + fallback), ali bi trebao biti `throw` umjesto fallbacka na placeholder URL
- **supabase.ts** linija 7-9: Postoji check, ali koristi `console.warn` + fallback `placeholder` URL umjesto hard fail-a
- **Quote number generacija** (useQuotes.ts:223-230, :341-348): Potvrđen race condition — čita zadnji broj, pa insertira, bez locking mehanizma
- **setBoat** (configurator-store.ts:53): Potvrđeno — samo `set({ selectedBoat: boat })`, ne resetira equipment ni discounts
