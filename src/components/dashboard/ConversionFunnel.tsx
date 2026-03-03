import { useTranslation } from 'react-i18next'
import { formatPercentage } from '@/lib/formatters'
import type { FunnelStep } from '@/hooks/useDashboard'

interface ConversionFunnelProps {
  data: FunnelStep[]
  isLoading: boolean
}

const STEP_COLORS = ['#94a3b8', '#2ea3f2', '#10b981']

export const ConversionFunnel = ({ data, isLoading }: ConversionFunnelProps) => {
  const { t } = useTranslation()

  const maxCount = data.length > 0 ? data[0].count : 0

  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-navy">
        {t('dashboard.conversionFunnel')}
      </h3>

      {isLoading ? (
        <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
      ) : maxCount === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
          {t('dashboard.noData')}
        </div>
      ) : (
        <div className="flex flex-col gap-2 py-2">
          {data.map((step, i) => {
            const widthPercent = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 8) : 8
            const labelKey = step.label as 'created' | 'sent' | 'accepted'

            return (
              <div key={step.label}>
                <div className="mb-0.5 flex items-baseline justify-between">
                  <span className="text-xs font-medium text-navy">
                    {t(`dashboard.${labelKey}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {step.count}
                  </span>
                </div>
                <div className="relative h-7 w-full rounded bg-muted/30">
                  <div
                    className="flex h-full items-center rounded px-2 transition-all duration-500"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: STEP_COLORS[i],
                    }}
                  >
                    {widthPercent > 20 && (
                      <span className="text-[10px] font-medium text-white">
                        {step.count}
                      </span>
                    )}
                  </div>
                </div>
                {i > 0 && step.dropoff > 0 && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatPercentage(step.dropoff)} {t('dashboard.dropoff')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ConversionFunnel
