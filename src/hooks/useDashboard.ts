import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { QuoteStatus } from '@/types'

export type TimeRange = '30d' | '90d' | '1y' | 'all'

export interface DashboardStats {
  totalQuotes: number
  activeQuotes: number
  acceptanceRate: number
  totalRevenue: number
  avgQuoteValue: number
}

export interface StatusCounts {
  draft: number
  sent: number
  accepted: number
  rejected: number
}

export interface RevenueByMonth {
  month: string
  revenue: number
}

export interface TopBoat {
  boatName: string
  revenue: number
  quoteCount: number
}

export interface RecentQuote {
  id: string
  quote_number: string
  status: QuoteStatus
  total_price: number | null
  created_at: string
  boat_name: string | null
  company_name: string | null
}

export interface SalespersonData {
  name: string
  totalQuotes: number
  acceptedQuotes: number
  revenue: number
  acceptanceRate: number
}

export interface EquipmentPopularityItem {
  name: string
  count: number
}

export interface CampaignData {
  name: string
  revenue: number
  quoteCount: number
}

export interface FunnelStep {
  label: string
  count: number
  percentage: number
  dropoff: number
}

export interface MonthlyTrendItem {
  month: string
  quoteCount: number
  revenue: number
}

interface DashboardRPCResult {
  stats: DashboardStats
  statusCounts: StatusCounts
  revenueByMonth: RevenueByMonth[]
  topBoats: TopBoat[]
  salespersonData: SalespersonData[]
  campaignPerformance: CampaignData[]
  conversionFunnel: FunnelStep[]
  monthlyTrend: MonthlyTrendItem[]
}

function getDateFrom(timeRange: TimeRange): string | null {
  const now = new Date()
  switch (timeRange) {
    case '30d': return subDays(now, 30).toISOString()
    case '90d': return subDays(now, 90).toISOString()
    case '1y': return subDays(now, 365).toISOString()
    case 'all': return null
  }
}

/** Supabase returns numeric columns as strings — safely convert to number */
function toNum(value: unknown): number {
  if (value == null) return 0
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

export function useDashboard(timeRange: TimeRange) {
  const dateFrom = getDateFrom(timeRange)

  // Single RPC call replaces quotesQuery + ~160 lines of useMemo aggregation
  const statsQuery = useQuery<DashboardRPCResult>({
    queryKey: ['dashboard', 'stats', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_date_from: dateFrom ?? undefined,
      })
      if (error) throw error
      return data as unknown as DashboardRPCResult
    },
    staleTime: 60 * 1000,
  })

  const equipmentQuery = useQuery({
    queryKey: ['dashboard', 'equipment', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_items')
        .select('name_en, name_hr, item_type, quote_id, quote:quotes!inner(created_at, status)')
        .neq('item_type', 'equipment_standard')

      if (error) throw error

      // Client-side date filter on the joined quote
      if (dateFrom) {
        return (data ?? []).filter(item => {
          const quote = item.quote as { created_at: string } | null
          return quote && quote.created_at >= dateFrom
        })
      }
      return data ?? []
    },
    staleTime: 60 * 1000,
  })

  const recentQuery = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, quote_number, status, total_price, created_at, boat:boats(name), company:companies(name)')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return (data ?? []).map((q) => ({
        id: q.id,
        quote_number: q.quote_number,
        status: q.status as QuoteStatus,
        total_price: toNum(q.total_price),
        created_at: q.created_at,
        boat_name: (q.boat as { name: string } | null)?.name ?? null,
        company_name: (q.company as { name: string } | null)?.name ?? null,
      }))
    },
    staleTime: 60 * 1000,
  })

  // Equipment popularity (kept as separate query — different data source)
  const equipmentPopularity = useMemo((): EquipmentPopularityItem[] => {
    const items = equipmentQuery.data
    if (!items) return []

    const countMap = new Map<string, number>()
    for (const item of items) {
      const name = item.name_en ?? item.name_hr ?? 'Unknown'
      countMap.set(name, (countMap.get(name) ?? 0) + 1)
    }
    return Array.from(countMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
  }, [equipmentQuery.data])

  const rpcData = statsQuery.data

  return {
    stats: rpcData?.stats,
    statusCounts: rpcData?.statusCounts,
    revenueByMonth: rpcData?.revenueByMonth ?? [],
    topBoats: rpcData?.topBoats ?? [],
    recentQuotes: recentQuery.data ?? [],
    salespersonData: rpcData?.salespersonData ?? [],
    equipmentPopularity,
    campaignPerformance: rpcData?.campaignPerformance ?? [],
    conversionFunnel: rpcData?.conversionFunnel ?? [],
    monthlyTrend: rpcData?.monthlyTrend ?? [],
    isLoading: statsQuery.isLoading || recentQuery.isLoading || equipmentQuery.isLoading,
    error: statsQuery.error || recentQuery.error || equipmentQuery.error,
    refetch: () => {
      void statsQuery.refetch()
      void recentQuery.refetch()
      void equipmentQuery.refetch()
    },
  }
}
