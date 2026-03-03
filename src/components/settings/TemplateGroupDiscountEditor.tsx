import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DiscountRow {
  discount_level: string
  discount_type: string
  value: number
  description: string
}

interface TemplateGroupDiscountEditorProps {
  value: DiscountRow[]
  onChange: (discounts: DiscountRow[]) => void
}

export function TemplateGroupDiscountEditor({ value, onChange }: TemplateGroupDiscountEditorProps) {
  const { t } = useTranslation()

  const addRow = () => {
    onChange([...value, { discount_level: 'boat_base', discount_type: 'percentage', value: 0, description: '' }])
  }

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof DiscountRow, fieldValue: string | number) => {
    onChange(
      value.map((row, i) =>
        i === index ? { ...row, [field]: fieldValue } : row
      )
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t('templateGroups.addDiscounts')}
      </p>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((row, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
              {/* Level dropdown */}
              <select
                value={row.discount_level}
                onChange={(e) => updateRow(index, 'discount_level', e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="boat_base">{t('templateGroups.boatBase')}</option>
                <option value="equipment_all">{t('templateGroups.equipmentAll')}</option>
              </select>

              {/* Type toggle */}
              <div className="flex overflow-hidden rounded-md border border-input">
                <button
                  type="button"
                  onClick={() => updateRow(index, 'discount_type', 'percentage')}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center text-sm font-medium transition-colors',
                    row.discount_type === 'percentage'
                      ? 'bg-primary text-white'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => updateRow(index, 'discount_type', 'fixed')}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center text-sm font-medium transition-colors',
                    row.discount_type === 'fixed'
                      ? 'bg-primary text-white'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  &euro;
                </button>
              </div>

              {/* Value input */}
              <input
                type="number"
                min="0"
                max={row.discount_type === 'percentage' ? 100 : undefined}
                step="any"
                value={row.value || ''}
                onChange={(e) => updateRow(index, 'value', parseFloat(e.target.value) || 0)}
                placeholder={row.discount_type === 'percentage' ? '10' : '5000'}
                className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />

              {/* Description */}
              <input
                type="text"
                value={row.description}
                onChange={(e) => updateRow(index, 'description', e.target.value)}
                placeholder={t('templateGroups.description')}
                className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-primary/40 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
      >
        <Plus className="h-3.5 w-3.5" />
        {t('templateGroups.addDiscount')}
      </button>
    </div>
  )
}
