import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Pencil,
  Trash2,
  Plus,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Star,
  Building2,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useAuth } from '@/hooks/useAuth'
import { useCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/useCompanies'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { useCreateContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts'
import { ClientCategoryBadge } from '@/components/clients/ClientCategoryBadge'
import { CompanyForm } from '@/components/clients/CompanyForm'
import { ContactForm } from '@/components/clients/ContactForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, formatPrice } from '@/lib/formatters'
import type { ClientCategory, Contact } from '@/types'
import type { CompanyFormData, ContactFormData } from '@/lib/validators'

export default function ClientDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser, isAdmin } = useAuth()
  const { data: company, isLoading, error, refetch } = useCompany(id)

  const updateCompany = useUpdateCompany(id ?? '')
  const deleteCompany = useDeleteCompany(id ?? '')

  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  const [showEditCompany, setShowEditCompany] = useState(false)
  const [showDeleteCompany, setShowDeleteCompany] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)

  if (isLoading) return <DetailSkeleton />

  if (error) {
    return <QueryErrorState onRetry={refetch} />
  }

  if (!company) {
    return (
      <div className={ds.empty.container}>
        <p className={ds.empty.title}>{t('common.noResults')}</p>
      </div>
    )
  }

  const handleUpdateCompany = (data: CompanyFormData) => {
    updateCompany.mutate(data, { onSuccess: () => setShowEditCompany(false) })
  }

  const handleDeleteCompany = () => {
    deleteCompany.mutate(undefined, {
      onSuccess: () => navigate('/clients'),
    })
  }

  const handleCreateContact = (data: ContactFormData) => {
    createContact.mutate(
      { companyId: id!, data },
      { onSuccess: () => setShowContactForm(false) }
    )
  }

  const handleUpdateContact = (data: ContactFormData) => {
    if (!editingContact) return
    updateContact.mutate(
      { contactId: editingContact.id, companyId: id!, data },
      { onSuccess: () => setEditingContact(null) }
    )
  }

  const handleDeleteContact = () => {
    if (!deletingContactId) return
    deleteContact.mutate(
      { contactId: deletingContactId, companyId: id! },
      { onSuccess: () => setDeletingContactId(null) }
    )
  }

  const quotes = (company as Record<string, unknown>).quotes as Array<{
    id: string
    quote_number: string
    status: string
    total_price: number | null
    created_at: string
    boat: { name: string; brand: string } | null
  }> | undefined

  const canEdit = isAdmin || company.created_by === currentUser?.id

  const leadSourceLabel = company.lead_source
    ? t(`clients.leadSource${company.lead_source.charAt(0).toUpperCase() + company.lead_source.slice(1)}`)
    : '—'

  return (
    <div className={ds.page.spacing}>
      {/* Company info card */}
      <div className={ds.card.base}>
        <div className="flex items-start justify-between border-b border-border/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10">
              <Building2 className="h-5 w-5 text-navy" />
            </div>
            <div>
              <h1 className={ds.page.title}>
                {company.name}
              </h1>
              <div className="mt-0.5 flex items-center gap-2">
                <ClientCategoryBadge
                  category={company.client_category as ClientCategory}
                />
                {company.registration_number && (
                  <span className="text-xs text-muted-foreground">
                    OIB: {company.registration_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowEditCompany(true)}
              className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary)}
            >
              <Pencil className="h-4 w-4" />
              {t('common.edit')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {company.address && (
            <InfoItem
              icon={<MapPin className="h-3.5 w-3.5" />}
              label={t('clients.address')}
              value={[company.address, company.city, company.postal_code, company.country]
                .filter(Boolean)
                .join(', ')}
            />
          )}
          {company.phone && (
            <InfoItem
              icon={<Phone className="h-3.5 w-3.5" />}
              label={t('clients.phone')}
              value={company.phone}
              href={`tel:${company.phone}`}
            />
          )}
          {company.email && (
            <InfoItem
              icon={<Mail className="h-3.5 w-3.5" />}
              label={t('clients.email')}
              value={company.email}
              href={`mailto:${company.email}`}
            />
          )}
          {company.website && (
            <InfoItem
              icon={<Globe className="h-3.5 w-3.5" />}
              label={t('clients.website')}
              value={company.website}
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
            />
          )}
          <InfoItem
            icon={<FileText className="h-3.5 w-3.5" />}
            label={t('clients.leadSource')}
            value={leadSourceLabel}
          />
          <InfoItem
            icon={<Globe className="h-3.5 w-3.5" />}
            label={t('clients.preferredLanguage')}
            value={company.preferred_language === 'hr' ? t('clients.languageHr') : t('clients.languageEn')}
          />
        </div>

        {company.notes && (
          <div className="border-t border-border px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">{t('clients.notes')}</p>
            <p className="mt-0.5 text-xs text-foreground">{company.notes}</p>
          </div>
        )}
      </div>

      {/* Contacts section */}
      <div className={ds.card.base}>
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <h2 className={cn(ds.card.title, 'text-lg')}>
            {t('clients.contacts')}
          </h2>
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowContactForm(true)}
              className={cn(ds.btn.base, ds.btn.sm, ds.btn.primary)}
            >
              <Plus className="h-4 w-4" />
              {t('clients.addContact')}
            </button>
          )}
        </div>

        {company.contacts.length === 0 ? (
          <div className={ds.empty.container}>
            <div className="mb-4 rounded-full bg-muted p-4">
              <User className={ds.empty.icon} />
            </div>
            <p className={ds.empty.title}>{t('clients.noContacts')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {company.contacts.map((contact) => {
              const initials = contact.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              // Generate consistent color from name
              const hue = contact.full_name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360

              return (
                <div
                  key={contact.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: `hsl(${hue}, 45%, 55%)` }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {contact.full_name}
                        </span>
                        {contact.is_primary && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-medium text-gold-dark">
                            <Star className="h-2.5 w-2.5" />
                            {t('clients.primaryContact')}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        {contact.position && <span>{contact.position}</span>}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
                        )}
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingContact(contact)}
                        className={cn(ds.btn.base, ds.btn.icon)}
                        title={t('clients.editContact')}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingContactId(contact.id)}
                        className={cn(ds.btn.base, ds.btn.icon, 'hover:bg-red-50 hover:text-red-600')}
                        title={t('clients.deleteContact')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quote history section */}
      <div className={ds.card.base}>
        <div className="border-b border-border/60 p-4">
          <h2 className={cn(ds.card.title, 'text-lg')}>
            {t('clients.quoteHistory')}
          </h2>
        </div>

        {!quotes || quotes.length === 0 ? (
          <div className={ds.empty.container}>
            <div className="mb-4 rounded-full bg-muted p-4">
              <FileText className={ds.empty.icon} />
            </div>
            <p className={ds.empty.title}>{t('clients.noQuotes')}</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2 p-3">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => navigate(`/quotes/${quote.id}`)}
                  className={cn(ds.card.base, 'cursor-pointer px-4 py-3 hover:bg-muted/30 transition-colors')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-navy">
                      {quote.quote_number}
                    </span>
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground truncate mr-2">
                      {quote.boat ? `${quote.boat.brand} ${quote.boat.name}` : '—'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-navy">
                        {quote.total_price != null ? formatPrice(quote.total_price) : '—'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(quote.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className={cn(ds.table.wrapper, 'hidden sm:block')}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/50">
                    <th className={cn(ds.table.headerCell, 'text-left')}>
                      {t('quotes.quoteNumber')}
                    </th>
                    <th className={cn(ds.table.headerCell, 'text-left')}>
                      {t('quotes.boat')}
                    </th>
                    <th className={cn(ds.table.headerCell, 'text-left')}>
                      {t('common.status')}
                    </th>
                    <th className={cn(ds.table.headerCell, 'text-right')}>
                      {t('quotes.amount')}
                    </th>
                    <th className={cn(ds.table.headerCell, 'text-left')}>
                      {t('quotes.date')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className={ds.table.rowClickable}
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                    >
                      <td className={ds.table.cell}>
                        <span className="font-medium text-navy">{quote.quote_number}</span>
                      </td>
                      <td className={cn(ds.table.cell, 'text-muted-foreground')}>
                        {quote.boat ? `${quote.boat.brand} ${quote.boat.name}` : '—'}
                      </td>
                      <td className={ds.table.cell}>
                        <QuoteStatusBadge status={quote.status} />
                      </td>
                      <td className={cn(ds.table.cell, 'text-right text-foreground')}>
                        {quote.total_price != null ? formatPrice(quote.total_price) : '—'}
                      </td>
                      <td className={cn(ds.table.cell, 'text-muted-foreground')}>
                        {formatDate(quote.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CompanyForm
        isOpen={showEditCompany}
        onClose={() => setShowEditCompany(false)}
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
        onSubmit={handleUpdateCompany}
        isLoading={updateCompany.isPending}
      />

      <ConfirmDialog
        isOpen={showDeleteCompany}
        title={t('clients.deleteCompanyTitle')}
        description={t('clients.deleteCompanyConfirm')}
        confirmText={t('clients.deleteCompany')}
        cancelText={t('common.cancel')}
        isDangerous
        isLoading={deleteCompany.isPending}
        onConfirm={handleDeleteCompany}
        onCancel={() => setShowDeleteCompany(false)}
      />

      <ContactForm
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        onSubmit={handleCreateContact}
        isLoading={createContact.isPending}
      />

      {editingContact && (
        <ContactForm
          isOpen
          onClose={() => setEditingContact(null)}
          defaultValues={{
            full_name: editingContact.full_name,
            email: editingContact.email ?? undefined,
            phone: editingContact.phone ?? undefined,
            position: editingContact.position ?? undefined,
            is_primary: editingContact.is_primary,
          }}
          onSubmit={handleUpdateContact}
          isLoading={updateContact.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingContactId}
        title={t('clients.deleteContactTitle')}
        description={t('clients.deleteContactConfirm')}
        confirmText={t('clients.deleteContact')}
        cancelText={t('common.cancel')}
        isDangerous
        isLoading={deleteContact.isPending}
        onConfirm={handleDeleteContact}
        onCancel={() => setDeletingContactId(null)}
      />
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            className="mt-0.5 block truncate text-xs text-foreground transition-colors hover:text-primary"
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 text-xs text-foreground">{value}</p>
        )}
      </div>
    </div>
  )
}

const statusStyles: Record<string, string> = {
  draft: ds.badge.muted,
  sent: ds.badge.primary,
  accepted: ds.badge.success,
  rejected: ds.badge.danger,
}

function QuoteStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        ds.badge.base,
        statusStyles[status] ?? ds.badge.muted
      )}
    >
      {t(`quotes.${status}`)}
    </span>
  )
}

function DetailSkeleton() {
  return (
    <div className={ds.page.spacing}>
      <div className={cn('animate-pulse p-4', ds.card.base)}>
        <div className="flex items-center gap-3">
          <div className={cn(ds.skeleton.base, 'h-10 w-10 rounded-lg')} />
          <div className="space-y-1.5">
            <div className={cn(ds.skeleton.line, 'h-5 w-48')} />
            <div className={cn(ds.skeleton.line, 'w-24')} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className={cn(ds.skeleton.line, 'h-3 w-16')} />
              <div className={cn(ds.skeleton.line, 'w-32')} />
            </div>
          ))}
        </div>
      </div>
      <div className={cn('animate-pulse p-4', ds.card.base)}>
        <div className={cn(ds.skeleton.line, 'h-5 w-24')} />
        <div className="mt-3 space-y-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(ds.skeleton.circle, 'h-9 w-9')} />
              <div className="space-y-1">
                <div className={cn(ds.skeleton.line, 'w-32')} />
                <div className={cn(ds.skeleton.line, 'h-3 w-48')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
