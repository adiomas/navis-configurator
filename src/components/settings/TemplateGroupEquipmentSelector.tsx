import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import { useBoat } from '@/hooks/useBoats'
import type { EquipmentItem } from '@/types'

interface EquipmentSelection {
  boat_id: string
  equipment_item_id: string
  special_price: number | null
}

interface TemplateGroupEquipmentSelectorProps {
  boatIds: string[]
  value: EquipmentSelection[]
  onChange: (equipment: EquipmentSelection[]) => void
}

export function TemplateGroupEquipmentSelector({
  boatIds,
  value,
  onChange,
}: TemplateGroupEquipmentSelectorProps) {
  const { t } = useTranslation()

  if (boatIds.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('templateGroups.noBoatsSelected')}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('templateGroups.selectEquipment')}
      </p>
      {boatIds.map((boatId) => (
        <BoatEquipmentSection
          key={boatId}
          boatId={boatId}
          value={value.filter((e) => e.boat_id === boatId)}
          onChange={(boatEquipment) => {
            const otherBoatEquipment = value.filter((e) => e.boat_id !== boatId)
            onChange([...otherBoatEquipment, ...boatEquipment])
          }}
        />
      ))}
    </div>
  )
}

interface BoatEquipmentSectionProps {
  boatId: string
  value: EquipmentSelection[]
  onChange: (equipment: EquipmentSelection[]) => void
}

function BoatEquipmentSection({ boatId, value, onChange }: BoatEquipmentSectionProps) {
  const { i18n } = useTranslation()
  const { t } = useTranslation()
  const { data: boatDetails, isLoading } = useBoat(boatId)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const lang = i18n.language as 'hr' | 'en'

  const selectedItemIds = new Set(value.map((e) => e.equipment_item_id))

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

  const toggleItem = (item: EquipmentItem) => {
    if (item.is_standard) return
    if (selectedItemIds.has(item.id)) {
      onChange(value.filter((e) => e.equipment_item_id !== item.id))
    } else {
      onChange([...value, { boat_id: boatId, equipment_item_id: item.id, special_price: null }])
    }
  }

  const updateSpecialPrice = (itemId: string, price: string) => {
    const numPrice = price ? parseFloat(price) : null
    onChange(
      value.map((e) =>
        e.equipment_item_id === itemId ? { ...e, special_price: numPrice } : e
      )
    )
  }

  if (isLoading) {
    return <div className="h-12 animate-pulse rounded-xl bg-muted" />
  }

  if (!boatDetails) return null

  const categories = boatDetails.equipment_categories ?? []

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="bg-muted/50 px-4 py-2.5">
        <span className="text-sm font-semibold text-navy">{boatDetails.name}</span>
      </div>
      <div className="divide-y divide-border">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id)
          const catName = (lang === 'hr' ? category.name_hr : category.name_en) ?? category.name_hr ?? ''
          const selectedCount = category.items.filter(
            (item) => selectedItemIds.has(item.id) || item.is_standard
          ).length

          return (
            <div key={category.id}>
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="flex h-10 w-full items-center justify-between px-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{catName}</span>
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    {selectedCount}/{category.items.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-border bg-background">
                  {category.items.map((item) => {
                    const isSelected = selectedItemIds.has(item.id) || item.is_standard
                    const isStandard = item.is_standard
                    const itemName = (lang === 'hr' ? item.name_hr : item.name_en) ?? item.name_hr ?? ''
                    const selection = value.find((e) => e.equipment_item_id === item.id)

                    return (
                      <div key={item.id}>
                        <button
                          type="button"
                          onClick={() => toggleItem(item)}
                          disabled={isStandard}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            isStandard
                              ? 'cursor-default bg-muted/20'
                              : isSelected
                                ? 'bg-primary/5 hover:bg-primary/10'
                                : 'hover:bg-muted/30'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-input bg-background'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="min-w-0 flex-1 text-sm text-foreground">{itemName}</span>
                          <div className="flex shrink-0 items-center gap-2">
                            {isStandard && (
                              <span className="rounded bg-success/10 px-1.5 py-0.5 text-xs text-success">
                                {t('configurator.standardIncluded')}
                              </span>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        </button>

                        {isSelected && !isStandard && (
                          <div className="flex items-center gap-3 border-t border-border/50 bg-muted/20 px-4 py-1.5 pl-11">
                            <label className="text-xs text-muted-foreground">
                              {t('templateGroups.specialPrice')}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={selection?.special_price ?? ''}
                              onChange={(e) => updateSpecialPrice(item.id, e.target.value)}
                              placeholder={formatPrice(item.price)}
                              className="h-7 w-32 rounded border border-input bg-background px-2 text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
