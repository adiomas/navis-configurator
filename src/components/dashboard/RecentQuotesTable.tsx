import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { formatPrice, formatDate } from '@/lib/formatters'
import type { QuoteStatus } from '@/types'
import type { RecentQuote } from '@/hooks/useDashboard'

interface RecentQuotesTableProps {
  quotes: RecentQuote[]
  isLoading: boolean
}

export const RecentQuotesTable = ({ quotes, isLoading }: RecentQuotesTableProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={ds.card.base}>
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
        <h3 className={ds.card.title}>
          {t('dashboard.recentQuotes')}
        </h3>
        <button
          onClick={() => navigate('/quotes')}
          className={cn(ds.text.link, 'inline-flex items-center gap-1')}
        >
          {t('dashboard.viewAll')}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn(ds.skeleton.line, 'h-8')} />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-xs text-muted-foreground">
          <p>{t('dashboard.noData')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                <th className={cn(ds.table.headerCell, 'text-left')}>{t('quotes.quoteNumber')}</th>
                <th className={cn(ds.table.headerCell, 'text-left')}>{t('quotes.boat')}</th>
                <th className={cn(ds.table.headerCell, 'hidden text-left sm:table-cell')}>{t('quotes.client')}</th>
                <th className={cn(ds.table.headerCell, 'text-left')}>{t('common.status')}</th>
                <th className={cn(ds.table.headerCell, 'text-right')}>{t('quotes.amount')}</th>
                <th className={cn(ds.table.headerCell, 'hidden text-left sm:table-cell')}>{t('quotes.date')}</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr
                  key={quote.id}
                  onClick={() => navigate(`/quotes/${quote.id}`)}
                  className={ds.table.rowClickable}
                >
                  <td className={cn(ds.table.cell, 'whitespace-nowrap font-medium text-navy')}>
                    {quote.quote_number}
                  </td>
                  <td className={cn(ds.table.cell, 'whitespace-nowrap text-foreground')}>
                    {quote.boat_name ?? '-'}
                  </td>
                  <td className={cn(ds.table.cell, 'hidden whitespace-nowrap text-muted-foreground sm:table-cell')}>
                    {quote.company_name ?? '-'}
                  </td>
                  <td className={cn(ds.table.cell, 'whitespace-nowrap')}>
                    <QuoteStatusBadge status={quote.status as QuoteStatus} />
                  </td>
                  <td className={cn(ds.table.cell, 'whitespace-nowrap text-right font-medium text-navy')}>
                    {quote.total_price ? formatPrice(quote.total_price) : '-'}
                  </td>
                  <td className={cn(ds.table.cell, 'hidden whitespace-nowrap text-muted-foreground sm:table-cell')}>
                    {formatDate(quote.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
