import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { subDays, subMonths, format } from 'date-fns'
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

  const quotesQuery = useQuery({
    queryKey: ['dashboard', 'quotes', timeRange],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select('id, status, total_price, created_at, boat_id, created_by, boat:boats(name), company:companies(name), created_by_profile:profiles(full_name), template_group_id, template_group:quote_template_groups(name)')

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
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

  const aggregated = useMemo(() => {
    const quotes = quotesQuery.data
    if (!quotes) return null

    const totalQuotes = quotes.length
    const activeQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent').length
    const accepted = quotes.filter(q => q.status === 'accepted').length
    const rejected = quotes.filter(q => q.status === 'rejected').length
    const decided = accepted + rejected
    const acceptanceRate = decided > 0 ? (accepted / decided) * 100 : 0

    const totalRevenue = quotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + toNum(q.total_price), 0)

    const avgQuoteValue = totalQuotes > 0
      ? quotes.reduce((sum, q) => sum + toNum(q.total_price), 0) / totalQuotes
      : 0

    const stats: DashboardStats = {
      totalQuotes,
      activeQuotes,
      acceptanceRate,
      totalRevenue,
      avgQuoteValue,
    }

    const statusCounts: StatusCounts = {
      draft: quotes.filter(q => q.status === 'draft').length,
      sent: quotes.filter(q => q.status === 'sent').length,
      accepted,
      rejected,
    }

    // Revenue by month
    const monthMap = new Map<string, number>()
    for (const q of quotes) {
      const price = toNum(q.total_price)
      if (q.status === 'accepted' && price > 0) {
        const key = format(new Date(q.created_at), 'yyyy-MM')
        monthMap.set(key, (monthMap.get(key) ?? 0) + price)
      }
    }
    const revenueByMonth: RevenueByMonth[] = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        revenue,
      }))

    // Top boats by accepted revenue
    const boatMap = new Map<string, { name: string; revenue: number; count: number }>()
    for (const q of quotes) {
      const price = toNum(q.total_price)
      if (q.status === 'accepted' && q.boat_id && price > 0) {
        const name = (q.boat as { name: string } | null)?.name ?? 'Unknown'
        const entry = boatMap.get(q.boat_id) ?? { name, revenue: 0, count: 0 }
        entry.revenue += price
        entry.count += 1
        boatMap.set(q.boat_id, entry)
      }
    }
    const topBoats: TopBoat[] = Array.from(boatMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(b => ({ boatName: b.name, revenue: b.revenue, quoteCount: b.count }))

    // Salesperson performance
    const personMap = new Map<string, { name: string; total: number; accepted: number; revenue: number }>()
    for (const q of quotes) {
      const profile = q.created_by_profile as { full_name: string | null } | null
      const name = profile?.full_name ?? 'Unknown'
      const key = q.created_by ?? 'unknown'
      const entry = personMap.get(key) ?? { name, total: 0, accepted: 0, revenue: 0 }
      entry.total += 1
      if (q.status === 'accepted') {
        entry.accepted += 1
        entry.revenue += toNum(q.total_price)
      }
      personMap.set(key, entry)
    }
    const salespersonData: SalespersonData[] = Array.from(personMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map(p => ({
        name: p.name,
        totalQuotes: p.total,
        acceptedQuotes: p.accepted,
        revenue: p.revenue,
        acceptanceRate: p.total > 0 ? (p.accepted / p.total) * 100 : 0,
      }))

    // Campaign performance
    const campaignMap = new Map<string, { name: string; revenue: number; count: number }>()
    for (const q of quotes) {
      if (q.template_group_id) {
        const tg = q.template_group as { name: string | null } | null
        const name = tg?.name ?? 'Unknown Campaign'
        const entry = campaignMap.get(q.template_group_id) ?? { name, revenue: 0, count: 0 }
        entry.count += 1
        if (q.status === 'accepted') {
          entry.revenue += toNum(q.total_price)
        }
        campaignMap.set(q.template_group_id, entry)
      }
    }
    const campaignPerformance: CampaignData[] = Array.from(campaignMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map(c => ({ name: c.name, revenue: c.revenue, quoteCount: c.count }))

    // Conversion funnel
    const totalCreated = totalQuotes
    const totalSent = quotes.filter(q => q.status === 'sent' || q.status === 'accepted' || q.status === 'rejected').length
    const totalAccepted = accepted

    const conversionFunnel: FunnelStep[] = [
      {
        label: 'created',
        count: totalCreated,
        percentage: 100,
        dropoff: 0,
      },
      {
        label: 'sent',
        count: totalSent,
        percentage: totalCreated > 0 ? (totalSent / totalCreated) * 100 : 0,
        dropoff: totalCreated > 0 ? ((totalCreated - totalSent) / totalCreated) * 100 : 0,
      },
      {
        label: 'accepted',
        count: totalAccepted,
        percentage: totalSent > 0 ? (totalAccepted / totalSent) * 100 : 0,
        dropoff: totalSent > 0 ? ((totalSent - totalAccepted) / totalSent) * 100 : 0,
      },
    ]

    // Monthly trend (last 6 months, fill gaps with 0)
    const now = new Date()
    const trendMap = new Map<string, { count: number; revenue: number }>()
    for (let i = 5; i >= 0; i--) {
      const key = format(subMonths(now, i), 'yyyy-MM')
      trendMap.set(key, { count: 0, revenue: 0 })
    }
    for (const q of quotes) {
      const key = format(new Date(q.created_at), 'yyyy-MM')
      const entry = trendMap.get(key)
      if (entry) {
        entry.count += 1
        if (q.status === 'accepted') {
          entry.revenue += toNum(q.total_price)
        }
      }
    }
    const monthlyTrend: MonthlyTrendItem[] = Array.from(trendMap.entries())
      .map(([key, val]) => ({
        month: format(new Date(key + '-01'), 'MMM'),
        quoteCount: val.count,
        revenue: val.revenue,
      }))

    return { stats, statusCounts, revenueByMonth, topBoats, salespersonData, campaignPerformance, conversionFunnel, monthlyTrend }
  }, [quotesQuery.data])

  // Equipment popularity
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

  return {
    stats: aggregated?.stats,
    statusCounts: aggregated?.statusCounts,
    revenueByMonth: aggregated?.revenueByMonth ?? [],
    topBoats: aggregated?.topBoats ?? [],
    recentQuotes: recentQuery.data ?? [],
    salespersonData: aggregated?.salespersonData ?? [],
    equipmentPopularity,
    campaignPerformance: aggregated?.campaignPerformance ?? [],
    conversionFunnel: aggregated?.conversionFunnel ?? [],
    monthlyTrend: aggregated?.monthlyTrend ?? [],
    isLoading: quotesQuery.isLoading || recentQuery.isLoading || equipmentQuery.isLoading,
    error: quotesQuery.error || recentQuery.error || equipmentQuery.error,
    refetch: () => {
      void quotesQuery.refetch()
      void recentQuery.refetch()
      void equipmentQuery.refetch()
    },
  }
}
