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
        <>
          {/* Mobile skeleton */}
          <div className="sm:hidden space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn(ds.card.base, 'animate-pulse px-4 py-3')}>
                <div className="flex items-center justify-between">
                  <div className={cn(ds.skeleton.line, 'w-20')} />
                  <div className="h-5 w-14 rounded-full bg-muted" />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className={cn(ds.skeleton.line, 'h-3 w-28')} />
                  <div className={cn(ds.skeleton.line, 'h-3 w-16')} />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop skeleton */}
          <div className="hidden sm:block space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn(ds.skeleton.line, 'h-8')} />
            ))}
          </div>
        </>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-xs text-muted-foreground">
          <p>{t('dashboard.noData')}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2 p-3">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                onClick={() => navigate(`/quotes/${quote.id}`)}
                className={cn(ds.card.base, 'cursor-pointer px-4 py-3 hover:bg-muted/30 transition-colors')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-navy">
                    {quote.quote_number}
                  </span>
                  <QuoteStatusBadge status={quote.status as QuoteStatus} />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-foreground truncate mr-2">
                    {quote.boat_name ?? '-'}
                  </span>
                  <span className="text-xs font-medium text-navy whitespace-nowrap">
                    {quote.total_price ? formatPrice(quote.total_price) : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className={cn(ds.table.headerCell, 'text-left')}>{t('quotes.quoteNumber')}</th>
                  <th className={cn(ds.table.headerCell, 'text-left')}>{t('quotes.boat')}</th>
                  <th className={cn(ds.table.headerCell, 'hidden text-left md:table-cell')}>{t('quotes.client')}</th>
                  <th className={cn(ds.table.headerCell, 'text-left')}>{t('common.status')}</th>
                  <th className={cn(ds.table.headerCell, 'text-right')}>{t('quotes.amount')}</th>
                  <th className={cn(ds.table.headerCell, 'hidden text-left md:table-cell')}>{t('quotes.date')}</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr
                    key={quote.id}
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                    className={ds.table.rowClickable}
                  >
                    <td className={cn(ds.table.cell, 'font-medium text-navy')}>
                      {quote.quote_number}
                    </td>
                    <td className={cn(ds.table.cell, 'text-foreground')}>
                      {quote.boat_name ?? '-'}
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-muted-foreground md:table-cell')}>
                      {quote.company_name ?? '-'}
                    </td>
                    <td className={ds.table.cell}>
                      <QuoteStatusBadge status={quote.status as QuoteStatus} />
                    </td>
                    <td className={cn(ds.table.cell, 'text-right font-medium text-navy')}>
                      {quote.total_price ? formatPrice(quote.total_price) : '-'}
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-muted-foreground md:table-cell')}>
                      {formatDate(quote.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
