import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Building2,
  Package,
  Calculator,
  FileText,
  Clock,
  Copy,
  Pencil,
  Send,
  Check,
  X,
  RotateCcw,
  Download,
  Loader2,
  Eye,
  MoreHorizontal,
  CreditCard,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice, formatDate } from '@/lib/formatters'
import { useAuth } from '@/hooks/useAuth'
import { useQuote, useCopyQuote, useUpdateQuoteStatus, useUpdateQuoteDeposit, useUpdateQuoteLanguage } from '@/hooks/useQuotes'
import { useBoat, useBoatEquipment } from '@/hooks/useBoats'
import { useSettings } from '@/hooks/useSettings'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge'
import { QuoteTimeline } from '@/components/quotes/QuoteTimeline'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PDFPreviewModal } from '@/components/pdf/PDFPreviewModal'
import type { QuoteStatus, QuoteWithDetails } from '@/types'

export default function QuoteDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const lang = i18n.language as 'hr' | 'en'

  const { user: currentUser, isAdmin } = useAuth()
  const { data: quote, isLoading, error } = useQuote(id)
  const boatId = quote?.boat_id ?? undefined
  const { data: boatData } = useBoat(boatId)
  const { data: boatEquipment } = useBoatEquipment(boatId)
  const { data: settings } = useSettings()
  const copyQuote = useCopyQuote()
  const updateStatus = useUpdateQuoteStatus()
  const updateDeposit = useUpdateQuoteDeposit()
  const updateLanguage = useUpdateQuoteLanguage()
  const loadFromQuote = useConfiguratorStore((s) => s.loadFromQuote)

  const canEdit = isAdmin || quote?.created_by === currentUser?.id

  const [confirmingStatus, setConfirmingStatus] = useState<QuoteStatus | null>(null)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [tempDepositPercentage, setTempDepositPercentage] = useState<number | null>(null)
  const [isEditingDeposit, setIsEditingDeposit] = useState(false)
  const [customDepositInput, setCustomDepositInput] = useState('')

  // Group equipment items by category
  const equipmentByCategory = useMemo(() => {
    if (!quote?.items) return new Map<string, QuoteWithDetails['items']>()
    const map = new Map<string, QuoteWithDetails['items']>()
    for (const item of quote.items) {
      const catName = lang === 'hr'
        ? (item.category_name_hr ?? 'Ostalo')
        : (item.category_name_en ?? 'Other')
      const existing = map.get(catName) ?? []
      existing.push(item)
      map.set(catName, existing)
    }
    return map
  }, [quote?.items, lang])

  // Sync deposit state when quote loads
  const depositInitialized = useState(false)
  if (quote && !depositInitialized[0]) {
    setTempDepositPercentage(quote.deposit_percentage != null ? Number(quote.deposit_percentage) : null)
    depositInitialized[1](true)
  }

  const handleDepositPreset = (pct: number) => {
    setTempDepositPercentage(pct)
    setCustomDepositInput('')
    setIsEditingDeposit(true)
  }

  const handleCustomDepositChange = (value: string) => {
    setCustomDepositInput(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setTempDepositPercentage(num)
      setIsEditingDeposit(true)
    }
  }

  const handleSaveDeposit = () => {
    if (!id || tempDepositPercentage == null) return
    updateDeposit.mutate(
      { quoteId: id, depositPercentage: tempDepositPercentage },
      {
        onSuccess: () => {
          setIsEditingDeposit(false)
          toast.success(t('quotes.depositSaved'))
        },
      }
    )
  }

  const handleRemoveDeposit = () => {
    if (!id) return
    updateDeposit.mutate(
      { quoteId: id, depositPercentage: null },
      {
        onSuccess: () => {
          setTempDepositPercentage(null)
          setCustomDepositInput('')
          setIsEditingDeposit(false)
          toast.success(t('quotes.depositRemoved'))
        },
      }
    )
  }

  const handleCopy = async () => {
    if (!id) return
    try {
      const newQuote = await copyQuote.mutateAsync(id)
      navigate(`/quotes/${newQuote.id}`)
    } catch {
      // Error handled by React Query
    }
  }

  const handleEdit = () => {
    if (!quote || !boatEquipment) return
    loadFromQuote(quote, boatEquipment)
    navigate('/configurator')
  }

  const buildPdfDocument = async (q: QuoteWithDetails) => {
    const [
      { PDFDetailedTemplate },
      { generatePaymentBarcode },
    ] = await Promise.all([
      import('@/components/pdf/PDFDetailedTemplate'),
      import('@/lib/barcode-unified'),
    ])

    const barcodeDataUrl = await generatePaymentBarcode(
      q.quote_number,
      Number(q.total_price ?? 0),
      q.company?.name ?? '',
      settings!,
      q.language,
      q.deposit_percentage,
    )

    return (
      <PDFDetailedTemplate
        quote={q}
        settings={settings!}
        barcodeDataUrl={barcodeDataUrl}
        boatSpecs={boatData?.specs}
      />
    )
  }

  const handleDownloadPDF = async () => {
    if (!quote || !settings) return
    setIsDownloadingPDF(true)
    try {
      const { generatePDF, downloadPDF } = await import('@/lib/pdf-generator')
      const doc = await buildPdfDocument(quote)
      const blob = await generatePDF(doc)
      downloadPDF(blob, `${quote.quote_number}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      toast.error(t('quotes.pdfDownloadError'))
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  const handlePreviewPDF = async () => {
    if (!quote || !settings) return
    setIsPreviewing(true)
    setShowPreview(true)
    try {
      const { generatePDF } = await import('@/lib/pdf-generator')
      const doc = await buildPdfDocument(quote)
      const blob = await generatePDF(doc)
      setPreviewBlob(blob)
    } catch (err) {
      console.error('PDF preview failed:', err)
      toast.error(t('quotes.pdfDownloadError'))
      setShowPreview(false)
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleStatusChange = (newStatus: QuoteStatus) => {
    setConfirmingStatus(newStatus)
  }

  const handleConfirmStatus = () => {
    if (!id || !confirmingStatus) return
    updateStatus.mutate(
      { quoteId: id, newStatus: confirmingStatus },
      { onSuccess: () => setConfirmingStatus(null) }
    )
  }

  const confirmDescription = confirmingStatus
    ? t(`quotes.confirm${confirmingStatus.charAt(0).toUpperCase() + confirmingStatus.slice(1)}`)
    : ''

  // Loading skeleton
  if (isLoading) return <DetailSkeleton />

  // Error / not found
  if (error || !quote) {
    return (
      <div className={ds.empty.container}>
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileText className={ds.empty.icon} />
        </div>
        <p className={ds.empty.title}>{t('quotes.quoteNotFound')}</p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary-dark"
        >
          {t('quotes.backToQuotes')}
        </button>
      </div>
    )
  }

  const boat = quote.boat
  const company = quote.company
  const contact = quote.contact
  const createdByProfile = quote.created_by_profile as { id: string; full_name: string | null } | null
  const boatName = boat?.name ?? '—'
  const status = quote.status as QuoteStatus

  const statusTransitions: Record<QuoteStatus, QuoteStatus[]> = {
    draft: ['sent'],
    sent: ['accepted', 'rejected'],
    accepted: ['draft'],
    rejected: ['draft'],
  }

  const transitions = statusTransitions[status]

  return (
    <div className={ds.page.spacing}>
      {/* Header */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={cn(ds.page.title, 'font-mono')}>
              {quote.quote_number}
            </h1>
            <QuoteStatusBadge status={status} />
          </div>
          <p className={ds.text.muted}>
            {t('quotes.createdOn')} {formatDate(quote.created_at)}
            {createdByProfile?.full_name && (
              <> {t('quotes.by')} {createdByProfile.full_name}</>
            )}
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* PDF group */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-white p-1">
          <button
            type="button"
            onClick={handlePreviewPDF}
            disabled={isPreviewing || !settings}
            className={cn(ds.btn.base, ds.btn.sm, ds.btn.ghost, 'disabled:opacity-50')}
            title={t('quotes.previewPDF')}
          >
            {isPreviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{t('quotes.previewPDF')}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF || !settings}
            className={cn(ds.btn.base, ds.btn.sm, ds.btn.primary, 'disabled:opacity-50')}
          >
            {isDownloadingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isDownloadingPDF ? t('quotes.pdfDownloading') : t('quotes.downloadPDF')}</span>
          </button>
        </div>

        {/* Edit group - visible on desktop, hidden in mobile "more" */}
        {canEdit && (
          <>
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={handleCopy}
                disabled={copyQuote.isPending}
                className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary, 'disabled:opacity-50')}
              >
                <Copy className="h-3.5 w-3.5" />
                {t('quotes.copyQuote')}
              </button>
              <button
                type="button"
                onClick={handleEdit}
                disabled={!boatEquipment}
                className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary, 'disabled:opacity-50')}
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('quotes.editQuote')}
              </button>
            </div>

            {/* Mobile: more actions toggle */}
            <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => setShowMoreActions(!showMoreActions)}
                className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary)}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              {showMoreActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMoreActions(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => { handleCopy(); setShowMoreActions(false) }}
                      disabled={copyQuote.isPending}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {t('quotes.copyQuote')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleEdit(); setShowMoreActions(false) }}
                      disabled={!boatEquipment}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t('quotes.editQuote')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Status transitions - always visible with clear colors */}
        {canEdit && transitions.map((target) => {
          const config: Record<QuoteStatus, { icon: typeof Send; label: string; className: string }> = {
            sent: { icon: Send, label: t('quotes.markAsSent'), className: cn(ds.btn.primary) },
            accepted: { icon: Check, label: t('quotes.markAsAccepted'), className: 'bg-emerald-600 text-white hover:bg-emerald-700' },
            rejected: { icon: X, label: t('quotes.markAsRejected'), className: 'bg-red-600 text-white hover:bg-red-700' },
            draft: { icon: RotateCcw, label: t('quotes.revertToDraft'), className: cn(ds.btn.secondary) },
          }
          const c = config[target]
          const Icon = c.icon
          return (
            <button
              key={target}
              type="button"
              onClick={() => handleStatusChange(target)}
              disabled={updateStatus.isPending}
              className={cn(ds.btn.base, ds.btn.sm, c.className, 'disabled:opacity-50')}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{c.label}</span>
            </button>
          )
        })}
      </div>

      {/* Detail cards — Pricing first (most important for sales), then context */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Pricing - prominent, top-left on desktop */}
        <Card
          icon={Calculator}
          title={t('quotes.priceSummary')}
          className="border-gold/30 bg-gold/5"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('quotes.basePrice')}</span>
              <span className="font-medium">{formatPrice(Number(quote.boat_base_price ?? 0))}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('quotes.equipmentTotal')}</span>
              <span className="font-medium">{formatPrice(Number(quote.equipment_subtotal ?? 0))}</span>
            </div>
            {/* Inline discounts */}
            {quote.discounts.length > 0 && (
              <div className="space-y-1 border-t border-gold/20 pt-2">
                {quote.discounts.map((d) => (
                  <div key={d.id} className="flex justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {d.description
                        ?? (d.discount_level === 'boat_base' ? t('configurator.boatDiscount')
                          : d.discount_level === 'equipment_all' ? t('configurator.equipmentWideDiscount')
                          : t('configurator.perItemDiscounts'))}
                    </span>
                    <span className="font-medium text-red-600">
                      {d.discount_type === 'percentage'
                        ? `-${Number(d.value)}%`
                        : `-${formatPrice(Number(d.value))}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {Number(quote.total_discount ?? 0) > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('quotes.totalDiscount')}</span>
                <span className="font-medium text-red-600">
                  -{formatPrice(Number(quote.total_discount ?? 0))}
                </span>
              </div>
            )}
            <div className="border-t border-gold/30 pt-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-sm font-semibold text-navy">
                  {t('quotes.grandTotal')}
                </span>
                <span className="font-display text-xl font-bold text-gold">
                  {formatPrice(Number(quote.total_price ?? 0))}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Client & Boat - top-right on desktop */}
        <Card icon={Building2} title={`${t('quotes.clientInfo')} & ${t('quotes.boatInfo')}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Client side */}
            <div>
              <p className={cn(ds.text.label, 'mb-1.5')}>{t('quotes.clientInfo')}</p>
              {company ? (
                <div className="space-y-1.5">
                  <Link
                    to={`/clients/${company.id}`}
                    className="text-sm font-medium text-navy transition-colors hover:text-primary"
                  >
                    {company.name}
                  </Link>
                  {contact && (
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <p>{contact.full_name}</p>
                      {contact.email && <p>{contact.email}</p>}
                      {contact.phone && <p>{contact.phone}</p>}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!id) return
                      const newLang = quote.language === 'hr' ? 'en' : 'hr'
                      updateLanguage.mutate(
                        { quoteId: id, language: newLang },
                        { onSuccess: () => toast.success(t('quotes.languageUpdated')) }
                      )
                    }}
                    disabled={updateLanguage.isPending}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                    title={t('quotes.changeLanguage')}
                  >
                    {quote.language === 'hr' ? '🇭🇷 HR' : '🇬🇧 EN'}
                    <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none"><path d="M3 4.5h6L6 8.5 3 4.5Z" fill="currentColor"/></svg>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
            {/* Boat side */}
            <div>
              <p className={cn(ds.text.label, 'mb-1.5')}>{t('quotes.boatInfo')}</p>
              {boat ? (
                <div className="space-y-2">
                  {boat.hero_image_url && (
                    <img
                      src={boat.hero_image_url}
                      alt={boatName}
                      className="max-h-28 w-full rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-navy">{boatName}</p>
                    <p className="text-xs text-muted-foreground">
                      {boat.brand}
                      {boat.year && <> · {boat.year}</>}
                    </p>
                  </div>
                  <p className="font-display text-base font-semibold text-gold">
                    {formatPrice(Number(quote.boat_base_price ?? 0))}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </Card>

        {/* Equipment Breakdown - full width */}
        <Card icon={Package} title={t('quotes.equipmentBreakdown')} className="lg:col-span-2">
          {quote.items.length > 0 ? (
            <div className="space-y-3">
              {Array.from(equipmentByCategory.entries()).map(([category, items]) => {
                const categoryTotal = items
                  .filter((i) => i.item_type !== 'equipment_standard')
                  .reduce((sum, i) => sum + Number(i.price ?? 0), 0)

                return (
                  <div key={category}>
                    <div className="flex items-center justify-between border-b border-border pb-1.5">
                      <h4 className="text-xs font-medium text-navy">{category}</h4>
                      {categoryTotal > 0 && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatPrice(categoryTotal)}
                        </span>
                      )}
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {items.map((item) => {
                        const itemName = lang === 'hr' ? item.name_hr : item.name_en
                        const isStandard = item.item_type === 'equipment_standard'
                        return (
                          <li
                            key={item.id}
                            className="flex items-center justify-between py-0.5 text-xs"
                          >
                            <span className="min-w-0 truncate text-foreground">{itemName}</span>
                            {isStandard ? (
                              <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                {t('quotes.standard')}
                              </span>
                            ) : (
                              <span className="shrink-0 font-medium text-foreground">
                                {formatPrice(Number(item.price ?? 0))}
                              </span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </Card>

        {/* Payment Barcode / Deposit config - full width */}
        {canEdit && (
          <Card icon={CreditCard} title={t('quotes.paymentBarcode')} className="lg:col-span-2">
            <div className="space-y-3">
              {/* Preset buttons */}
              <div>
                <p className={cn(ds.text.label, 'mb-1.5')}>{t('quotes.depositPercentage')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 20, 30, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleDepositPreset(pct)}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                        tempDepositPercentage === pct
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-white text-foreground hover:bg-muted'
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom input */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">{t('quotes.customPercentage')}:</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={customDepositInput}
                  onChange={(e) => handleCustomDepositChange(e.target.value)}
                  placeholder="0-100"
                  className="h-8 w-20 rounded-md border border-border bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>

              {/* Calculated amount + label preview */}
              {tempDepositPercentage != null && tempDepositPercentage > 0 && (
                <div className="space-y-2 rounded-md bg-muted/50 p-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('quotes.depositAmount')}</span>
                    <span className="font-medium">
                      {formatPrice(Number(quote.total_price ?? 0) * (tempDepositPercentage / 100))}
                      {tempDepositPercentage < 100 && (
                        <span className="ml-1 text-muted-foreground">
                          ({tempDepositPercentage}% {lang === 'hr' ? 'od' : 'of'} {formatPrice(Number(quote.total_price ?? 0))})
                        </span>
                      )}
                    </span>
                  </div>
                  {tempDepositPercentage < 100 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('quotes.labelPreview')}</span>
                      <span className="font-medium text-navy">
                        {lang === 'hr'
                          ? `Predujam ${tempDepositPercentage}% — ${formatPrice(Number(quote.total_price ?? 0) * (tempDepositPercentage / 100))}`
                          : `Advance payment ${tempDepositPercentage}% — ${formatPrice(Number(quote.total_price ?? 0) * (tempDepositPercentage / 100))}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Save / Cancel / Remove buttons */}
              <div className="flex items-center gap-2">
                {isEditingDeposit && (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveDeposit}
                      disabled={updateDeposit.isPending || tempDepositPercentage == null}
                      className={cn(ds.btn.base, ds.btn.sm, ds.btn.primary, 'disabled:opacity-50')}
                    >
                      {updateDeposit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {t('common.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempDepositPercentage(quote.deposit_percentage != null ? Number(quote.deposit_percentage) : null)
                        setCustomDepositInput('')
                        setIsEditingDeposit(false)
                      }}
                      className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary)}
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('common.cancel')}
                    </button>
                  </>
                )}
                {quote.deposit_percentage != null && !isEditingDeposit && (
                  <button
                    type="button"
                    onClick={handleRemoveDeposit}
                    disabled={updateDeposit.isPending}
                    className={cn(ds.btn.base, ds.btn.sm, 'text-red-600 hover:bg-red-50 disabled:opacity-50')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('quotes.removeBarcode')}
                  </button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Timeline + Notes - full width */}
        <Card icon={Clock} title={t('quotes.timeline')} className="lg:col-span-2">
          {quote.notes && (
            <div className="mb-3 rounded-md bg-muted/50 p-2.5">
              <p className={cn(ds.text.label, 'mb-1')}>
                <FileText className="mr-1 inline h-3 w-3" />
                {t('quotes.notes')}
              </p>
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                {quote.notes}
              </p>
            </div>
          )}
          <QuoteTimeline statusHistory={quote.status_history} />
        </Card>
      </div>

      {/* Confirm status change */}
      <ConfirmDialog
        isOpen={!!confirmingStatus}
        title={t('quotes.confirmStatusTitle')}
        description={confirmDescription}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        isDangerous={confirmingStatus === 'rejected'}
        isLoading={updateStatus.isPending}
        onConfirm={handleConfirmStatus}
        onCancel={() => setConfirmingStatus(null)}
      />

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPreview}
        pdfBlob={previewBlob}
        isGenerating={isPreviewing}
        fileName={`${quote.quote_number}.pdf`}
        onClose={() => {
          setShowPreview(false)
          setPreviewBlob(null)
        }}
        onDownload={() => {
          if (previewBlob) {
            import('@/lib/pdf-generator').then(({ downloadPDF }) => {
              downloadPDF(previewBlob, `${quote.quote_number}.pdf`)
            })
          }
        }}
      />
    </div>
  )
}

