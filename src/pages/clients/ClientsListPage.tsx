import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Users, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useAuth } from '@/hooks/useAuth'
import { useQueryParam } from '@/hooks/useQueryParams'
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/useCompanies'
import { ClientCategoryBadge } from '@/components/clients/ClientCategoryBadge'
import { CompanyForm } from '@/components/clients/CompanyForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/formatters'
import type { ClientCategory, Company } from '@/types'
import type { CompanyFormData } from '@/lib/validators'

type SortOption = 'name' | 'quotes' | 'date'

export default function ClientsListPage() {
  const { t } = useTranslation()
  const { user, isAdmin } = useAuth()
  const { data: companies, isLoading, error, refetch } = useCompanies()

  const [search, setSearch] = useQueryParam('search')
  const [categoryParam, setCategoryParam] = useQueryParam('category', 'all')
  const categoryFilter = categoryParam as ClientCategory | 'all'

  const [searchInput, setSearchInput] = useState(search)
  const [sort, setSort] = useState<SortOption>('name')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null)

  const createCompany = useCreateCompany()
  const deleteCompany = useDeleteCompany(deletingCompanyId ?? '')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput, setSearch])

  const filteredCompanies = useMemo(() => {
    if (!companies) return []

    let result = [...companies]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
    }

    if (categoryFilter !== 'all') {
      result = result.filter((c) => c.client_category === categoryFilter)
    }

    switch (sort) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'quotes':
        result.sort(
          (a, b) => (b.quotes[0]?.count ?? 0) - (a.quotes[0]?.count ?? 0)
        )
        break
      case 'date':
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
    }

    return result
  }, [companies, search, categoryFilter, sort])

  const categoryTabs: { value: ClientCategory | 'all'; label: string }[] = [
    { value: 'all', label: t('common.all') },
    { value: 'vip', label: t('clients.vip') },
    { value: 'regular', label: t('clients.regular') },
    { value: 'prospect', label: t('clients.prospect') },
  ]

  const handleCreate = (data: CompanyFormData) => {
    createCompany.mutate(data, {
      onSuccess: () => setShowCreateForm(false),
    })
  }

  const handleDelete = () => {
    if (!deletingCompanyId) return
    deleteCompany.mutate(undefined, {
      onSuccess: () => setDeletingCompanyId(null),
    })
  }

  return (
    <div className={ds.page.spacing}>
      {/* Header */}
      <div className={ds.page.header}>
        <h1 className={ds.page.title}>
          {t('clients.title')}
        </h1>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
        >
          <Plus className="h-4 w-4" />
          {t('clients.addCompany')}
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-base md:text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
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
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="h-8 cursor-pointer appearance-none rounded-lg border border-input bg-background px-2.5 pr-7 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="name">{t('clients.sortByName')}</option>
              <option value="quotes">{t('clients.sortByQuotes')}</option>
              <option value="date">{t('clients.sortByDate')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <QueryErrorState onRetry={refetch} />
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          message={
            companies?.length === 0
              ? t('clients.noClients')
              : t('common.noResults')
          }
          showCta={companies?.length === 0}
          onAdd={() => setShowCreateForm(true)}
          ctaLabel={t('clients.addCompany')}
        />
      ) : (
        <div className={cn(ds.table.wrapper, ds.card.base)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className={cn(ds.table.headerCell, 'text-left')}>
                  {t('clients.companyName')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-left sm:table-cell')}>
                  {t('clients.contactName')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-left lg:table-cell')}>
                  {t('clients.email')}
                </th>
                <th className={cn(ds.table.headerCell, 'text-left')}>
                  {t('clients.category')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-center sm:table-cell')}>
                  {t('clients.quotesCount')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-left lg:table-cell')}>
                  {t('clients.createdDate')}
                </th>
                <th className={cn(ds.table.headerCell, 'text-right')}>
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => {
                const primaryContact = company.contacts.find((c) => c.is_primary) ?? company.contacts[0]
                const quotesCount = company.quotes[0]?.count ?? 0

                return (
                  <tr
                    key={company.id}
                    className={ds.table.rowClickable}
                  >
                    <td className={ds.table.cell}>
                      <Link
                        to={`/clients/${company.id}`}
                        className="font-medium text-navy hover:text-primary transition-colors"
                      >
                        {company.name}
                      </Link>
                      {/* Mobile: show contact, email, quotes count below company name */}
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground sm:hidden">
                        {primaryContact?.full_name && (
                          <span>{primaryContact.full_name}</span>
                        )}
                        {company.email && (
                          <span className="truncate">{company.email}</span>
                        )}
                        <span>{quotesCount} {t('clients.quotesCount').toLowerCase()}</span>
                      </span>
                    </td>
                    <td className={cn(ds.table.cell, 'hidden sm:table-cell text-muted-foreground')}>
                      {primaryContact?.full_name ?? '—'}
                    </td>
                    <td className={cn(ds.table.cell, 'hidden lg:table-cell text-muted-foreground')}>
                      {company.email ?? '—'}
                    </td>
                    <td className={ds.table.cell}>
                      <ClientCategoryBadge
                        category={company.client_category as ClientCategory}
                      />
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-center text-muted-foreground sm:table-cell')}>
                      {quotesCount}
                    </td>
                    <td className={cn(ds.table.cell, 'hidden lg:table-cell text-muted-foreground')}>
                      {formatDate(company.created_at)}
                    </td>
                    <td className={ds.table.cell}>
                      <div className="flex items-center justify-end gap-1">
                        {(isAdmin || company.created_by === user?.id) && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingCompany(company)}
                              className={cn(ds.btn.base, ds.btn.icon)}
                              title={t('clients.editCompany')}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCompanyId(company.id)}
                              className={cn(ds.btn.base, ds.btn.icon, 'hover:bg-red-50 hover:text-red-600')}
                              title={t('clients.deleteCompany')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <CompanyForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreate}
        isLoading={createCompany.isPending}
      />

      {/* Edit modal */}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deletingCompanyId}
        title={t('clients.deleteCompanyTitle')}
        description={t('clients.deleteCompanyConfirm')}
        confirmText={t('clients.deleteCompany')}
        cancelText={t('common.cancel')}
        isDangerous
        isLoading={deleteCompany.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCompanyId(null)}
      />
    </div>
  )
}

function EditCompanyModal({
  company,
  onClose,
}: {
  company: Company
  onClose: () => void
}) {
  const updateCompany = useUpdateCompany(company.id)

  const handleUpdate = (data: CompanyFormData) => {
    updateCompany.mutate(data, { onSuccess: onClose })
  }

  return (
    <CompanyForm
      isOpen
      onClose={onClose}
      defaultValues={{
        name: company.name,
        registration_number: company.registration_number ?? undefined,
        address: company.address ?? undefined,
        city: company.city ?? undefined,
        postal_code: company.postal_code ?? undefined,
        country: company.country ?? undefined,
        phone: company.phone ?? undefined,
        email: company.email ?? undefined,
        website: company.website ?? undefined,
        client_category: company.client_category as 'vip' | 'regular' | 'prospect',
        lead_source: company.lead_source ?? undefined,
        preferred_language: company.preferred_language as 'hr' | 'en',
        notes: company.notes ?? undefined,
      }}
      onSubmit={handleUpdate}
      isLoading={updateCompany.isPending}
    />
  )
}

function TableSkeleton() {
  return (
    <div className={cn('overflow-hidden', ds.card.base)}>
      <div className="border-b border-border/60 bg-muted/50 px-3 py-2">
        <div className={cn(ds.skeleton.line, 'w-48')} />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 border-b border-border/30 px-3 py-2 last:border-0"
        >
          <div className="space-y-1">
            <div className={cn(ds.skeleton.line, 'w-40')} />
            <div className={cn(ds.skeleton.line, 'h-3 w-32 sm:hidden')} />
          </div>
          <div className={cn(ds.skeleton.line, 'hidden w-28 sm:block')} />
          <div className={cn(ds.skeleton.line, 'hidden w-36 lg:block')} />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className={cn(ds.skeleton.line, 'ml-auto w-8')} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  message,
  showCta,
  onAdd,
  ctaLabel,
}: {
  message: string
  showCta?: boolean
  onAdd?: () => void
  ctaLabel?: string
}) {
  return (
    <div className={ds.empty.container}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <Users className={ds.empty.icon} />
      </div>
      <p className={ds.empty.title}>{message}</p>
      {showCta && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.primary, 'mt-4')}
        >
          <Plus className="h-4 w-4" />
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
