import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useSettings } from '@/hooks/useSettings'
import { CompanySettingsForm } from '@/components/settings/CompanySettingsForm'
import { TermsEditor } from '@/components/settings/TermsEditor'
import { DeliveryTermsEditor } from '@/components/settings/DeliveryTermsEditor'
import { PDFTemplatesList } from '@/components/settings/PDFTemplatesList'
import { PartnerLogosManager } from '@/components/settings/PartnerLogosManager'
import { UsersTab } from '@/components/settings/UsersTab'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type SettingsTab = 'company' | 'users'

const VALID_TABS: SettingsTab[] = ['company', 'users']

export default function SettingsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: settings, isLoading } = useSettings()

  const tabParam = searchParams.get('tab') as SettingsTab | null
  const activeTab: SettingsTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'company'

  const setActiveTab = (tab: SettingsTab) => {
    if (tab === 'company') {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ tab }, { replace: true })
    }
  }

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'company', label: t('settings.company') },
    { key: 'users', label: t('settings.users') },
  ]

  return (
    <div className={ds.page.spacing}>
      <h1 className={ds.page.title}>{t('settings.title')}</h1>

      {/* Tab navigation */}
      <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-white text-navy shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company tab: company info + terms + PDF templates */}
      {activeTab === 'company' && (
        isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6 md:space-y-3">
            <section className="md:rounded-lg md:border md:border-border/60 md:bg-white md:p-4">
              <CompanySettingsForm initialData={settings ?? null} />
            </section>
            <section className="border-t border-border/30 pt-5 md:border-0 md:pt-0 md:rounded-lg md:border md:border-border/60 md:bg-white md:p-4">
              <h3 className={cn(ds.card.title, ds.card.titleMargin)}>
                {t('settings.terms')}
              </h3>
              <TermsEditor initialData={settings ?? null} />
            </section>
            <section className="border-t border-border/30 pt-5 md:border-0 md:pt-0 md:rounded-lg md:border md:border-border/60 md:bg-white md:p-4">
              <h3 className={cn(ds.card.title, ds.card.titleMargin)}>
                {t('settings.deliveryTerms')}
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                {t('settings.deliveryTermsHint')}
              </p>
              <DeliveryTermsEditor initialData={settings ?? null} />
            </section>
            <section className="border-t border-border/30 pt-5 md:border-0 md:pt-0 md:rounded-lg md:border md:border-border/60 md:bg-white md:p-4">
              <h3 className={cn(ds.card.title, ds.card.titleMargin)}>
                {t('settings.partnerLogos')}
              </h3>
              <PartnerLogosManager />
            </section>
            <section className="border-t border-border/30 pt-5 md:border-0 md:pt-0 md:rounded-lg md:border md:border-border/60 md:bg-white md:p-4">
              <h3 className={cn(ds.card.title, ds.card.titleMargin)}>
                {t('settings.pdfTemplates')}
              </h3>
              <PDFTemplatesList />
            </section>
          </div>
        )
      )}

      {/* Users tab */}
      {activeTab === 'users' && <UsersTab />}
    </div>
  )
}
