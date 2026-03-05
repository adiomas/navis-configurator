import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Check, X, CalendarDays } from 'lucide-react'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice } from '@/lib/formatters'
import { useDebounce } from '@/hooks/useDebounce'
import { useBoats, useBoat } from '@/hooks/useBoats'
import { useActiveTemplateGroupIds } from '@/hooks/useTemplateGroups'
import { useConfiguratorStore } from '@/stores/configurator-store'
import type { Boat, BoatCategory } from '@/types'

export default function BoatStep() {
  const { t, i18n } = useTranslation()
  const { selectedBoat, setBoat, setStep, templateGroupId, setTemplateGroupId } = useConfiguratorStore()

  const { data: boats, isLoading, error: boatsError, refetch: refetchBoats } = useBoats()
  const { data: boatDetails } = useBoat(selectedBoat?.id)
  const { data: activeGroups } = useActiveTemplateGroupIds()

  const selectedTemplate = activeGroups?.find((g) => g.id === templateGroupId)
  const templateBoatIds = useMemo(
    () => selectedTemplate
      ? new Set(selectedTemplate.boats.map((b) => b.boat_id))
      : null,
    [selectedTemplate],
  )

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [categoryFilter, setCategoryFilter] = useState<BoatCategory | 'all'>('all')

  const lang = i18n.language as 'hr' | 'en'

  const filteredBoats = useMemo(() => {
    if (!boats) return []
    let result = [...boats]

    if (templateBoatIds) {
      result = result.filter((b) => templateBoatIds.has(b.id))
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((b) => b.name.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter)
    }

    return result.sort((a, b) => b.base_price - a.base_price)
  }, [boats, debouncedSearch, categoryFilter, templateBoatIds])

  const categoryTabs: { value: BoatCategory | 'all'; label: string }[] = [
    { value: 'all', label: t('common.all') },
    { value: 'new', label: t('boats.new') },
    { value: 'used', label: t('boats.used') },
  ]

  const handleSelectBoat = (boat: Boat) => {
    setBoat(selectedBoat?.id === boat.id ? null : boat)
  }

  const specs = boatDetails?.specs?.slice(0, 3) ?? []

  return (
    <div className="space-y-3">
      {/* Template selector */}
      {activeGroups && activeGroups.length > 0 && (
        <div>
          {templateGroupId && selectedTemplate ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {selectedTemplate.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                ({selectedTemplate.boats.length} {t('templateGroups.boats').toLowerCase()})
              </span>
              <button
                type="button"
                onClick={() => {
                  setTemplateGroupId(null)
                  setBoat(null)
                }}
                className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setTemplateGroupId(e.target.value)
                  setBoat(null)
                }
              }}
              className={cn(ds.input.select, 'sm:w-auto')}
            >
              <option value="">{t('templateGroups.startFromTemplate')}</option>
              {activeGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.valid_from} → {group.valid_until})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={cn(ds.input.base, 'pl-8')}
          />
        </div>
        <div className="-mx-1 flex overflow-x-auto px-1 sm:mx-0 sm:px-0">
          <div className="flex rounded-lg border border-border">
            {categoryTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setCategoryFilter(tab.value)}
                className={cn(
                  'whitespace-nowrap px-2.5 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg',
                  categoryFilter === tab.value
                    ? 'bg-navy text-white'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Boat grid — responsive cards */}
      {isLoading ? (
        <SkeletonGrid />
      ) : boatsError ? (
        <QueryErrorState onRetry={refetchBoats} />
      ) : filteredBoats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Search className="mb-2 h-6 w-6 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">{t('boats.noBoats')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-2">
          {filteredBoats.map((boat) => {
            const isSelected = selectedBoat?.id === boat.id
            return (
              <div key={boat.id}>
                <button
                  type="button"
                  onClick={() => handleSelectBoat(boat)}
                  className={cn(
                    'group flex w-full overflow-hidden rounded-lg border bg-card text-left transition-all duration-200',
                    'flex-col p-0 lg:flex-row lg:items-center lg:gap-3 lg:p-2',
                    isSelected
                      ? 'border-gold/60 ring-2 ring-gold/20 shadow-sm'
                      : 'border-border hover:shadow-lg hover:-translate-y-0.5',
                  )}
                >
                  {/* Image */}
                  <div className={cn(
                    'relative shrink-0 overflow-hidden',
                    // Mobile: compact 16:10 image | Desktop: fixed thumbnail
                    'aspect-[16/10] w-full lg:aspect-auto lg:h-20 lg:w-28 lg:rounded-md',
                  )}>
                    {boat.hero_image_url ? (
                      <>
                        <img
                          src={boat.hero_image_url}
                          alt={boat.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/20 to-transparent" />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-[10px] text-muted-foreground">No image</span>
                      </div>
                    )}
                    {/* Category badge */}
                    <span
                      className={cn(
                        'absolute right-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        boat.category === 'new'
                          ? 'bg-success/90 text-white'
                          : 'bg-warning/90 text-white',
                      )}
                    >
                      {t(`boats.${boat.category}`)}
                    </span>
                    {/* Selection overlay on mobile */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/10 lg:hidden" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1 p-2 lg:p-0">
                    <p className="truncate text-xs font-medium text-foreground lg:text-sm">{boat.name}</p>
                    <p className="text-[11px] text-muted-foreground lg:text-xs">
                      {boat.brand} &middot; {boat.year}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-gold lg:mt-1">
                      {formatPrice(boat.base_price)}
                    </p>
                  </div>

                  {/* Selection indicator (desktop only) */}
                  {isSelected && (
                    <div className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary lg:flex">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </button>

                {/* Inline mini preview (selected boat only) */}
                {isSelected && specs.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gold/20 border-l-2 border-l-gold bg-gold/5 px-3 py-2 text-xs">
                    {specs.map((spec) => (
                      <span key={spec.id} className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {lang === 'hr' ? spec.label_hr : spec.label_en}:
                        </span>{' '}
                        {spec.value}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className={cn(ds.btn.base, ds.btn.sm, ds.btn.primary, 'ml-auto')}
                    >
                      {t('configurator.configureThis')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-border/60">
          <div className="aspect-[16/10] w-full bg-muted/80 lg:hidden" />
          <div className="hidden items-center gap-3 p-2 lg:flex">
            <div className="h-20 w-28 shrink-0 rounded-lg bg-muted/80" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 w-3/4 rounded-md bg-muted/80" />
              <div className="h-3 w-1/2 rounded-md bg-muted/60" />
              <div className="h-3.5 w-1/3 rounded-md bg-gold/10" />
            </div>
          </div>
          <div className="space-y-2 p-2 lg:hidden">
            <div className="h-3 w-3/4 rounded-md bg-muted/80" />
            <div className="h-2.5 w-1/2 rounded-md bg-muted/60" />
            <div className="h-3 w-1/3 rounded-md bg-gold/10" />
          </div>
        </div>
      ))}
    </div>
  )
}
