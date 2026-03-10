import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice } from '@/lib/formatters'
import { useConfiguratorStore } from '@/stores/configurator-store'
import type { DiscountLevel, DiscountType } from '@/types'

interface CompactDiscountEditorProps {
  boatBasePrice: number
  equipmentSubtotal: number
  discountableEquipmentSubtotal?: number
}

interface DiscountRow {
  id: string
  type: DiscountType
  value: string
  description: string
}

export function CompactDiscountEditor({ boatBasePrice, equipmentSubtotal, discountableEquipmentSubtotal }: CompactDiscountEditorProps) {
  const { t } = useTranslation()
  const { discounts, addDiscount, removeDiscount } = useConfiguratorStore()

  const boatDiscounts = discounts.filter((d) => d.level === 'boat_base')
  const equipmentDiscounts = discounts.filter((d) => d.level === 'equipment_all')

  return (
    <div className="space-y-1.5">
      <DiscountSection
        title={t('configurator.boatDiscount')}
        hint={t('configurator.boatDiscountHint')}
        level="boat_base"
        baseAmount={boatBasePrice}
        activeDiscounts={boatDiscounts}
        addDiscount={addDiscount}
        removeDiscount={removeDiscount}
        t={t}
      />
      <DiscountSection
        title={t('configurator.equipmentWideDiscount')}
        hint={t('configurator.equipmentDiscountNote')}
        level="equipment_all"
        baseAmount={discountableEquipmentSubtotal ?? equipmentSubtotal}
        activeDiscounts={equipmentDiscounts}
        addDiscount={addDiscount}
        removeDiscount={removeDiscount}
        t={t}
      />
    </div>
  )
}

interface DiscountSectionProps {
  title: string
  hint: string
  level: DiscountLevel
  baseAmount: number
  activeDiscounts: { id: string; type: DiscountType; value: number; description?: string }[]
  addDiscount: (d: { id: string; level: DiscountLevel; type: DiscountType; value: number; description?: string }) => void
  removeDiscount: (id: string) => void
  t: (key: string) => string
}

function DiscountSection({
  title,
  hint,
  level,
  baseAmount,
  activeDiscounts,
  addDiscount,
  removeDiscount,
  t,
}: DiscountSectionProps) {
  const hasDiscounts = activeDiscounts.length > 0
  const [isExpanded, setIsExpanded] = useState(hasDiscounts)
  const [rows, setRows] = useState<DiscountRow[]>(() =>
    activeDiscounts.map((d) => ({
      id: d.id,
      type: d.type,
      value: String(d.value),
      description: d.description ?? '',
    })),
  )

  const addRow = () => {
    const id = crypto.randomUUID()
    setRows((prev) => [...prev, { id, type: 'percentage', value: '', description: '' }])
    setIsExpanded(true)
  }

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId))
    removeDiscount(rowId)
  }

  const updateRow = (rowId: string, field: keyof DiscountRow, fieldValue: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: fieldValue } : r)),
    )
  }

  const commitRow = (row: DiscountRow) => {
    const numValue = parseFloat(row.value)
    if (!numValue || numValue <= 0) return
    if (row.type === 'percentage' && numValue > 100) return

    removeDiscount(row.id)
    addDiscount({
      id: row.id,
      level,
      type: row.type,
      value: numValue,
      description: row.description || undefined,
    })
  }

  const calculatePreview = (row: DiscountRow): string => {
    const numValue = parseFloat(row.value)
    if (!numValue || numValue <= 0) return ''
    if (row.type === 'percentage') {
      return `= ${formatPrice(baseAmount * (numValue / 100))}`
    }
    return `= ${formatPrice(numValue)}`
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex h-9 w-full items-center justify-between px-3 transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-navy">{title}</span>
          {activeDiscounts.length > 0 && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
              {activeDiscounts.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border p-3">
          <p className="mb-2 text-[11px] text-muted-foreground">{hint}</p>

          {rows.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[auto_5rem_1fr_auto] items-center gap-1.5">
                  {/* Type toggle */}
                  <div className="flex overflow-hidden rounded-md border border-input">
                    <button
                      type="button"
                      onClick={() => {
                        updateRow(row.id, 'type', 'percentage')
                        commitRow({ ...row, type: 'percentage' })
                      }}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center text-xs font-medium transition-all duration-150',
                        row.type === 'percentage'
                          ? 'bg-primary text-white'
                          : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateRow(row.id, 'type', 'fixed')
                        commitRow({ ...row, type: 'fixed' })
                      }}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center text-xs font-medium transition-all duration-150',
                        row.type === 'fixed'
                          ? 'bg-primary text-white'
                          : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      &euro;
                    </button>
                  </div>

                  {/* Value input */}
                  <input
                    type="number"
                    min="0"
                    max={row.type === 'percentage' ? 100 : undefined}
                    step="any"
                    value={row.value}
                    onChange={(e) => updateRow(row.id, 'value', e.target.value)}
                    onBlur={() => commitRow(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRow(row)
                    }}
                    placeholder={row.type === 'percentage' ? '10' : '5000'}
                    className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />

                  {/* Description */}
                  <div className="flex min-w-0 items-center gap-1.5">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                      onBlur={() => commitRow(row)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRow(row)
                      }}
                      placeholder={t('configurator.discountDescriptionPlaceholder')}
                      className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    {/* Preview */}
                    {calculatePreview(row) && (
                      <span className="shrink-0 text-[11px] font-bold text-red-500">
                        {calculatePreview(row)}
                      </span>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addRow}
            className={cn(ds.btn.base, ds.btn.sm, 'border border-dashed border-primary/40 text-primary transition-all duration-150 hover:border-primary hover:bg-primary/5')}
          >
            <Plus className="h-3 w-3" />
            {t('configurator.addDiscount')}
          </button>
        </div>
      )}
    </div>
  )
}
