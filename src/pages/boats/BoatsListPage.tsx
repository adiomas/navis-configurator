import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, ArrowUpDown, FileUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useBoats } from '@/hooks/useBoats'
import { useAuth } from '@/hooks/useAuth'
import { useQueryParam } from '@/hooks/useQueryParams'
import { BoatGrid } from '@/components/boats/BoatGrid'
import { BoatDetailPanel } from '@/components/boats/BoatDetailPanel'
import { PriceImportModal } from '@/components/boats/PriceImportModal'
import type { BoatCategory } from '@/types'

type SortOption = 'price_desc' | 'price_asc' | 'name' | 'year'

export default function BoatsListPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { data: boats, isLoading } = useBoats()

  const [search, setSearch] = useQueryParam('search')
  const [categoryParam, setCategoryParam] = useQueryParam('category', 'all')
  const [sortParam, setSortParam] = useQueryParam('sort', 'price_desc')
  const [boatParam, setBoatParam] = useQueryParam('boat')

  const categoryFilter = categoryParam as BoatCategory | 'all'
  const sort = sortParam as SortOption

  const [searchInput, setSearchInput] = useState(search)
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'create'>('view')
  const [importModalOpen, setImportModalOpen] = useState(false)

  const selectedBoatId = boatParam || null
  const isPanelOpen = !!selectedBoatId || panelMode === 'create'

  // Debounce search input 300ms → URL param
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput, setSearch])

  // Client-side filter + sort (small dataset)
  const filteredBoats = useMemo(() => {
    if (!boats) return []

    let result = [...boats]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((b) => b.name.toLowerCase().includes(q))
    }

    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter)
    }

    switch (sort) {
      case 'price_asc':
        result.sort((a, b) => a.base_price - b.base_price)
        break
      case 'price_desc':
        result.sort((a, b) => b.base_price - a.base_price)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'year':
        result.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
        break
    }

    return result
  }, [boats, search, categoryFilter, sort])

  const handleSelectBoat = useCallback((id: string) => {
    setBoatParam(id)
    setPanelMode('view')
  }, [setBoatParam])

  const handleClosePanel = useCallback(() => {
    setBoatParam('')
    setPanelMode('view')
  }, [setBoatParam])

  const handleAddBoat = useCallback(() => {
    setBoatParam('')
    setPanelMode('create')
  }, [setBoatParam])

  const handleBoatCreated = useCallback((id: string) => {
    setBoatParam(id)
    setPanelMode('view')
  }, [setBoatParam])

  const handleImportSuccess = useCallback((boatId: string) => {
    setBoatParam(boatId)
    setPanelMode('view')
  }, [setBoatParam])

  const categoryTabs: { value: BoatCategory | 'all'; label: string }[] = [
    { value: 'all', label: t('common.all') },
    { value: 'new', label: t('boats.new') },
    { value: 'used', label: t('boats.used') },
  ]

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'price_desc', label: `${t('boats.sortByPrice')} ${t('boats.sortDesc')}` },
    { value: 'price_asc', label: `${t('boats.sortByPrice')} ${t('boats.sortAsc')}` },
    { value: 'name', label: t('boats.sortByName') },
    { value: 'year', label: t('boats.sortByYear') },
  ]

  return (
    <div className={ds.page.spacing}>
      {/* Header */}
      <div className={ds.page.header}>
        <h1 className={ds.page.title}>
          {t('boats.title')}
        </h1>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className={cn(ds.btn.base, ds.btn.md, ds.btn.secondary)}
            >
              <FileUp className="h-4 w-4" />
              {t('boats.importFromPriceList')}
            </button>
            <button
              type="button"
              onClick={handleAddBoat}
              className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
            >
              <Plus className="h-4 w-4" />
              {t('boats.addBoat')}
            </button>
          </div>
        )}
      </div>

      {/* Filters bar — compact */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="-mx-1 flex overflow-x-auto px-1 sm:mx-0 sm:px-0">
            <div className="flex rounded-lg border border-border">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setCategoryParam(tab.value)}
                  className={cn(
                    'whitespace-nowrap px-2.5 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg',
                    categoryFilter === tab.value
                      ? 'bg-navy text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSortParam(e.target.value)}
              className="h-8 appearance-none rounded-lg border border-input bg-background pl-8 pr-6 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main content: catalog + side panel */}
      <div className="flex gap-4">
        {/* Catalog */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <SkeletonGrid isPanelOpen={isPanelOpen} />
          ) : filteredBoats.length === 0 ? (
            <EmptyState message={t('boats.noBoats')} />
          ) : (
            <BoatGrid
              boats={filteredBoats}
              selectedBoatId={selectedBoatId}
              onSelectBoat={handleSelectBoat}
              isPanelOpen={isPanelOpen}
            />
          )}
        </div>

        {/* Side panel — desktop */}
        {isPanelOpen && (
          <div className="hidden w-[480px] shrink-0 lg:block">
            <div className="sticky top-0 h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-border bg-white">
              <BoatDetailPanel
                key={selectedBoatId ?? 'create'}
                boatId={selectedBoatId}
                mode={panelMode}
                onClose={handleClosePanel}
                onModeChange={setPanelMode}
                onBoatCreated={handleBoatCreated}
              />
            </div>
          </div>
        )}
      </div>

      {/* Side panel — mobile overlay */}
      {isPanelOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClosePanel}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl">
            <BoatDetailPanel
              key={`mobile-${selectedBoatId ?? 'create'}`}
              boatId={selectedBoatId}
              mode={panelMode}
              onClose={handleClosePanel}
              onModeChange={setPanelMode}
              onBoatCreated={handleBoatCreated}
            />
          </div>
        </div>
      )}

      {/* Price Import Modal */}
      <PriceImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}

function SkeletonGrid({ isPanelOpen }: { isPanelOpen: boolean }) {
  return (
    <div className={cn(
      'grid gap-4',
      isPanelOpen
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    )}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn('animate-pulse overflow-hidden', ds.card.base)}>
          <div className="h-[140px] bg-muted" />
          <div className="space-y-2 p-3">
            <div className={cn(ds.skeleton.line, 'w-3/4')} />
            <div className={cn(ds.skeleton.line, 'w-1/2')} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={ds.empty.container}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <Search className={ds.empty.icon} />
      </div>
      <p className={ds.empty.title}>{message}</p>
    </div>
  )
}
