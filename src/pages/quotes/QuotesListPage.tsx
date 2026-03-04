import { useCallback, useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, FileText, ChevronLeft, ChevronRight, ChevronDown, Zap, X } from 'lucide-react'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useAuth } from '@/hooks/useAuth'
import { useQueryParam } from '@/hooks/useQueryParams'
import { useQuotes, useQuoteStatusCounts, useUpdateQuoteStatus } from '@/hooks/useQuotes'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { QuoteActions } from '@/components/quotes/QuoteActions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatPrice, formatDate } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import type { QuoteStatus } from '@/types'

type SortOption = 'date' | 'amount'

const PER_PAGE = 10

export default function QuotesListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const resetConfigurator = useConfiguratorStore((s) => s.reset)

  const [search, setSearch] = useQueryParam('search')
  const [statusParam, setStatusParam] = useQueryParam('status', 'all')
  const [sortParam, setSortParam] = useQueryParam('sort', 'date')
  const [templateParam, setTemplateParam] = useQueryParam('template')

  const statusFilter = statusParam as QuoteStatus | 'all'
  const sort = sortParam as SortOption

  const [searchInput, setSearchInput] = useState(search)
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmingQuote, setConfirmingQuote] = useState<{ id: string; newStatus: QuoteStatus } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, setSearch])

  const { data: quotesResult, isLoading, error, refetch } = useQuotes({
    page: currentPage,
    search: search || undefined,
    status: statusFilter,
    sort,
    templateGroupId: templateParam || undefined,
  })

  const { data: statusCounts } = useQuoteStatusCounts(templateParam || undefined)

  const { data: templateGroupName } = useQuery({
    queryKey: ['templateGroup', templateParam, 'name'],
    queryFn: async () => {
      const { data } = await supabase
        .from('quote_template_groups')
        .select('name')
        .eq('id', templateParam!)
        .single()
      return data?.name ?? null
    },
    enabled: !!templateParam,
  })
  const updateStatus = useUpdateQuoteStatus()

  const quotes = quotesResult?.data ?? []
  const totalCount = quotesResult?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))

  const statusTabs = useMemo(() => {
    const tabs: { value: QuoteStatus | 'all'; label: string }[] = [
      { value: 'all', label: t('quotes.all') },
      { value: 'draft', label: t('quotes.draft') },
      { value: 'sent', label: t('quotes.sent') },
      { value: 'accepted', label: t('quotes.accepted') },
      { value: 'rejected', label: t('quotes.rejected') },
    ]
    return tabs
  }, [t])

  const handleNewQuote = () => {
    resetConfigurator()
    navigate('/configurator')
  }

  const handleStatusChange = (quoteId: string, newStatus: QuoteStatus) => {
    setConfirmingQuote({ id: quoteId, newStatus })
  }

  const handleConfirmStatus = () => {
    if (!confirmingQuote) return
    updateStatus.mutate(
      { quoteId: confirmingQuote.id, newStatus: confirmingQuote.newStatus },
      { onSuccess: () => setConfirmingQuote(null) }
    )
  }

  const queryClient = useQueryClient()

  const prefetchQuote = useCallback(
    (quoteId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['quote', quoteId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('quotes')
            .select('*, boat:boats(*), company:companies(*), contact:contacts(*), items:quote_items(*), discounts:quote_discounts(*), status_history:quote_status_history(*, changed_by_profile:profiles!quote_status_history_changed_by_fkey(id, full_name)), created_by_profile:profiles!quotes_created_by_fkey(id, full_name)')
            .eq('id', quoteId)
            .order('created_at', { referencedTable: 'quote_status_history', ascending: false })
            .single()
          if (error) throw error
          return data
        },
        staleTime: 30 * 1000,
      })
    },
    [queryClient]
  )

  const confirmDescription = confirmingQuote
    ? t(`quotes.confirm${confirmingQuote.newStatus.charAt(0).toUpperCase() + confirmingQuote.newStatus.slice(1)}`)
    : ''

  return (
    <div className={ds.page.spacing}>
      {/* Header */}
      <div className={ds.page.header}>
        <h1 className={ds.page.title}>
          {t('quotes.title')}
        </h1>
        <button
          type="button"
          onClick={handleNewQuote}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
        >
          <Plus className="h-4 w-4" />
          {t('quotes.newQuote')}
        </button>
      </div>

      {/* Template filter banner */}
      {templateParam && templateGroupName && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <Zap className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t('quotes.filteringByTemplate')}{templateGroupName}
          </span>
          <button
            type="button"
            onClick={() => { setTemplateParam(''); setCurrentPage(1) }}
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            title={t('quotes.clearFilter')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background pl-9 pr-4 text-base md:text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="-mx-1 flex overflow-x-auto px-1 sm:mx-0 sm:px-0">
            <div className="flex rounded-lg border border-border">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => { setStatusParam(tab.value); setCurrentPage(1) }}
                  className={cn(
                    'whitespace-nowrap px-2.5 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg',
                    statusFilter === tab.value
                      ? 'bg-navy text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {tab.label}
                  {statusCounts && (
                    <span className="ml-1 text-[10px] opacity-70">
                      ({statusCounts[tab.value] ?? 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => { setSortParam(e.target.value); setCurrentPage(1) }}
              className="h-8 cursor-pointer appearance-none rounded-lg border border-input bg-background px-2.5 pr-7 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="date">{t('quotes.sortByDate')}</option>
              <option value="amount">{t('quotes.sortByAmount')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <QueryErrorState onRetry={refetch} />
      ) : quotes.length === 0 ? (
        <EmptyState
          message={
            templateParam
              ? t('quotes.noQuotesForTemplate')
              : totalCount === 0 && !search && statusFilter === 'all'
                ? t('quotes.noQuotesYet')
                : t('quotes.noQuotes')
          }
          showCta={!templateParam && totalCount === 0 && !search && statusFilter === 'all'}
          onAdd={handleNewQuote}
        />
      ) : (
        <div className={cn(ds.table.wrapper, ds.card.base)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className={cn(ds.table.headerCell, 'text-left')}>
                  {t('quotes.quoteNumber')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-left sm:table-cell')}>
                  {t('quotes.boat')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-left sm:table-cell')}>
                  {t('quotes.client')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-left lg:table-cell')}>
                  {t('quotes.createdBy')}
                </th>
                <th className={cn(ds.table.headerCell, 'text-left')}>
                  {t('common.status')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-right sm:table-cell')}>
                  {t('quotes.amount')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-left md:table-cell')}>
                  {t('quotes.date')}
                </th>
                <th className={cn(ds.table.headerCell, 'text-right')}>
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => {
                const boat = quote.boat as { id: string; name: string; hero_image_url: string | null } | null
                const company = quote.company as { id: string; name: string } | null
                const createdByProfile = quote.created_by_profile as { id: string; full_name: string } | null
                const boatName = boat?.name ?? '—'

                return (
                  <tr
                    key={quote.id}
                    onMouseEnter={() => prefetchQuote(quote.id)}
                    className={ds.table.rowClickable}
                  >
                    <td className={ds.table.cell}>
                      <Link
                        to={`/quotes/${quote.id}`}
                        className="font-mono text-xs font-medium text-navy transition-colors hover:text-primary"
                      >
                        {quote.quote_number}
                      </Link>
                      {/* Mobile: show boat, client, price, date inline */}
                      <span className="mt-0.5 flex flex-col gap-0.5 text-[11px] sm:hidden">
                        <span className="text-foreground">{boatName}</span>
                        {company?.name && (
                          <span className="text-muted-foreground">{company.name}</span>
                        )}
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-navy">
                            {formatPrice(Number(quote.total_price ?? 0))}
                          </span>
                          <span className="text-muted-foreground">
                            {formatDate(quote.created_at)}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-foreground sm:table-cell')}>
                      {boatName}
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-muted-foreground sm:table-cell')}>
                      {company?.name ?? '—'}
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-muted-foreground lg:table-cell')}>
                      {createdByProfile?.full_name ?? '—'}
                    </td>
                    <td className={ds.table.cell}>
                      <QuoteStatusBadge status={quote.status as QuoteStatus} />
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-right font-medium sm:table-cell')}>
                      {formatPrice(Number(quote.total_price ?? 0))}
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-muted-foreground md:table-cell')}>
                      {formatDate(quote.created_at)}
                    </td>
                    <td className={ds.table.cell}>
                      <QuoteActions
                        quoteId={quote.id}
                        status={quote.status as QuoteStatus}
                        onStatusChange={handleStatusChange}
                        isLoading={updateStatus.isPending}
                        canEdit={isAdmin || quote.created_by === user?.id}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalCount > PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {currentPage}/{totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => { setCurrentPage((p) => p - 1); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary, 'disabled:opacity-50')}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('quotes.previous')}</span>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => { setCurrentPage((p) => p + 1); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary, 'disabled:opacity-50')}
            >
              <span className="hidden sm:inline">{t('quotes.next')}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm status change */}
      <ConfirmDialog
        isOpen={!!confirmingQuote}
        title={t('quotes.confirmStatusTitle')}
        description={confirmDescription}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        isLoading={updateStatus.isPending}
        onConfirm={handleConfirmStatus}
        onCancel={() => setConfirmingQuote(null)}
      />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className={cn('overflow-hidden', ds.card.base)}>
      <div className="border-b border-border/60 bg-muted/50 px-3 py-2">
        <div className={cn(ds.skeleton.line, 'w-48')} />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 border-b border-border/30 px-3 py-2 last:border-0"
        >
          <div className="space-y-1">
            <div className={cn(ds.skeleton.line, 'w-24')} />
            <div className={cn(ds.skeleton.line, 'h-3 w-20 sm:hidden')} />
          </div>
          <div className="space-y-1">
            <div className={cn(ds.skeleton.line, 'w-32')} />
            <div className={cn(ds.skeleton.line, 'h-3 w-28 sm:hidden')} />
          </div>
          <div className={cn(ds.skeleton.line, 'hidden w-28 sm:block')} />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className={cn(ds.skeleton.line, 'ml-auto hidden w-20 sm:block')} />
          <div className={cn(ds.skeleton.line, 'ml-auto w-8 sm:w-20')} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  message,
  showCta,
  onAdd,
}: {
  message: string
  showCta?: boolean
  onAdd?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className={ds.empty.container}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <FileText className={ds.empty.icon} />
      </div>
      <p className={ds.empty.title}>{message}</p>
      {showCta && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.primary, 'mt-4')}
        >
          <Plus className="h-4 w-4" />
          {t('quotes.newQuote')}
        </button>
      )}
    </div>
  )
}
