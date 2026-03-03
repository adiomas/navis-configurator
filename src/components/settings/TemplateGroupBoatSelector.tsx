import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import { useBoats } from '@/hooks/useBoats'

interface BoatSelection {
  boat_id: string
  special_price: number | null
}

interface TemplateGroupBoatSelectorProps {
  value: BoatSelection[]
  onChange: (boats: BoatSelection[]) => void
}

export function TemplateGroupBoatSelector({ value, onChange }: TemplateGroupBoatSelectorProps) {
  const { t } = useTranslation()
  const { data: boats, isLoading } = useBoats()

  const selectedIds = new Set(value.map((b) => b.boat_id))

  const toggleBoat = (boatId: string) => {
    if (selectedIds.has(boatId)) {
      onChange(value.filter((b) => b.boat_id !== boatId))
    } else {
      onChange([...value, { boat_id: boatId, special_price: null }])
    }
  }

  const updateSpecialPrice = (boatId: string, price: string) => {
    const numPrice = price ? parseFloat(price) : null
    onChange(
      value.map((b) =>
        b.boat_id === boatId ? { ...b, special_price: numPrice } : b
      )
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (!boats?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('boats.noBoats')}
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <p className="mb-3 text-sm text-muted-foreground">
        {t('templateGroups.selectBoats')}
      </p>
      {boats.map((boat) => {
        const isSelected = selectedIds.has(boat.id)
        const selection = value.find((b) => b.boat_id === boat.id)

        return (
          <div key={boat.id} className="overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => toggleBoat(boat.id)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
              )}
            >
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-input bg-background'
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-foreground">{boat.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {boat.brand} &middot; {boat.year}
                </span>
              </div>
              <span className="shrink-0 text-sm font-medium text-foreground">
                {formatPrice(boat.base_price)}
              </span>
            </button>

            {isSelected && (
              <div className="flex items-center gap-3 border-t border-border bg-muted/30 px-4 py-2">
                <label className="text-xs text-muted-foreground">
                  {t('templateGroups.specialPrice')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={selection?.special_price ?? ''}
                  onChange={(e) => updateSpecialPrice(boat.id, e.target.value)}
                  placeholder={formatPrice(boat.base_price)}
                  className="h-8 w-40 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
