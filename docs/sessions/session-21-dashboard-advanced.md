# Session 21: Dashboard — Advanced Analytics

## Prerequisites
- Session 20 complete (basic dashboard with stats + charts)

## Goal
Salesperson performance, equipment popularity, campaign performance, conversion funnel, and CSV export.

## Detailed Steps

### 1. Create `SalespersonChart.tsx` (`src/components/dashboard/SalespersonChart.tsx`)
- Grouped bar chart or table
- X-axis: salesperson name (from profiles.full_name)
- Bars: total quotes, accepted quotes
- Or: stacked bar showing draft/sent/accepted/rejected per person
- Show acceptance rate as percentage label

Query:
```sql
SELECT
  p.full_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE q.status = 'accepted') as accepted,
  SUM(q.total_price) FILTER (WHERE q.status = 'accepted') as revenue
FROM quotes q
JOIN profiles p ON q.created_by = p.id
GROUP BY p.id, p.full_name
```

### 2. Create `EquipmentPopularity.tsx` (`src/components/dashboard/EquipmentPopularity.tsx`)
- Horizontal bar chart
- Top 10 most selected equipment items across all quotes
- Count how many times each equipment_item appears in quote_items (optional only)
- Bar label: item name + count

Query:
```sql
SELECT
  qi.name_en, COUNT(*) as times_selected
FROM quote_items qi
WHERE qi.item_type = 'equipment_optional'
GROUP BY qi.name_en
ORDER BY times_selected DESC
LIMIT 10
```

### 3. Create `CampaignPerformance.tsx` (`src/components/dashboard/CampaignPerformance.tsx`)
- Bar chart or table
- Revenue per template group (campaign/fair)
- Group name + total revenue + quote count
- Only for quotes that have template_group_id set

### 4. Create Conversion Funnel
- Visual funnel: Draft → Sent → Accepted
- Each stage: count + percentage of total
- Show drop-off between stages
- E.g., 100 drafts → 80 sent (80%) → 45 accepted (56% of sent)

### 5. Create `MonthlyTrend.tsx`
- Bar chart comparing current month vs previous months
- Last 6 months
- Each bar: quote count + revenue

### 6. Export to CSV
- "Export Data" button on dashboard
- Exports current filtered data:
  - Quote list with all fields
  - Revenue by month
  - Per boat stats
- Use browser-side CSV generation:
```typescript
function exportToCSV(data: any[], filename: string) {
  const csv = convertToCSV(data)
  const blob = new Blob([csv], { type: 'text/csv' })
  downloadBlob(blob, filename)
}
```

### 7. Dashboard layout update
Add new charts to dashboard in a logical layout:
- Row 1: Stat cards (already done)
- Row 2: Revenue chart + Status donut (already done)
- Row 3: Top boats + Equipment popularity
- Row 4: Salesperson performance + Campaign performance
- Row 5: Conversion funnel
- Row 6: Recent quotes table

### 8. Dashboard as default after login
- After successful login, redirect to `/dashboard`
- Dashboard is already the default route (Session 2)

## Verification Checklist
- [ ] Salesperson chart shows per-user statistics
- [ ] Equipment popularity reflects actual selections in quotes
- [ ] Campaign chart shows revenue per template group
- [ ] Conversion funnel displays correct percentages
- [ ] Monthly trend shows last 6 months
- [ ] CSV export downloads file with correct data
- [ ] All charts responsive on mobile
- [ ] Time range filter affects new charts too
- [ ] Empty states for charts with no data
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/components/dashboard/SalespersonChart.tsx` — new
- `src/components/dashboard/EquipmentPopularity.tsx` — new
- `src/components/dashboard/CampaignPerformance.tsx` — new
- `src/components/dashboard/ConversionFunnel.tsx` — new
- `src/components/dashboard/MonthlyTrend.tsx` — new
- `src/pages/dashboard/DashboardPage.tsx` — add new chart sections + export
- `src/hooks/useDashboard.ts` — add new queries
- `src/lib/csv-export.ts` — new (CSV generation utility)
