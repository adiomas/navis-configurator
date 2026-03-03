import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Ship } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useDashboard, type TimeRange } from '@/hooks/useDashboard'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { TimeRangeFilter } from '@/components/dashboard/TimeRangeFilter'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { RecentQuotesTable } from '@/components/dashboard/RecentQuotesTable'

const RevenueChart = lazy(() => import('@/components/dashboard/RevenueChart'))
const ConversionChart = lazy(() => import('@/components/dashboard/ConversionChart'))
const TopBoatsChart = lazy(() => import('@/components/dashboard/TopBoatsChart'))
const SalespersonChart = lazy(() => import('@/components/dashboard/SalespersonChart'))
const EquipmentPopularityChart = lazy(() => import('@/components/dashboard/EquipmentPopularityChart'))
const CampaignPerformanceChart = lazy(() => import('@/components/dashboard/CampaignPerformanceChart'))
const ConversionFunnel = lazy(() => import('@/components/dashboard/ConversionFunnel'))
const MonthlyTrend = lazy(() => import('@/components/dashboard/MonthlyTrend'))

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  const {
    stats,
    statusCounts,
    revenueByMonth,
    topBoats,
    recentQuotes,
    salespersonData,
    equipmentPopularity,
    campaignPerformance,
    conversionFunnel,
    monthlyTrend,
    isLoading,
    error,
    refetch,
  } = useDashboard(timeRange)

  const hasEquipmentData = !isLoading && equipmentPopularity.length > 0
  const hasCampaignData = !isLoading && campaignPerformance.length > 0
  const hasSalespersonData = !isLoading && salespersonData.length > 0
  const hasFunnelData = !isLoading && conversionFunnel.length > 0 && conversionFunnel[0].count > 0
  const hasTrendData = !isLoading && monthlyTrend.some(m => m.quoteCount > 0 || m.revenue > 0)

  if (error && !isLoading) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-navy">{t('dashboard.title')}</h1>
        <QueryErrorState onRetry={refetch} />
      </div>
    )
  }

  // Empty state: no quotes at all
  if (!isLoading && stats && stats.totalQuotes === 0 && timeRange === 'all') {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-navy">{t('dashboard.title')}</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-white px-6 py-14">
          <Ship className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-base font-medium text-navy">{t('dashboard.noData')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.createFirstQuote')}</p>
          <button
            onClick={() => navigate('/configurator')}
            className={cn('mt-5', ds.btn.base, ds.btn.lg, ds.btn.primary)}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('dashboard.newQuote')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-navy">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-2">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
          <button
            onClick={() => navigate('/configurator')}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.newQuote')}</span>
          </button>
          <button
            onClick={() => navigate('/boats')}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-muted"
          >
            <Ship className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.viewCatalog')}</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Charts */}
      <Suspense fallback={<ChartSkeleton />}>
        {/* Revenue chart - full width hero */}
        <RevenueChart data={revenueByMonth} isLoading={isLoading} />

        {/* Status donut + Conversion funnel */}
        <div className="grid gap-3 lg:grid-cols-2">
          <ConversionChart statusCounts={statusCounts} isLoading={isLoading} />
          {(isLoading || hasFunnelData) && (
            <ConversionFunnel data={conversionFunnel} isLoading={isLoading} />
          )}
        </div>

        {/* Monthly trend + Top boats */}
        {(isLoading || hasTrendData || topBoats.length > 0) && (
          <div className="grid gap-3 lg:grid-cols-2">
            {(isLoading || hasTrendData) && (
              <MonthlyTrend data={monthlyTrend} isLoading={isLoading} />
            )}
            {(isLoading || topBoats.length > 0) && (
              <TopBoatsChart data={topBoats} isLoading={isLoading} />
            )}
          </div>
        )}

        {/* Salesperson + Equipment */}
        {(isLoading || hasSalespersonData || hasEquipmentData) && (
          <div className="grid gap-3 lg:grid-cols-2">
            {(isLoading || hasSalespersonData) && (
              <SalespersonChart data={salespersonData} isLoading={isLoading} />
            )}
            {(isLoading || hasEquipmentData) && (
              <EquipmentPopularityChart data={equipmentPopularity} isLoading={isLoading} />
            )}
          </div>
        )}
      </Suspense>

      {/* Recent Quotes */}
      <RecentQuotesTable quotes={recentQuotes} isLoading={isLoading} />

      {/* Campaign — only if data exists */}
      {(isLoading || hasCampaignData) && (
        <Suspense fallback={<div className="h-32 animate-pulse rounded-lg border border-border/60 bg-muted/30" />}>
          <CampaignPerformanceChart data={campaignPerformance} isLoading={isLoading} />
        </Suspense>
      )}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-[200px] animate-pulse rounded-lg border border-border/60 bg-muted/30" />
      <div className="grid animate-pulse gap-3 lg:grid-cols-2">
        <div className="h-[200px] rounded-lg border border-border/60 bg-muted/30" />
        <div className="h-[200px] rounded-lg border border-border/60 bg-muted/30" />
      </div>
    </div>
  )
}
