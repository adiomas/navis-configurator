import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus, Building2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompanies } from '@/hooks/useCompanies'
import { ClientCategoryBadge } from '@/components/clients/ClientCategoryBadge'
import type { CompanyWithContacts, ClientCategory } from '@/types'

interface ClientSelectorProps {
  onSelectCompany: (company: CompanyWithContacts) => void
  onAddNew: () => void
  selectedCompanyId?: string
  multiSelect?: boolean
  selectedCompanyIds?: string[]
  onToggleCompany?: (company: CompanyWithContacts) => void
}

export const ClientSelector = ({ onSelectCompany, onAddNew, selectedCompanyId, multiSelect, selectedCompanyIds, onToggleCompany }: ClientSelectorProps) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { data: companies, isLoading } = useCompanies()

  const MAX_VISIBLE = 8

  const filtered = useMemo(() => {
    if (!companies) return []
    if (!search.trim()) return companies
    const q = search.toLowerCase()
    return companies.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true
      if (c.email?.toLowerCase().includes(q)) return true
      return c.contacts.some(
        (ct) =>
          ct.full_name?.toLowerCase().includes(q) ||
          ct.email?.toLowerCase().includes(q)
      )
    })
  }, [companies, search])

  const displayed = filtered.slice(0, MAX_VISIBLE)
  const hasMore = filtered.length > MAX_VISIBLE

  return (
    <div className="space-y-2">
      {/* Search + Add button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('configurator.searchClient')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-navy-light"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('configurator.newClient')}</span>
        </button>
      </div>

      {/* Client cards */}
      {isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center">
          <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t('configurator.noClientsFound')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {displayed.map((company) => {
              const primaryContact = company.contacts.find((c) => c.is_primary) ?? company.contacts[0]
              const isSelected = multiSelect
                ? selectedCompanyIds?.includes(company.id) ?? false
                : company.id === selectedCompanyId

              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => multiSelect && onToggleCompany ? onToggleCompany(company) : onSelectCompany(company)}
                  className={cn(
                    'flex items-start gap-2.5 rounded-md border p-3 text-left transition-all duration-200',
                    isSelected
                      ? 'border-gold/60 bg-gold/5 ring-2 ring-gold/20 shadow-sm'
                      : 'border-border hover:shadow-sm hover:-translate-y-px',
                  )}
                >
                  {multiSelect ? (
                    <div className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-150',
                      isSelected
                        ? 'border-gold bg-gold text-white'
                        : 'border-muted-foreground/30'
                    )}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  ) : (
                    <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {company.name}
                      </span>
                      <ClientCategoryBadge category={company.client_category as ClientCategory} />
                    </div>
                    {primaryContact && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {primaryContact.full_name}
                        {primaryContact.email ? ` · ${primaryContact.email}` : ''}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {hasMore && (
            <p className="text-center text-[11px] text-muted-foreground">
              {t('configurator.showingNofTotal', { shown: String(MAX_VISIBLE), total: String(filtered.length) })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
