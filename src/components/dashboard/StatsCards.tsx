import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice, formatPercentage } from '@/lib/formatters'
import type { DashboardStats } from '@/hooks/useDashboard'

interface StatsCardsProps {
  stats: DashboardStats | undefined
  isLoading: boolean
}

const ACCENT_COLORS = [
  'border-t-primary',
  'border-t-amber-500',
  'border-t-emerald-500',
  'border-t-gold',
  'border-t-violet-500',
]

export const StatsCards = ({ stats, isLoading }: StatsCardsProps) => {
  const { t } = useTranslation()

  const cards = [
    { label: t('dashboard.totalQuotes'), value: stats?.totalQuotes.toString() ?? '0' },
    { label: t('dashboard.activeQuotes'), value: stats?.activeQuotes.toString() ?? '0' },
    { label: t('dashboard.acceptanceRate'), value: stats ? formatPercentage(stats.acceptanceRate) : '0%' },
    { label: t('dashboard.totalRevenue'), value: stats ? formatPrice(stats.totalRevenue) : formatPrice(0) },
    { label: t('dashboard.avgQuoteValue'), value: stats ? formatPrice(stats.avgQuoteValue) : formatPrice(0) },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`rounded-lg border border-border/60 bg-white p-3 ${ACCENT_COLORS[i]} border-t-2`}
        >
          {isLoading ? (
            <div className="space-y-2">
              <div className={cn(ds.skeleton.line, 'h-3 w-16')} />
              <div className={cn(ds.skeleton.line, 'h-6 w-20')} />
            </div>
          ) : (
            <>
              <p className={ds.text.label}>
                {card.label}
              </p>
              <p className={cn('mt-1 font-semibold text-navy text-sm sm:text-lg truncate')}>
                {card.value}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
