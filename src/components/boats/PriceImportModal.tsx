import { useState, useCallback, useMemo, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, ChevronDown, ChevronRight, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice } from '@/lib/formatters'
import { useExtractPriceList, useSaveImportedBoat } from '@/hooks/usePriceImport'
import { useBoats } from '@/hooks/useBoats'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import type { ImportPayload, ImportedCategory, ImportedItem, ImportedSpec, ImportWarning } from '@/lib/price-import'

interface PriceImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (boatId: string) => void
}

type Step = 1 | 2 | 3

const STEPS: { step: Step; key: string }[] = [
  { step: 1, key: 'importStepUpload' },
  { step: 2, key: 'importStepPreview' },
  { step: 3, key: 'importStepSave' },
]

export const PriceImportModal = ({ open, onOpenChange, onSuccess }: PriceImportModalProps) => {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>(1)
  const [payload, setPayload] = useState<ImportPayload | null>(null)
  const [warnings, setWarnings] = useState<ImportWarning[]>([])

  const extract = useExtractPriceList()
  const save = useSaveImportedBoat()

  const handleClose = useCallback(() => {
    if (save.isPending) return
    setStep(1)
    setPayload(null)
    setWarnings([])
    extract.reset()
    save.reset()
    onOpenChange(false)
  }, [extract, save, onOpenChange])

  const handleExtracted = useCallback((result: { payload: ImportPayload; warnings: ImportWarning[] }) => {
    setPayload(result.payload)
    setWarnings(result.warnings)
    setStep(2)
  }, [])

  const handleSave = useCallback(async () => {
    if (!payload) return
    const result = await save.mutateAsync(payload)
    onSuccess(result.boatId)
    handleClose()
  }, [payload, save, onSuccess, handleClose])

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleClose}
      title={t('boats.importFromPriceList')}
      size="xl"
      footer={
        step === 2 ? (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(ds.btn.base, ds.btn.md, ds.btn.secondary)}
            >
              {t('common.back')}
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
            >
              {t('common.next')}
            </button>
          </>
        ) : step === 3 ? (
          <>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={cn(ds.btn.base, ds.btn.md, ds.btn.secondary)}
              disabled={save.isPending}
            >
              {t('common.back')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={save.isPending}
              className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
            >
              {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {save.isPending ? t('boats.importSaving') : t('boats.importConfirm')}
            </button>
          </>
        ) : null
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        {STEPS.map(({ step: s, key }) => (
          <div key={s} className="flex items-center gap-2">
            {s > 1 && <div className={cn('h-px w-6', s <= step ? 'bg-primary' : 'bg-border')} />}
            <div className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              s === step ? 'bg-primary text-white' :
              s < step ? 'bg-primary/10 text-primary' :
              'bg-muted text-muted-foreground'
            )}>
              {s < step ? <Check className="h-3 w-3" /> : <span>{s}</span>}
              <span>{t(`boats.${key}`)}</span>
            </div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <UploadStep
          onExtracted={handleExtracted}
          extract={extract}
        />
      )}

      {step === 2 && payload && (
        <PreviewStep
          payload={payload}
          warnings={warnings}
          onChange={setPayload}
        />
      )}

      {step === 3 && payload && (
        <ConfirmStep
          payload={payload}
          error={save.error?.message}
        />
      )}
    </ResponsiveModal>
  )
}

// --- Step 1: Upload ---

interface UploadStepProps {
  onExtracted: (result: { payload: ImportPayload; warnings: ImportWarning[] }) => void
  extract: ReturnType<typeof useExtractPriceList>
}

function UploadStep({ onExtracted, extract }: UploadStepProps) {
  const { t } = useTranslation()
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') return
    if (file.size > 50 * 1024 * 1024) return
    extract.mutate(file, { onSuccess: onExtracted })
  }, [extract, onExtracted])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  if (extract.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium text-navy">{t('boats.importUploading')}</p>
        <p className="text-xs text-muted-foreground mt-1">
          This may take 1-2 minutes
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        )}
        onClick={() => document.getElementById('pdf-upload')?.click()}
      >
        <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-navy">{t('boats.importDragDrop')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('boats.importMaxSize')}</p>
        <input
          id="pdf-upload"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {extract.isError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
          {extract.error.message}
        </div>
      )}
    </div>
  )
}

