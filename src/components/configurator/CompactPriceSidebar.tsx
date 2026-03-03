import { useTranslation } from 'react-i18next'
import { formatPrice } from '@/lib/formatters'
import { getLocalizedName } from '@/lib/i18n-helpers'
import type { ConfiguratorDiscount, EquipmentItem, PriceBreakdown } from '@/types'

interface CompactPriceSidebarProps {
  boatName: string | null
  boatImageUrl: string | null
  basePrice: number
  selectedOptionalItems: EquipmentItem[]
  priceBreakdown: PriceBreakdown
  discounts: ConfiguratorDiscount[]
}

export interface PriceContentProps {
  basePrice: number
  priceBreakdown: PriceBreakdown
  discounts: ConfiguratorDiscount[]
  selectedOptionalItems: EquipmentItem[]
  showEquipmentList?: boolean
}

export function PriceContent({
  basePrice,
  priceBreakdown,
  discounts,
  selectedOptionalItems,
  showEquipmentList = false,
}: PriceContentProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'hr' | 'en'

  const hasBoatDiscounts = priceBreakdown.boatDiscounts > 0
  const hasItemDiscounts = priceBreakdown.equipmentItemDiscounts > 0
  const hasEquipmentAllDiscounts = priceBreakdown.equipmentAllDiscounts > 0

  return (
    <>
      {/* Base price */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t('configurator.basePrice')}</span>
        <span className="font-medium">{formatPrice(basePrice)}</span>
      </div>

      {/* Boat discounts */}
      {hasBoatDiscounts && (
        <>
          {discounts
            .filter((d) => d.level === 'boat_base')
            .map((d) => (
              <div key={d.id} className="flex items-center justify-between pl-3 text-[11px]">
                <span className="flex items-center gap-1 text-red-600">
                  <span className="text-red-400">&minus;</span>
                  {d.description ?? t('configurator.boatDiscount')}
                  {d.type === 'percentage' ? ` (${d.value}%)` : ''}
                </span>
                <span className="font-medium text-red-600">
                  -{formatPrice(
                    d.type === 'percentage'
                      ? basePrice * (d.value / 100)
                      : d.value
                  )}
                </span>
              </div>
            ))}
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              {t('configurator.boatFinalPrice')}
            </span>
            <span className="font-medium">{formatPrice(priceBreakdown.boatFinalPrice)}</span>
          </div>
        </>
      )}

      {/* Equipment subtotal */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t('configurator.equipmentSubtotal')}</span>
        <span className="font-medium">{formatPrice(priceBreakdown.equipmentSubtotal)}</span>
      </div>

      {/* Per-item discounts */}
      {hasItemDiscounts && (
        <div className="flex items-center justify-between pl-3 text-[11px]">
          <span className="text-red-600">{t('configurator.perItemDiscounts')}</span>
          <span className="font-medium text-red-600">
            -{formatPrice(priceBreakdown.equipmentItemDiscounts)}
          </span>
        </div>
      )}

      {/* Equipment-wide discounts */}
      {hasEquipmentAllDiscounts && discounts
        .filter((d) => d.level === 'equipment_all')
        .map((d) => (
          <div key={d.id} className="flex items-center justify-between pl-3 text-[11px]">
            <span className="text-red-600">
              {d.description ?? t('configurator.equipmentWideDiscount')}
              {d.type === 'percentage' ? ` (-${d.value}%)` : ''}
            </span>
            <span className="font-medium text-red-600">
              -{formatPrice(
                d.type === 'percentage'
                  ? (priceBreakdown.equipmentSubtotal - priceBreakdown.equipmentItemDiscounts) * (d.value / 100)
                  : d.value
              )}
            </span>
          </div>
        ))}

      {/* Equipment final */}
      {(hasItemDiscounts || hasEquipmentAllDiscounts) && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">
            {t('configurator.equipmentFinalPrice')}
          </span>
          <span className="font-medium">{formatPrice(priceBreakdown.equipmentFinalTotal)}</span>
        </div>
      )}

      {/* Equipment list */}
      {showEquipmentList && selectedOptionalItems.length > 0 && (
        <div className="border-t border-border pt-1.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('configurator.selectedEquipment')}
          </p>
          <div className="max-h-28 divide-y divide-border/30 overflow-y-auto">
            {selectedOptionalItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-0.5 text-xs">
                <span className="mr-2 truncate text-foreground">{getLocalizedName(item, lang)}</span>
                <span className="shrink-0 text-muted-foreground">{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grand total */}
      {showEquipmentList && (
        <div className="flex items-center justify-between border-t border-border pt-1.5">
          <span className="text-xs font-semibold text-navy">
            {t('configurator.grandTotal')}
          </span>
          <span className="font-display text-sm font-bold text-gold">
            {formatPrice(priceBreakdown.grandTotal)}
          </span>
        </div>
      )}
    </>
  )
}

export function CompactPriceSidebar({
  boatName,
  boatImageUrl,
  basePrice,
  selectedOptionalItems,
  priceBreakdown,
  discounts,
}: CompactPriceSidebarProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'hr' | 'en'

  if (!boatName) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <span className="text-lg text-muted-foreground/50">⛵</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('configurator.selectBoatFirst')}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Mini boat info */}
      <div className="flex items-center gap-2.5 border-b border-border p-3">
        {boatImageUrl ? (
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
            <img
              src={boatImageUrl}
              alt={boatName}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/15 to-transparent" />
          </div>
        ) : (
          <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
            <span className="text-[10px] text-muted-foreground">N/A</span>
          </div>
        )}
        <p className="truncate font-display text-base font-semibold text-navy">{boatName}</p>
      </div>

      {/* Price breakdown */}
      <div className="space-y-1.5 p-3">
        <PriceContent
          basePrice={basePrice}
          priceBreakdown={priceBreakdown}
          discounts={discounts}
          selectedOptionalItems={selectedOptionalItems}
        />
      </div>

      {/* Grand total - premium gold gradient */}
      <div className="mx-3 mb-3 flex items-center justify-between rounded-lg border border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10 p-3">
        <span className="text-xs font-semibold text-navy">
          {t('configurator.grandTotal')}
        </span>
        <span className="price-highlight text-xl font-bold">
          {formatPrice(priceBreakdown.grandTotal)}
        </span>
      </div>

      {/* Optional equipment list */}
      {selectedOptionalItems.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('configurator.selectedEquipment')}
          </p>
          <div className="max-h-36 divide-y divide-border/30 overflow-y-auto">
            {selectedOptionalItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-0.5 text-xs">
                <span className="mr-2 truncate text-foreground">{getLocalizedName(item, lang)}</span>
                <span className="shrink-0 text-muted-foreground">{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
