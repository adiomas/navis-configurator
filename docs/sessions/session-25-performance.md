# Session 25: Performance + Final Polish

## Prerequisites
- Session 24 complete (responsive, all flows tested)

## Goal
Optimized, production-ready application with lazy loading, image optimization, and passing Lighthouse scores.

## Detailed Steps

### 1. Image optimization
- **Lazy loading:** Add `loading="lazy"` to all `<img>` tags not above the fold
- **Responsive srcset:** For boat hero images, provide multiple sizes via Supabase image transforms
  ```html
  <img
    src="image.jpg?width=400"
    srcSet="image.jpg?width=400 400w, image.jpg?width=800 800w, image.jpg?width=1200 1200w"
    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
  ```
- **WebP format:** Use Supabase Storage transforms to serve WebP where supported
- **Placeholder:** Use low-quality blur placeholder while loading

### 2. React Query optimization
- **Stale times:**
  - Boats + equipment: 5 minutes (rarely changes)
  - Quotes: 30 seconds (changes more frequently)
  - Company settings: 10 minutes (almost never changes)
  - Dashboard: 1 minute
- **Prefetch on hover:**
  ```typescript
  onMouseEnter={() => {
    queryClient.prefetchQuery({ queryKey: ['boat', boat.id], queryFn: ... })
  }}
  ```
  - Boat cards: prefetch boat detail on hover
  - Quote rows: prefetch quote detail on hover
- **Infinite/paginated queries:** Ensure quotes list pagination doesn't re-fetch all pages

### 3. Bundle optimization — Route-based code splitting
```typescript
// router.tsx
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const BoatsListPage = lazy(() => import('./pages/boats/BoatsListPage'))
const BoatDetailPage = lazy(() => import('./pages/boats/BoatDetailPage'))
const ConfiguratorPage = lazy(() => import('./pages/configurator/ConfiguratorPage'))
const QuotesListPage = lazy(() => import('./pages/quotes/QuotesListPage'))
const QuoteDetailPage = lazy(() => import('./pages/quotes/QuoteDetailPage'))
const ClientsListPage = lazy(() => import('./pages/clients/ClientsListPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
// ... etc

// Wrap with Suspense
<Suspense fallback={<PageSkeleton />}>
  <Route ... />
</Suspense>
```

**Split PDF renderer into separate chunk:**
```typescript
const PDFCompactTemplate = lazy(() => import('./components/pdf/PDFCompactTemplate'))
```
The `@react-pdf/renderer` is large — only load when user clicks "Download PDF".

### 4. Check Vite bundle size
```bash
npm run build
# Check dist/ folder sizes
# Target: main bundle < 200KB gzipped (without PDF renderer)
# PDF chunk: separate, loaded on demand
```

If bundle too large:
- Check for unnecessary imports
- Tree-shake unused Recharts components
- Lazy load Recharts (only on dashboard)

### 5. Supabase optimization
- **Verify indexes:** All frequently queried columns should have indexes:
  - boats: status, created_by
  - quotes: status, created_by, company_id, boat_id, created_at
  - companies: name, client_category, created_by
  - equipment_categories: boat_id, sort_order
  - equipment_items: category_id, sort_order
  - quote_items: quote_id
- **Select only needed columns:** In list queries, don't `select('*')` — select only displayed columns
- **Connection pooling:** Supabase handles this by default

### 6. Lighthouse audit
Run Lighthouse on deployed app (or local build):
- **Performance:** Target > 85
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- **Accessibility:** Target > 90
  - All images have alt text
  - All form inputs have labels
  - Color contrast ratios meet WCAG AA
  - Focus indicators visible
  - ARIA attributes on interactive elements
- **Best Practices:** Target > 90
  - HTTPS
  - No console errors
  - No deprecated APIs
- **SEO:** Target > 90 (less relevant for internal app)

### 7. Accessibility fixes
- All `<img>` tags have `alt` attributes
- All form inputs have associated `<label>`
- Button elements have accessible names
- Focus visible on all interactive elements
- Skip to main content link (optional)
- ARIA roles on sidebar navigation
- Color contrast: ensure gold on white meets WCAG AA (4.5:1 ratio)

### 8. Final checks
- [ ] No TypeScript errors: `npx tsc -b`
- [ ] No ESLint warnings: `npm run lint`
- [ ] No console.log statements in production code
- [ ] No console errors in browser
- [ ] Favicon set (Navis Marine icon or generic yacht)
- [ ] Meta tags: title, description, viewport
- [ ] `<html lang="en">` set
- [ ] All environment variables documented in `.env.example`

### 9. Vercel deployment config
Update `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This handles SPA routing (all routes serve index.html).

### 10. Build and verify
```bash
npm run build
npm run preview  # Test production build locally
```

## Verification Checklist
- [ ] Lighthouse Performance > 85
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse Best Practices > 90
- [ ] Bundle size < 500KB gzipped (total)
- [ ] First meaningful paint < 2s
- [ ] Route-based code splitting works (check network tab)
- [ ] PDF renderer loaded only on demand
- [ ] Images lazy load below fold
- [ ] Hover prefetch works (boat cards, quote rows)
- [ ] `npm run build` clean — no warnings, no errors
- [ ] `npx tsc -b` — no TypeScript errors
- [ ] `npm run lint` — no ESLint warnings
- [ ] No console errors in production build
- [ ] All features work in production build (npm run preview)
- [ ] SPA routing works on Vercel (deep links don't 404)

## Files Created/Modified
- `src/router.tsx` — lazy loading routes
- `vite.config.ts` — verify chunk splitting config
- `vercel.json` — SPA rewrites
- `index.html` — meta tags, favicon
- Multiple components — accessibility fixes (alt, labels, aria)
- `src/lib/pdf-generator.ts` — lazy import PDF renderer
