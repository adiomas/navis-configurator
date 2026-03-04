import { useTranslation } from 'react-i18next'
import type { SalespersonData } from '@/hooks/useDashboard'
import { formatPercentage, formatPrice } from '@/lib/formatters'

interface SalespersonChartProps {
  data: SalespersonData[]
  isLoading: boolean
}

export const SalespersonChart = ({ data, isLoading }: SalespersonChartProps) => {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-navy">
        {t('dashboard.salespersonPerformance')}
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center text-xs text-muted-foreground">
          {t('dashboard.noData')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3">{t('common.name')}</th>
                <th className="hidden pb-2 px-2 text-right sm:table-cell">{t('dashboard.totalQuotesLabel')}</th>
                <th className="pb-2 px-2 text-right">{t('dashboard.acceptedQuotesLabel')}</th>
                <th className="hidden pb-2 px-2 text-right lg:table-cell">{t('dashboard.acceptanceRate')}</th>
                <th className="pb-2 pl-2 text-right">{t('dashboard.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((person) => (
                <tr key={person.name} className="border-b border-border/30 last:border-0">
                  <td className="py-1.5 pr-3 text-xs font-medium text-navy">{person.name}</td>
                  <td className="hidden px-2 py-1.5 text-right text-xs text-muted-foreground sm:table-cell">{person.totalQuotes}</td>
                  <td className="px-2 py-1.5 text-right text-xs text-emerald-600">{person.acceptedQuotes}</td>
                  <td className="hidden px-2 py-1.5 text-right text-xs text-muted-foreground lg:table-cell">{formatPercentage(person.acceptanceRate)}</td>
                  <td className="py-1.5 pl-2 text-right text-xs font-medium text-navy">{formatPrice(person.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SalespersonChart
