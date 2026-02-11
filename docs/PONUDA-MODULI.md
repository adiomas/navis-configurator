# Navis Marine - Konfigurator ponuda brodske opreme

## Projekt

Web aplikacija za kreiranje, upravljanje i generiranje ponuda brodske opreme. Omogućuje prodajnom timu brzo sastavljanje profesionalnih ponuda s interaktivnim konfiguratorom i automatskim PDF generiranjem.

**Live prototip:** https://prototype-red-phi.vercel.app

---

## Modularna struktura

Aplikacija je podijeljena na **1 bazni paket + 6 dodatnih modula**. Odabirete bazni paket i module koji vam trebaju.

---

## BAZNI PAKET (Core) — ~100-120 sati

> Minimum za funkcionalan sustav

| Stavka | Opis |
|--------|------|
| Autentikacija | Login/logout, Supabase Auth, upravljanje korisnicima |
| Katalog brodova | CRUD brodova, specifikacije (5 kategorija), galerija slika |
| Upravljanje opremom | Kategorije opreme po brodu, standard/optional stavke, cijene |
| Postavke tvrtke | Naziv, logo, kontakt podaci, uvjeti ponude |
| Responsive dizajn | Desktop + tablet + mobile, sidebar navigacija |
| Tech stack | Next.js 15, Supabase, Tailwind CSS, TypeScript |
| Hosting & deploy | Vercel deploy, SSL, domena |

---

## MODUL 1: Konfigurator — ~50-70 sati

> Srce aplikacije - interaktivni wizard za kreiranje ponuda

| Stavka | Opis |
|--------|------|
| 4-step wizard | Odabir broda → Oprema → Klijent → Pregled |
| Live kalkulacija | Real-time ažuriranje cijene pri odabiru opreme |
| Sticky price panel | Pregled odabranih stavki i ukupne cijene |
| Podaci klijenta | Forma za ime, email, tvrtku, telefon, napomene |
| Pregled ponude | Kompletni summary prije generiranja |

---

## MODUL 2: PDF Ponude — ~30-40 sati

> Profesionalni PDF dokumenti s brandingom

| Stavka | Opis |
|--------|------|
| PDF generator | @react-pdf/renderer, automatizirano kreiranje |
| Navis Marine branding | Logo, boje, font, footer s kontaktima |
| Sadržaj PDF-a | Brod, oprema po kategorijama, pricing breakdown, uvjeti |
| Download/preview | Modal s previewom + gumb za download |

---

## MODUL 3: Upravljanje ponudama — ~40-50 sati

> Evidencija, praćenje i povijest svih ponuda

| Stavka | Opis |
|--------|------|
| Lista ponuda | Tablica s pretragom, filterima (status, datum) |
| Status tracking | Draft → Sent → Accepted / Rejected, s datumima |
| Detalj ponude | Pregled svih podataka, oprema, cijena |
| Dupliciranje | Kopija postojeće ponude za novog klijenta |
| Automatsko numeriranje | NM-YYYY-XXX format |

---

## MODUL 4: Excel Import — ~25-35 sati

> Bulk unos brodova iz Excel datoteka

| Stavka | Opis |
|--------|------|
| Template download | Predložak Excel tablice za ispravno popunjavanje |
| Upload & validacija | Drag-drop upload, provjera formata i podataka |
| Preview & potvrda | Pregled podataka prije importa, upozorenja za greške |
| Bulk kreiranje | Automatski unos brodova u bazu |

---

## MODUL 5: Lokalizacija (i18n) — ~30-40 sati

> Višejezična podrška za internacionalno poslovanje

| Stavka | Opis |
|--------|------|
| HR/EN sučelje | Kompletni prijevod aplikacije (next-intl) |
| Dvojezični PDF | Ponude na hrvatskom ili engleskom |
| Valute | EUR formatiranje, opcija za druge valute |
| Lokalizirani datumi | Hrvatski format datuma (5. veljače 2025.) |

---

## MODUL 6: Napredne funkcije (Premium) — ~50-70 sati

> Za timove koji žele punu kontrolu i analitiku

| Stavka | Opis |
|--------|------|
| Dashboard analitika | Grafovi prihoda, konverzije ponuda, top brodovi |
| Role-based pristup | Admin / Sales / Viewer uloge s različitim pravima |
| Audit log | Evidencija tko je što mijenjao i kada |
| Email obavijesti | Notifikacija kad ponuda promijeni status |
| Backup & export | Export podataka, automatski backupi |

---

## Preporučeni paketi

| Paket | Uključeni moduli | Okvirno sati |
|-------|-------------------|-------------|
| **Starter** | Core + Konfigurator + PDF | ~180-230h |
| **Professional** | Core + Konfigurator + PDF + Ponude + Import | ~245-315h |
| **Enterprise** | Svi moduli | ~325-425h |

---

## Napomene

- **Hosting:** Vercel (besplatan tier za početak, skalabilan po potrebi)
- **Baza podataka:** Supabase (besplatan tier do 500MB, zatim pay-as-you-go)
- **Održavanje:** Po dogovoru - mjesečni paket ili po potrebi
- **Podrška:** Email/chat podrška uključena prvih 30 dana nakon launcha
- **Sati su okvirni** i ovise o kompleksnosti zahtjeva i eventualnim promjenama tijekom razvoja
