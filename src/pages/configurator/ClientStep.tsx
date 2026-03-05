import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { ClientSelector } from '@/components/configurator/ClientSelector'
import { ClientForm } from '@/components/configurator/ClientForm'
import { CompanyForm } from '@/components/clients/CompanyForm'
import { useCreateCompany } from '@/hooks/useCompanies'
import type { ClientFormData, CompanyWithContacts, Contact } from '@/types'
import type { CompanyFormData } from '@/lib/validators'

export default function ClientStep() {
  const { t } = useTranslation()
  const { clientData, setClientData } = useConfiguratorStore()

  const [selectedCompany, setSelectedCompany] = useState<CompanyWithContacts | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)

  const createCompany = useCreateCompany()

  const handleSelectCompany = (company: CompanyWithContacts) => {
    setSelectedCompany(company)
    setSelectedContact(null)
    const primaryContact = company.contacts.find((c) => c.is_primary) ?? company.contacts[0]
    if (primaryContact) setSelectedContact(primaryContact)
    setClientData({
      companyId: company.id,
      contactId: primaryContact?.id,
      name: primaryContact?.full_name ?? '',
      email: primaryContact?.email ?? '',
      phone: primaryContact?.phone ?? '',
      companyName: company.name,
      language: (company.preferred_language as 'hr' | 'en') ?? 'hr',
    })
  }

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setClientData({
      ...clientData,
      contactId: contact.id,
      name: contact.full_name ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
    })
  }

  const handleCreateCompany = (data: CompanyFormData) => {
    createCompany.mutate(data, {
      onSuccess: () => {
        toast.success(t('clients.createSuccess'))
        setShowAddClient(false)
      },
      onError: () => toast.error(t('common.error')),
    })
  }

  const handleFormSubmit = (data: ClientFormData) => {
    setClientData(data)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {/* Label */}
      <p className="text-xs text-muted-foreground">
        {t('configurator.selectExistingOrNew')}
      </p>

      {/* Client selector */}
      <ClientSelector
        onSelectCompany={handleSelectCompany}
        onAddNew={() => setShowAddClient(true)}
        selectedCompanyId={selectedCompany?.id ?? clientData.companyId}
      />

      {/* Form */}
      {(selectedCompany || (!clientData.companyId && clientData.name)) && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 font-display text-xs font-medium text-navy/70">
                {selectedCompany ? selectedCompany.name : t('configurator.newClient')}
              </span>
            </div>
          </div>

          <ClientForm
            defaultValues={clientData}
            selectedCompany={selectedCompany}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
            onSubmit={handleFormSubmit}
            onValuesChange={setClientData}
            formRef={formRef}
          />
        </>
      )}

      {/* Add Client Modal */}
      <CompanyForm
        isOpen={showAddClient}
        onClose={() => setShowAddClient(false)}
        onSubmit={handleCreateCompany}
        isLoading={createCompany.isPending}
      />
    </div>
  )
}
