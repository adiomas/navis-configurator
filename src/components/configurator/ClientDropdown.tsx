import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus, Building2 } from 'lucide-react'
import { useCompaniesSearch } from '@/hooks/useCompanies'
import { cn } from '@/lib/utils'
import type { CompanyWithContacts } from '@/types'

interface ClientDropdownProps {
  onSelectCompany: (company: CompanyWithContacts) => void
  onSelectNew: () => void
}

export function ClientDropdown({ onSelectCompany, onSelectNew }: ClientDropdownProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(input), 300)
    return () => clearTimeout(timer)
  }, [input])

  const { data: companies, isLoading } = useCompaniesSearch(debouncedQuery)

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleSelect = (company: CompanyWithContacts) => {
    onSelectCompany(company)
    setInput(company.name)
    setIsOpen(false)
  }

  const handleNewClient = () => {
    onSelectNew()
    setInput('')
    setIsOpen(false)
  }

  const categoryColors: Record<string, string> = {
    vip: 'bg-amber-100 text-amber-800',
    regular: 'bg-sky-100 text-sky-800',
    prospect: 'bg-slate-100 text-slate-600',
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('configurator.searchClient')}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (input.length >= 2) setIsOpen(true)
          }}
          className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {isOpen && debouncedQuery.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
          {/* New Client button */}
          <button
            type="button"
            onClick={handleNewClient}
            className="flex w-full items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/50"
          >
            <UserPlus className="h-4 w-4" />
            {t('configurator.newClient')}
          </button>

          {isLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : companies && companies.length > 0 ? (
            <div className="max-h-64 overflow-y-auto py-1">
              {companies.map((company) => {
                const primaryContact = company.contacts.find((c) => c.is_primary)
                  ?? company.contacts[0]

                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelect(company)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {company.name}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            categoryColors[company.client_category] ?? categoryColors.prospect,
                          )}
                        >
                          {company.client_category}
                        </span>
                      </div>
                      {primaryContact && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {primaryContact.full_name}
                          {primaryContact.email ? ` · ${primaryContact.email}` : ''}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('configurator.noClientsFound')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
