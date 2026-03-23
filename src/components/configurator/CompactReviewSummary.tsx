import { useTranslation } from 'react-i18next'
import { Ship, Package, User, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice } from '@/lib/formatters'
import { getLocalizedName } from '@/lib/i18n-helpers'
import { calculatePriceBreakdown } from '@/lib/pricing'
import type {
  Boat,
  ClientFormData,
  ConfiguratorDiscount,
  EquipmentCategoryWithItems,
  EquipmentItem,
} from '@/types'

interface CompactReviewSummaryProps {
  boat: Boat
  boatEquipment: EquipmentCategoryWithItems[]
  selectedEquipment: Map<string, EquipmentItem>
  discounts: ConfiguratorDiscount[]
  clientData: ClientFormData
}

/* Same Card component as QuoteDetailPage */
interface CardProps {
  icon: typeof Ship
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

export function CompactReviewSummary({
  boat,
  boatEquipment,
  selectedEquipment,
  discounts,
  clientData,
}: CompactReviewSummaryProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'hr' | 'en'

  const boatDiscounts = discounts.filter((d) => d.level === 'boat_base')
  const equipmentItemDiscounts = discounts.filter((d) => d.level === 'equipment_item')
  const equipmentAllDiscounts = discounts.filter((d) => d.level === 'equipment_all')

  const selectedItems = Array.from(selectedEquipment.values())

  const itemDiscountableMap = new Map<string, boolean>()
  for (const cat of boatEquipment) {
    for (const item of cat.items) {
      if (selectedEquipment.has(item.id)) {
        itemDiscountableMap.set(item.id, item.is_discountable ?? cat.is_discountable ?? true)
      }
    }
  }

  const priceBreakdown = calculatePriceBreakdown(boat.base_price, selectedItems, discounts, itemDiscountableMap)

  const getEquipmentItemName = (itemId: string): string => {
    const item = selectedEquipment.get(itemId)
    if (!item) return itemId
    return getLocalizedName(item, lang)
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Pricing — prominent, top-left */}
      <Card
        icon={Calculator}
        title={t('configurator.priceSummary')}
        className="border-gold/30 bg-gold/5"
      >
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t('configurator.basePrice')}</span>
            <span className="font-medium">{formatPrice(boat.base_price)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t('configurator.equipmentSubtotal')}</span>
            <span className="font-medium">{formatPrice(priceBreakdown.equipmentSubtotal)}</span>
          </div>
          {/* Inline discounts */}
          {discounts.length > 0 && (
            <div className="space-y-1 border-t border-gold/20 pt-2">
              {boatDiscounts.map((d) => (
                <div key={d.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {d.description || t('configurator.boatDiscount')}
                  </span>
                  <span className="font-medium text-red-600">
                    {d.type === 'percentage'
                      ? `-${d.value}%`
                      : `-${formatPrice(d.value)}`}
                  </span>
                </div>
              ))}
              {equipmentItemDiscounts.map((d) => {
                const itemName = d.equipmentItemId ? getEquipmentItemName(d.equipmentItemId) : ''
                return (
                  <div key={d.id} className="flex justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {itemName}{d.description ? ` — ${d.description}` : ''}
                    </span>
                    <span className="font-medium text-red-600">
                      {d.type === 'percentage'
                        ? `-${d.value}%`
                        : `-${formatPrice(d.value)}`}
                    </span>
                  </div>
                )
              })}
              {equipmentAllDiscounts.map((d) => (
                <div key={d.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {d.description || t('configurator.equipmentWideDiscount')}
                  </span>
                  <span className="font-medium text-red-600">
                    {d.type === 'percentage'
                      ? `-${d.value}%`
                      : `-${formatPrice(d.value)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          {priceBreakdown.totalDiscount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('configurator.totalDiscount')}</span>
              <span className="font-medium text-red-600">
                -{formatPrice(priceBreakdown.totalDiscount)}
              </span>
            </div>
          )}
          <div className="border-t border-gold/30 pt-2">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-sm font-semibold text-navy">
                {t('configurator.grandTotal')}
              </span>
              <span className="font-display text-xl font-bold text-gold">
                {formatPrice(priceBreakdown.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Boat & Client — top-right */}
      <Card icon={User} title={`${t('configurator.boatDetails')} & ${t('configurator.clientInfo')}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Boat side */}
          <div>
            <p className={cn(ds.text.label, 'mb-1.5')}>{t('configurator.boatDetails')}</p>
            <div className="space-y-2">
              {boat.hero_image_url && (
                <img
                  src={boat.hero_image_url}
                  alt={boat.name}
                  loading="lazy"
                  className="max-h-28 w-full rounded-lg object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium text-navy">{boat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {boat.brand}
                  {boat.year && <> &middot; {boat.year}</>}
                </p>
              </div>
              <p className="font-display text-base font-semibold text-gold">
                {formatPrice(boat.base_price)}
              </p>
            </div>
          </div>
          {/* Client side */}
          <div>
            <p className={cn(ds.text.label, 'mb-1.5')}>{t('configurator.clientInfo')}</p>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-navy">{clientData.name}</p>
              <div className="space-y-0.5 text-xs text-muted-foreground">
                {clientData.email && <p>{clientData.email}</p>}
                {clientData.phone && <p>{clientData.phone}</p>}
                {clientData.companyName && <p>{clientData.companyName}</p>}
              </div>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {clientData.language === 'hr' ? '🇭🇷 HR' : '🇬🇧 EN'}
              </span>
              {clientData.notes && (
                <div className="mt-2 rounded-md bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">{clientData.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Equipment Breakdown — full width */}
      <Card icon={Package} title={t('configurator.equipmentSummary')} className="lg:col-span-2">
        {boatEquipment.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('configurator.noOptionalSelected')}</p>
        ) : (
          <div className="space-y-3">
            {boatEquipment.map((category) => {
              const catSelectedItems = category.items.filter((item) =>
                selectedEquipment.has(item.id),
              )
              if (catSelectedItems.length === 0) return null

              const categoryTotal = catSelectedItems
                .filter((i) => !i.is_standard)
                .reduce((sum, i) => sum + i.price, 0)

              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between border-b border-border pb-1.5">
                    <h4 className="text-xs font-medium text-navy">
                      {getLocalizedName(category, lang)}
                    </h4>
                    {categoryTotal > 0 && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatPrice(categoryTotal)}
                      </span>
                    )}
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {catSelectedItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 py-0.5 text-xs"
                      >
                        <span className="min-w-0 truncate text-foreground">
                          {getLocalizedName(item, lang)}
                        </span>
                        {item.is_standard ? (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                            {t('configurator.standardIncluded')}
                          </span>
                        ) : (
                          <span className="font-medium text-foreground">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
