import { useTranslation } from 'react-i18next'
import { formatPrice } from '@/lib/formatters'
import type { TopBoat } from '@/hooks/useDashboard'

interface TopBoatsChartProps {
  data: TopBoat[]
  isLoading: boolean
}

export const TopBoatsChart = ({ data, isLoading }: TopBoatsChartProps) => {
  const { t } = useTranslation()

  const maxRevenue = data.length > 0 ? data[0].revenue : 0

  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-navy">
        {t('dashboard.topBoats')}
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center text-xs text-muted-foreground">
          {t('dashboard.noData')}
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((boat, i) => {
            const widthPercent = maxRevenue > 0 ? Math.max((boat.revenue / maxRevenue) * 100, 4) : 4
            return (
              <div key={boat.boatName} className="flex items-center gap-2">
                <span className="w-4 text-right text-[10px] font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="truncate text-xs font-medium text-navy">{boat.boatName}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">{formatPrice(boat.revenue)}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TopBoatsChart
