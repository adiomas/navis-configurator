import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Package, Tag } from 'lucide-react'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useDebounce } from '@/hooks/useDebounce'
import { useBoat } from '@/hooks/useBoats'
import { useTemplateGroup } from '@/hooks/useTemplateGroups'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { CompactEquipmentSelector } from '@/components/configurator/CompactEquipmentSelector'
import { CompactDiscountEditor } from '@/components/configurator/CompactDiscountEditor'
import type { EquipmentItem, DiscountLevel, DiscountType, PriceBreakdown } from '@/types'

interface EquipmentStepProps {
  priceBreakdown: PriceBreakdown
}

export default function EquipmentStep({ priceBreakdown }: EquipmentStepProps) {
  const { t } = useTranslation()
  const {
    selectedBoat,
    selectedEquipment,
    setSelectedEquipment,
    addDiscount,
    templateGroupId,
  } = useConfiguratorStore()

  const { data: boatDetails, isLoading, error: boatError, refetch: refetchBoat } = useBoat(selectedBoat?.id)
  const { data: templateGroup } = useTemplateGroup(templateGroupId ?? undefined)

  const templateAppliedRef = useRef(false)

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  // Auto-select standard items
  useEffect(() => {
    if (!boatDetails?.equipment_categories) return

    const standardItems: EquipmentItem[] = []
    for (const cat of boatDetails.equipment_categories) {
      for (const item of cat.items) {
        if (item.is_standard) standardItems.push(item)
      }
    }

    if (standardItems.length === 0) return

    const next = new Map(selectedEquipment)
    let changed = false
    for (const item of standardItems) {
      if (!next.has(item.id)) {
        next.set(item.id, item)
        changed = true
      }
    }
    if (changed) setSelectedEquipment(next)
  }, [boatDetails?.equipment_categories]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-configure from template group
  useEffect(() => {
    if (!templateGroup || !selectedBoat || !boatDetails?.equipment_categories || templateAppliedRef.current) return
    templateAppliedRef.current = true

    const templateEquipment = templateGroup.equipment.filter(
      (e) => e.boat_id === selectedBoat.id,
    )
    if (templateEquipment.length > 0) {
      const allItems = boatDetails.equipment_categories.flatMap((cat) => cat.items)
      const next = new Map(selectedEquipment)
      for (const te of templateEquipment) {
        const item = allItems.find((i) => i.id === te.equipment_item_id)
        if (item && !next.has(item.id)) next.set(item.id, item)
      }
      setSelectedEquipment(next)
    }

    for (const td of templateGroup.discounts) {
      addDiscount({
        id: crypto.randomUUID(),
        level: td.discount_level as DiscountLevel,
        type: td.discount_type as DiscountType,
        value: td.value,
        description: td.description ?? undefined,
      })
    }
  }, [templateGroup, selectedBoat, boatDetails?.equipment_categories]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (boatError) return <QueryErrorState onRetry={refetchBoat} />

  if (!boatDetails || !selectedBoat) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{t('configurator.selectBoatFirst')}</p>
      </div>
    )
  }

  const categories = boatDetails.equipment_categories ?? []

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('configurator.searchEquipment')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={cn(ds.input.base, 'pl-8')}
        />
      </div>

      {/* Equipment accordion */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{t('equipment.noEquipment')}</p>
        </div>
      ) : (
        <CompactEquipmentSelector
          categories={categories}
          searchQuery={debouncedSearch}
        />
      )}

      {/* Discount section */}
      {categories.length > 0 && (
        <div className="border-t border-border pt-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-gold" />
              <h3 className="text-xs font-semibold text-navy">
                {t('configurator.discounts')}
              </h3>
            </div>
            <CompactDiscountEditor
              boatBasePrice={boatDetails.base_price}
              equipmentSubtotal={priceBreakdown.equipmentSubtotal}
            />
          </div>
        </div>
      )}
    </div>
  )
}
