import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, ChevronUp, Save, FileCheck, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice } from '@/lib/formatters'
import { PriceContent } from './CompactPriceSidebar'
import type { ConfiguratorDiscount, EquipmentItem, PriceBreakdown } from '@/types'

interface MobileBottomBarProps {
  currentStep: 1 | 2 | 3 | 4
  canGoNext: boolean
  onBack: () => void
  onNext: () => void
  priceBreakdown: PriceBreakdown
  discounts: ConfiguratorDiscount[]
  boatName: string | undefined
  selectedOptionalItems: EquipmentItem[]
  basePrice: number
}

export function MobileBottomBar({
  currentStep,
  canGoNext,
  onBack,
  onNext,
  priceBreakdown,
  discounts,
  boatName,
  selectedOptionalItems,
  basePrice,
}: MobileBottomBarProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  const hasAnyDiscount = priceBreakdown.totalDiscount > 0

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 transition-opacity duration-200',
          isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setIsExpanded(false)}
      />

      {/* Expanded price sheet */}
      <div className={cn(
        'relative rounded-t-2xl border-t border-border bg-card px-4 pb-2 pt-3 shadow-2xl transition-transform duration-300 ease-out',
        isExpanded ? 'translate-y-0' : 'translate-y-full',
      )}>
        <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-border" />
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-navy">
            {t('configurator.priceSummary')}
          </h3>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="max-h-56 space-y-1.5 overflow-y-auto">
          <PriceContent
            basePrice={basePrice}
            priceBreakdown={priceBreakdown}
            discounts={discounts}
            selectedOptionalItems={selectedOptionalItems}
            showEquipmentList
          />
        </div>
      </div>

      {/* Bottom bar — consistent h-12 for all steps */}
      <div
        className="relative border-t border-border bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}
      >
        <div className="flex h-14 items-center gap-2 px-3">
          {/* Back */}
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={onBack}
            className={cn(
              ds.btn.base, 'h-10 w-10 shrink-0 rounded-lg',
              currentStep === 1
                ? 'invisible'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>

          {currentStep === 4 ? (
            /* Step 4: Save Draft / Save & Send */
            <>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => document.dispatchEvent(new CustomEvent('configurator:save', { detail: 'draft' }))}
                className={cn(ds.btn.base, 'h-10 shrink-0 rounded-lg border border-border px-3.5 text-xs font-medium text-navy hover:bg-muted')}
              >
                <Save className="h-4 w-4" />
                {t('configurator.saveDraft')}
              </button>
              <button
                type="button"
                onClick={() => document.dispatchEvent(new CustomEvent('configurator:save', { detail: 'sent' }))}
                className={cn(ds.btn.base, 'h-10 shrink-0 rounded-lg bg-primary px-3.5 text-xs font-medium text-white hover:bg-primary/90')}
              >
                <FileCheck className="h-4 w-4" />
                {t('configurator.createOffer')}
              </button>
            </>
          ) : (
            /* Steps 1-3: Price | Next */
            <>
              {/* Center: Price total */}
              {boatName ? (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-1"
                >
                  <ChevronUp className={cn(
                    'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                    isExpanded && 'rotate-180',
                  )} />
                  <span className="font-display text-sm font-bold text-gold">
                    {formatPrice(priceBreakdown.grandTotal)}
                  </span>
                  {hasAnyDiscount && (
                    <span className="shrink-0 rounded bg-red-50 px-1 py-px text-[10px] font-semibold text-red-600 animate-fade-in">
                      &minus;{formatPrice(priceBreakdown.totalDiscount)}
                    </span>
                  )}
                </button>
              ) : (
                <div className="flex-1" />
              )}

              {/* Next */}
              <button
                type="button"
                disabled={!canGoNext}
                onClick={onNext}
                className={cn(
                  ds.btn.base, 'h-10 shrink-0 rounded-lg px-5 text-sm font-medium',
                  canGoNext
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {t('common.next')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