// --- Step 2: Preview ---

interface PreviewStepProps {
  payload: ImportPayload
  warnings: ImportWarning[]
  onChange: (payload: ImportPayload) => void
}

function PreviewStep({ payload, warnings, onChange }: PreviewStepProps) {
  const { t } = useTranslation()
  const { data: existingBoats } = useBoats()

  const isDuplicate = useMemo(() =>
    existingBoats?.some((b) => b.name.toLowerCase() === payload.boat.name.toLowerCase()),
    [existingBoats, payload.boat.name]
  )

  const totalItems = useMemo(() =>
    payload.categories.reduce((sum, cat) => sum + cat.items.length, 0),
    [payload.categories]
  )

  const totalEquipmentValue = useMemo(() =>
    payload.categories.reduce((sum, cat) =>
      sum + cat.items.reduce((s, item) => s + (item.is_standard ? 0 : item.price), 0), 0),
    [payload.categories]
  )

  const missingHrCount = warnings.filter((w) => w.type === 'missing_hr_translation').length

  const updateBoatField = useCallback((field: keyof ImportPayload['boat'], value: string | number) => {
    onChange({ ...payload, boat: { ...payload.boat, [field]: value } })
  }, [payload, onChange])

  const updateSpec = useCallback((idx: number, field: keyof ImportedSpec, value: string) => {
    const specs = [...payload.specs]
    specs[idx] = { ...specs[idx], [field]: value }
    onChange({ ...payload, specs })
  }, [payload, onChange])

  const updateCategory = useCallback((catIdx: number, field: keyof ImportedCategory, value: string) => {
    const categories = [...payload.categories]
    categories[catIdx] = { ...categories[catIdx], [field]: value }
    onChange({ ...payload, categories })
  }, [payload, onChange])

  const updateItem = useCallback((catIdx: number, itemIdx: number, field: keyof ImportedItem, value: string | number | boolean) => {
    const categories = [...payload.categories]
    const items = [...categories[catIdx].items]
    items[itemIdx] = { ...items[itemIdx], [field]: value }
    categories[catIdx] = { ...categories[catIdx], items }
    onChange({ ...payload, categories })
  }, [payload, onChange])

  return (
    <div className="space-y-4">
      {/* Warnings banner */}
      {missingHrCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {missingHrCount} {t('boats.importMissingHr')}
        </div>
      )}

      {isDuplicate && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {t('boats.importDuplicateWarning')}
        </div>
      )}

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className={cn(ds.badge.base, ds.badge.primary)}>
          {payload.categories.length} {t('boats.importCategories')}
        </span>
        <span className={cn(ds.badge.base, ds.badge.primary)}>
          {totalItems} {t('boats.importItems')}
        </span>
        <span className={cn(ds.badge.base, ds.badge.success)}>
          {t('boats.importTotal')}: {formatPrice(totalEquipmentValue)}
        </span>
      </div>

      {/* Boat info */}
      <section className={ds.card.padded}>
        <h3 className={cn(ds.card.title, ds.card.titleMargin)}>{t('boats.importBoatInfo')}</h3>
        <div className={ds.form.grid}>
          <EditableField label={t('boats.name')} value={payload.boat.name} onChange={(v) => updateBoatField('name', v)} />
          <EditableField label={t('boats.brand')} value={payload.boat.brand} onChange={(v) => updateBoatField('brand', v)} />
          <EditableField label={t('boats.model')} value={payload.boat.model} onChange={(v) => updateBoatField('model', v)} />
          <EditableField label={t('boats.year')} value={String(payload.boat.year)} onChange={(v) => updateBoatField('year', parseInt(v) || 0)} type="number" />
          <EditableField label={t('boats.basePrice')} value={String(payload.boat.base_price)} onChange={(v) => updateBoatField('base_price', parseFloat(v) || 0)} type="number" display={formatPrice(payload.boat.base_price)} />
        </div>
      </section>

      {/* Specs */}
      {payload.specs.length > 0 && (
        <section className={ds.card.padded}>
          <h3 className={cn(ds.card.title, ds.card.titleMargin)}>{t('boats.importSpecs')}</h3>
          <div className="space-y-1.5">
            {payload.specs.map((spec, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 text-xs">
                <input
                  value={spec.label_en}
                  onChange={(e) => updateSpec(idx, 'label_en', e.target.value)}
                  className={cn(ds.input.base, 'text-xs')}
                />
                <input
                  value={spec.label_hr}
                  onChange={(e) => updateSpec(idx, 'label_hr', e.target.value)}
                  className={cn(ds.input.base, 'text-xs', !spec.label_hr && 'border-amber-300')}
                />
                <input
                  value={spec.value}
                  onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                  className={cn(ds.input.base, 'text-xs')}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Equipment categories */}
      <section>
        <h3 className={cn(ds.card.title, 'mb-2')}>{t('boats.importEquipment')}</h3>
        <div className="space-y-2">
          {payload.categories.map((cat, catIdx) => (
            <CategoryAccordion
              key={catIdx}
              category={cat}
              catIdx={catIdx}
              warnings={warnings}
              onUpdateCategory={updateCategory}
              onUpdateItem={updateItem}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

// --- Category Accordion ---

interface CategoryAccordionProps {
  category: ImportedCategory
  catIdx: number
  warnings: ImportWarning[]
  onUpdateCategory: (catIdx: number, field: keyof ImportedCategory, value: string) => void
  onUpdateItem: (catIdx: number, itemIdx: number, field: keyof ImportedItem, value: string | number | boolean) => void
}

function CategoryAccordion({ category, catIdx, warnings, onUpdateCategory, onUpdateItem }: CategoryAccordionProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const catWarnings = warnings.filter((w) => w.category === category.name_en)
  const optionalTotal = category.items.reduce((s, item) => s + (item.is_standard ? 0 : item.price), 0)

  return (
    <div className={ds.card.base}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span className="text-xs font-semibold text-navy">{category.name_en}</span>
          {!category.name_hr && (
            <span className={cn(ds.badge.base, ds.badge.warning, 'text-[10px]')}>HR</span>
          )}
          {catWarnings.length > 0 && (
            <span className={cn(ds.badge.base, ds.badge.warning, 'text-[10px]')}>
              {catWarnings.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{category.items.length} {t('boats.importItems')}</span>
          {optionalTotal > 0 && <span>{formatPrice(optionalTotal)}</span>}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-3 pb-3">
          {/* Category name edit */}
          <div className="grid grid-cols-2 gap-2 py-2">
            <div>
              <label className={ds.input.label}>EN</label>
              <input
                value={category.name_en}
                onChange={(e) => onUpdateCategory(catIdx, 'name_en', e.target.value)}
                className={cn(ds.input.base, 'text-xs')}
              />
            </div>
            <div>
              <label className={ds.input.label}>HR</label>
              <input
                value={category.name_hr ?? ''}
                onChange={(e) => onUpdateCategory(catIdx, 'name_hr', e.target.value)}
                className={cn(ds.input.base, 'text-xs', !category.name_hr && 'border-amber-300')}
              />
            </div>
          </div>

          {/* Items table */}
          <div className={ds.table.wrapper}>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className={cn(ds.table.headerCell, 'text-left')}>EN</th>
                  <th className={cn(ds.table.headerCell, 'text-left')}>HR</th>
                  <th className={cn(ds.table.headerCell, 'text-right w-24')}>{t('equipment.price')}</th>
                  <th className={cn(ds.table.headerCell, 'text-center w-16')}>Code</th>
                  <th className={cn(ds.table.headerCell, 'text-center w-12')}>Std</th>
                </tr>
              </thead>
              <tbody>
                {category.items.map((item, itemIdx) => {
                  const hasWarning = !item.name_hr
                  return (
                    <tr key={itemIdx} className={ds.table.row}>
                      <td className={ds.table.cell}>
                        <input
                          value={item.name_en}
                          onChange={(e) => onUpdateItem(catIdx, itemIdx, 'name_en', e.target.value)}
                          className={cn(ds.input.base, 'text-xs h-7')}
                        />
                      </td>
                      <td className={ds.table.cell}>
                        <input
                          value={item.name_hr ?? ''}
                          onChange={(e) => onUpdateItem(catIdx, itemIdx, 'name_hr', e.target.value)}
                          className={cn(ds.input.base, 'text-xs h-7', hasWarning && 'border-amber-300')}
                        />
                      </td>
                      <td className={cn(ds.table.cell, 'text-right')}>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => onUpdateItem(catIdx, itemIdx, 'price', parseFloat(e.target.value) || 0)}
                          className={cn(ds.input.base, 'text-xs h-7 text-right w-24',
                            item.price === 0 && !item.is_standard && 'border-red-300'
                          )}
                        />
                      </td>
                      <td className={cn(ds.table.cell, 'text-center')}>
                        <span className="text-[10px] text-muted-foreground">{item.manufacturer_code || '-'}</span>
                      </td>
                      <td className={cn(ds.table.cell, 'text-center')}>
                        <input
                          type="checkbox"
                          checked={item.is_standard}
                          onChange={(e) => onUpdateItem(catIdx, itemIdx, 'is_standard', e.target.checked)}
                          className={ds.input.checkbox}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Step 3: Confirm ---

interface ConfirmStepProps {
  payload: ImportPayload
  error?: string
}

function ConfirmStep({ payload, error }: ConfirmStepProps) {
  const { t } = useTranslation()

  const totalItems = payload.categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const totalEquipmentValue = payload.categories.reduce((sum, cat) =>
    sum + cat.items.reduce((s, item) => s + (item.is_standard ? 0 : item.price), 0), 0)

  return (
    <div className="space-y-4">
      <div className={ds.card.padded}>
        <h3 className={cn(ds.card.title, ds.card.titleMargin)}>{t('boats.importBoatInfo')}</h3>
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <span className="text-muted-foreground">{t('boats.name')}</span>
          <span className="font-medium text-navy">{payload.boat.name}</span>
          <span className="text-muted-foreground">{t('boats.brand')}</span>
          <span>{payload.boat.brand}</span>
          <span className="text-muted-foreground">{t('boats.model')}</span>
          <span>{payload.boat.model}</span>
          <span className="text-muted-foreground">{t('boats.year')}</span>
          <span>{payload.boat.year}</span>
          <span className="text-muted-foreground">{t('boats.basePrice')}</span>
          <span className="font-medium">{formatPrice(payload.boat.base_price)}</span>
        </div>
      </div>

      <div className={ds.card.padded}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className={ds.text.value}>{payload.specs.length}</p>
            <p className={ds.text.muted}>{t('boats.importSpecs')}</p>
          </div>
          <div>
            <p className={ds.text.value}>{payload.categories.length}</p>
            <p className={ds.text.muted}>{t('boats.importCategories')}</p>
          </div>
          <div>
            <p className={ds.text.value}>{totalItems}</p>
            <p className={ds.text.muted}>{t('boats.importItems')}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border text-center">
          <p className={ds.text.muted}>{t('boats.importTotal')}</p>
          <p className="text-lg font-semibold text-primary">{formatPrice(totalEquipmentValue)}</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className={ds.card.padded}>
        <h3 className={cn(ds.card.title, ds.card.titleMargin)}>{t('boats.importEquipment')}</h3>
        <div className="space-y-1.5">
          {payload.categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span>{cat.name_en}</span>
              </div>
              <span className="text-muted-foreground">{cat.items.length} {t('boats.importItems')}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
          {error}
        </div>
      )}
    </div>
  )
}

// --- Editable Field ---

interface EditableFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number'
  display?: string
}

function EditableField({ label, value, onChange, type = 'text', display }: EditableFieldProps) {
  const [editing, setEditing] = useState(false)

  return (
    <div className={ds.input.group}>
      <label className={ds.input.label}>{label}</label>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          autoFocus
          className={cn(ds.input.base, 'text-xs')}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="flex h-8 items-center rounded-md border border-transparent px-2.5 text-xs cursor-pointer hover:border-border hover:bg-muted/50"
        >
          {display ?? value}
        </div>
      )}
    </div>
  )
}
