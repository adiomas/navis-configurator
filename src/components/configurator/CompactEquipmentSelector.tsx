import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Tag, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice } from '@/lib/formatters'
import { getLocalizedName } from '@/lib/i18n-helpers'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useConfiguratorStore } from '@/stores/configurator-store'
import type { ConfiguratorDiscount, DiscountType, EquipmentCategoryWithItems, EquipmentItem } from '@/types'

interface CompactEquipmentSelectorProps {
  categories: EquipmentCategoryWithItems[]
  searchQuery: string
}

export function CompactEquipmentSelector({ categories, searchQuery }: CompactEquipmentSelectorProps) {
  const { t, i18n } = useTranslation()
  const { selectedEquipment, toggleEquipment, discounts, addDiscount, removeDiscount } = useConfiguratorStore()

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [activePopoverItemId, setActivePopoverItemId] = useState<string | null>(null)
  const [popoverAnchorRect, setPopoverAnchorRect] = useState<DOMRect | null>(null)

  const lang = i18n.language as 'hr' | 'en'

  const getItemName = (item: EquipmentItem): string => getLocalizedName(item, lang)
  const getCategoryName = (cat: EquipmentCategoryWithItems): string => getLocalizedName(cat, lang)

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order)

  const filteredCategories = sortedCategories
    .map((cat) => {
      const sortedItems = [...cat.items].sort((a, b) => a.sort_order - b.sort_order)
      if (!searchQuery) return { ...cat, items: sortedItems }
      const q = searchQuery.toLowerCase()
      const matchingItems = sortedItems.filter((item) =>
        getItemName(item).toLowerCase().includes(q),
      )
      return { ...cat, items: matchingItems }
    })
    .filter((cat) => cat.items.length > 0)

  const handleToggleItem = (item: EquipmentItem) => {
    if (item.is_standard) return
    toggleEquipment(item)
  }

  const getItemDiscount = (itemId: string): ConfiguratorDiscount | undefined =>
    discounts.find((d) => d.level === 'equipment_item' && d.equipmentItemId === itemId)

  return (
    <div className="space-y-1.5">
      {filteredCategories.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-muted-foreground">{t('common.noResults')}</p>
        </div>
      ) : (
        filteredCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id)
          const selectedCount = category.items.filter(
            (item) => selectedEquipment.has(item.id),
          ).length
          const totalCount = category.items.length

          return (
            <div
              key={category.id}
              className="relative rounded-lg border border-border bg-card"
            >
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'flex h-10 w-full items-center justify-between px-3 transition-colors hover:bg-muted/50',
                  isExpanded && 'bg-muted/30 font-semibold',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs text-navy transition-all duration-150',
                    isExpanded ? 'font-bold' : 'font-semibold',
                  )}>
                    {getCategoryName(category)}
                  </span>
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {t('configurator.itemsSelected', {
                      selected: selectedCount,
                      total: totalCount,
                    })}
                  </span>
                </div>
                <ChevronDown className={cn(
                  'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                  isExpanded && 'rotate-180',
                )} />
              </button>

              {/* Items list - animated accordion */}
              <div className={cn(
                'overflow-hidden transition-[max-height,opacity] duration-250 ease-out',
                isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
              )}>
                <div className="border-t border-border">
                  {category.items.map((item) => {
                    const isSelected = selectedEquipment.has(item.id)
                    const isStandard = item.is_standard
                    const itemDiscount = getItemDiscount(item.id)
                    const isDiscountable = item.is_discountable ?? category.is_discountable ?? true
                    const showDiscountTag = isSelected && !isStandard && isDiscountable

                    return (
                      <div key={item.id} className="relative">
                        {/* Row wrapper — div instead of button to allow nested interactive elements */}
                        <div
                          role="button"
                          tabIndex={isStandard ? undefined : 0}
                          onClick={() => handleToggleItem(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleToggleItem(item)
                            }
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 border-b border-border px-3 py-2 text-left transition-colors duration-150 last:border-b-0',
                            isStandard
                              ? 'cursor-default bg-muted/30'
                              : isSelected
                                ? 'cursor-pointer bg-primary/5 hover:bg-primary/10'
                                : 'cursor-pointer hover:bg-primary/5',
                          )}
                        >
                          {/* Checkbox */}
                          <div
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150',
                              isSelected || isStandard
                                ? 'border-primary bg-primary'
                                : 'border-input bg-background',
                            )}
                          >
                            {(isSelected || isStandard) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>

                          {/* Name + description + discount badge */}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-foreground">
                              {getItemName(item)}
                            </span>
                            {(item.description_hr || item.description_en) && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                {lang === 'hr' ? item.description_hr : item.description_en}
                              </p>
                            )}
                            {itemDiscount && (
                              <p className="text-[11px] text-red-600">
                                <span className="line-through text-muted-foreground">
                                  {formatPrice(item.price)}
                                </span>{' '}
                                {formatPrice(
                                  itemDiscount.type === 'percentage'
                                    ? item.price * (1 - itemDiscount.value / 100)
                                    : item.price - itemDiscount.value,
                                )}{' '}
                                <span className="font-medium">
                                  -{itemDiscount.type === 'percentage' ? `${itemDiscount.value}%` : formatPrice(itemDiscount.value)}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Price + discount tag */}
                          <div className="flex shrink-0 items-center gap-1.5">
                            {isStandard && (
                              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                                {t('configurator.standardIncluded')}
                              </span>
                            )}
                            {!isStandard && !isDiscountable && (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                {t('equipment.noDiscount')}
                              </span>
                            )}
                            {showDiscountTag && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (activePopoverItemId === item.id) {
                                    setActivePopoverItemId(null)
                                    setPopoverAnchorRect(null)
                                  } else {
                                    setActivePopoverItemId(item.id)
                                    setPopoverAnchorRect(e.currentTarget.getBoundingClientRect())
                                  }
                                }}
                                className={cn(
                                  'flex h-7 w-7 items-center justify-center rounded transition-colors',
                                  itemDiscount
                                    ? 'bg-red-100 text-red-600'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                              >
                                <Tag className="h-3 w-3" />
                              </button>
                            )}
                            <span
                              className={cn(
                                'text-xs font-medium',
                                isStandard ? 'text-muted-foreground' : 'text-foreground',
                              )}
                            >
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>

                        {/* Discount popover */}
                        {activePopoverItemId === item.id && (
                          <ItemDiscountPopover
                            item={item}
                            itemName={getItemName(item)}
                            existingDiscount={itemDiscount}
                            addDiscount={addDiscount}
                            removeDiscount={removeDiscount}
                            onClose={() => {
                              setActivePopoverItemId(null)
                              setPopoverAnchorRect(null)
                            }}
                            t={t}
                            anchorRect={popoverAnchorRect}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

/* --- Discount Popover --- */

interface ItemDiscountPopoverProps {
  item: EquipmentItem
  itemName: string
  existingDiscount: ConfiguratorDiscount | undefined
  addDiscount: (d: ConfiguratorDiscount) => void
  removeDiscount: (id: string) => void
  onClose: () => void
  t: (key: string, options?: Record<string, string>) => string
  anchorRect: DOMRect | null
}

function ItemDiscountPopover({
  item,
  itemName,
  existingDiscount,
  addDiscount,
  removeDiscount,
  onClose,
  t,
  anchorRect,
}: ItemDiscountPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [type, setType] = useState<DiscountType>(existingDiscount?.type ?? 'percentage')
  const [value, setValue] = useState(existingDiscount ? String(existingDiscount.value) : '')
  const [description, setDescription] = useState(existingDiscount?.description ?? '')

  const stableOnClose = useCallback(() => onClose(), [onClose])
  useClickOutside(popoverRef, stableOnClose)

  // Calculate fixed position for desktop portal popover
  const popoverPos = (() => {
    if (!anchorRect) return null
    const popoverWidth = 256 // w-64 = 16rem = 256px
    let left = anchorRect.right - popoverWidth
    if (left < 8) left = 8
    return { top: anchorRect.bottom + 4, left }
  })()

  const handleApply = () => {
    const numValue = parseFloat(value)
    if (!numValue || numValue <= 0) return
    if (type === 'percentage' && numValue > 100) return

    if (existingDiscount) removeDiscount(existingDiscount.id)
    addDiscount({
      id: crypto.randomUUID(),
      level: 'equipment_item',
      type,
      value: numValue,
      equipmentItemId: item.id,
      description: description || undefined,
    })
    onClose()
  }

  const handleRemove = () => {
    if (existingDiscount) removeDiscount(existingDiscount.id)
    onClose()
  }

  const content = (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-navy">
          {t('configurator.discountOnItem', { name: itemName })}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Type toggle */}
      <div className="flex overflow-hidden rounded-md border border-input">
        <button
          type="button"
          onClick={() => setType('percentage')}
          className={cn(
            'flex h-8 flex-1 items-center justify-center text-xs font-medium transition-colors',
            type === 'percentage'
              ? 'bg-primary text-white'
              : 'bg-background text-muted-foreground hover:bg-muted',
          )}
        >
          %
        </button>
        <button
          type="button"
          onClick={() => setType('fixed')}
          className={cn(
            'flex h-8 flex-1 items-center justify-center text-xs font-medium transition-colors',
            type === 'fixed'
              ? 'bg-primary text-white'
              : 'bg-background text-muted-foreground hover:bg-muted',
          )}
        >
          &euro;
        </button>
      </div>

      <input
        type="number"
        min="0"
        max={type === 'percentage' ? 100 : undefined}
        step="any"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={type === 'percentage' ? '10' : '5000'}
        className={ds.input.base}
      />

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('configurator.discountDescriptionPlaceholder')}
        className={ds.input.base}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApply}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.primary, 'flex-1')}
        >
          {t('configurator.apply')}
        </button>
        {existingDiscount ? (
          <button
            type="button"
            onClick={handleRemove}
            className={cn(ds.btn.base, ds.btn.md, 'border border-red-200 text-red-600 hover:bg-red-50')}
          >
            {t('configurator.removeDiscount')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className={cn(ds.btn.base, ds.btn.md, ds.btn.secondary)}
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose} />
        <div
          ref={popoverRef}
          className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up rounded-t-xl bg-card p-3 shadow-xl"
        >
          {content}
        </div>
      </div>

      {/* Desktop: portal popover (avoids overflow-hidden clipping) */}
      {popoverPos && createPortal(
        <div className="hidden lg:block">
          <div
            ref={popoverRef}
            style={{ top: popoverPos.top, left: popoverPos.left }}
            className="fixed z-50 w-64 animate-fade-in rounded-lg border border-border bg-card p-3 shadow-lg"
          >
            {content}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
