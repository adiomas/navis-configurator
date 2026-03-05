# Session 20: Dashboard — Stats + Charts

## Prerequisites
- Session 19 complete (template groups working)
- Some quotes created in the system for data

## Goal
Analytics dashboard with stat cards, revenue chart, status distribution, top boats, recent quotes, and time-range filtering.

## Detailed Steps

### 1. Create `useDashboard.ts` hook (`src/hooks/useDashboard.ts`)
```typescript
export function useDashboardStats(timeRange: '30d' | '90d' | '1y' | 'all') {
  return useQuery({
    queryKey: ['dashboard', timeRange],
    queryFn: async () => {
      const since = getDateFromRange(timeRange)

      // Total quotes
      const { count: totalQuotes } = await supabase
        .from('quotes').select('*', { count: 'exact', head: true })
        .gte('created_at', since)

      // By status
      const { data: statusCounts } = await supabase
        .from('quotes').select('status')
        .gte('created_at', since)
      // Group counts client-side

      // Revenue (accepted quotes)
      const { data: accepted } = await supabase
        .from('quotes').select('total_price')
        .eq('status', 'accepted')
        .gte('created_at', since)
      const totalRevenue = accepted?.reduce((sum, q) => sum + (q.total_price || 0), 0) ?? 0

      // Recent quotes (last 5)
      const { data: recentQuotes } = await supabase
        .from('quotes')
        .select('*, boat:boats(name), company:companies(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      // Per boat
      const { data: byBoat } = await supabase
        .from('quotes')
        .select('boat_id, total_price, boats(name)')
        .eq('status', 'accepted')
        .gte('created_at', since)

      return { totalQuotes, statusCounts, totalRevenue, recentQuotes, byBoat, ... }
    }
  })
}
```

### 2. Create `StatsCards.tsx` (`src/components/dashboard/StatsCards.tsx`)
Responsive grid: 5 stat cards in a row (lg), 3 (md), 2 (sm), 1 (xs):

1. **Total Quotes** — icon: FileText, count number, trend indicator
2. **Active Quotes** (draft + sent) — icon: Clock, count
3. **Acceptance Rate** — icon: CheckCircle, percentage (accepted / (accepted + rejected))
4. **Total Revenue** — icon: Euro sign, formatted price
5. **Avg. Quote Value** — icon: TrendingUp, formatted price

Each card:
- White background, subtle shadow
- Icon (left, colored circle background)
- Value (large number, bold)
- Label (small, muted text)
- Trend: "↑12% vs last period" (green) or "↓5%" (red) — compare to previous period

### 3. Create charts (using Recharts)

**`RevenueChart.tsx`** (`src/components/dashboard/RevenueChart.tsx`)
- Line chart showing revenue over time
- X-axis: dates
- Y-axis: revenue (€)
- Tooltip on hover
- Toggle: 30d / 90d / 1y
- Smooth line, area fill with gradient

**`StatusDistribution.tsx`** (or `ConversionChart.tsx`)
- Donut chart showing quote status distribution
- Colors: gray (draft), blue (sent), green (accepted), red (rejected)
- Center text: total count
- Legend below

**`TopBoatsChart.tsx`** (`src/components/dashboard/TopBoatsChart.tsx`)
- Horizontal bar chart
- Top 5 boats by revenue (from accepted quotes)
- Each bar: boat name + revenue value
- Gold gradient bars

### 4. Recent quotes table
- Shows last 5 quotes
- Columns: Quote #, Boat, Client, Status badge, Amount, Date
- Row click → navigate to quote detail
- "View All" link → `/quotes`

### 5. Quick action buttons
- "New Quote" → `/configurator`
- "View Catalog" → `/boats`
- Large buttons with icons at top of dashboard

### 6. Time range filter
- Segmented control at top of dashboard: 30 days | 90 days | 1 year | All time
- Changing filter re-fetches all dashboard data
- All stat cards and charts respect the filter

### 7. Dashboard layout
- Responsive grid:
  - Desktop (lg): 2-column grid for charts, full-width for stats and table
  - Mobile: single column, stacked

### 8. DashboardPage integration
Update `src/pages/dashboard/DashboardPage.tsx`:
```tsx
export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | 'all'>('30d')
  const { data, isLoading } = useDashboardStats(timeRange)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>Dashboard</h1>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>
      <StatsCards stats={data?.stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data?.revenueTimeSeries} />
        <StatusDistribution data={data?.statusCounts} />
      </div>
      <TopBoatsChart data={data?.byBoat} />
      <RecentQuotesTable quotes={data?.recentQuotes} />
    </div>
  )
}
```

## Verification Checklist
- [ ] Dashboard shows 5 stat cards with correct data
- [ ] Revenue chart renders with data points
- [ ] Status donut chart shows distribution
- [ ] Top boats bar chart shows top 5
- [ ] Recent quotes table shows last 5 with correct info
- [ ] Time range filter: switching updates all widgets
- [ ] "New Quote" button → navigates to configurator
- [ ] Quote click in recent table → navigates to detail
- [ ] Responsive: mobile stacks all components single column
- [ ] Loading: skeleton/placeholder while data fetches
- [ ] Empty state: "No quotes yet" if no data
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/hooks/useDashboard.ts` — new
- `src/pages/dashboard/DashboardPage.tsx` — full implementation
- `src/components/dashboard/StatsCards.tsx` — new
- `src/components/dashboard/RevenueChart.tsx` — new
- `src/components/dashboard/ConversionChart.tsx` — new (status donut)
- `src/components/dashboard/TopBoatsChart.tsx` — new