// --- Helper components ---

interface CardProps {
  icon: typeof Building2
  title: string
  className?: string
  children: React.ReactNode
}

function Card({ icon: Icon, title, className, children }: CardProps) {
  return (
    <div className={cn(ds.card.padded, className)}>
      <div className={cn(ds.card.titleMargin, 'flex items-center gap-2')}>
        <Icon className="h-4 w-4 text-primary" />
        <h3 className={ds.card.title}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className={cn(ds.page.spacing, 'animate-pulse')}>
      <div className="flex items-center gap-3">
        <div className={cn(ds.skeleton.line, 'h-6 w-36')} />
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className={cn(ds.skeleton.line, 'h-8 w-48')} />
        <div className={cn(ds.skeleton.line, 'h-8 w-24')} />
        <div className={cn(ds.skeleton.line, 'h-8 w-24')} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Pricing skeleton */}
        <div className={cn(ds.card.padded, 'border-gold/30 bg-gold/5')}>
          <div className={cn(ds.skeleton.line, 'mb-3 h-5 w-32')} />
          <div className="space-y-2">
            <div className={cn(ds.skeleton.line, 'w-full')} />
            <div className={cn(ds.skeleton.line, 'w-3/4')} />
            <div className={cn(ds.skeleton.line, 'h-6 w-1/2')} />
          </div>
        </div>
        {/* Client & Boat skeleton */}
        <div className={ds.card.padded}>
          <div className={cn(ds.skeleton.line, 'mb-3 h-5 w-48')} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <div className={cn(ds.skeleton.line, 'w-full')} />
              <div className={cn(ds.skeleton.line, 'w-3/4')} />
            </div>
            <div className="space-y-2">
              <div className={cn(ds.skeleton.line, 'w-full')} />
              <div className={cn(ds.skeleton.line, 'w-3/4')} />
            </div>
          </div>
        </div>
        {/* Equipment + Timeline skeletons */}
        {[1, 2].map((i) => (
          <div key={i} className={cn(ds.card.padded, 'lg:col-span-2')}>
            <div className={cn(ds.skeleton.line, 'mb-3 h-5 w-40')} />
            <div className="space-y-2">
              <div className={cn(ds.skeleton.line, 'w-full')} />
              <div className={cn(ds.skeleton.line, 'w-3/4')} />
              <div className={cn(ds.skeleton.line, 'w-1/2')} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
