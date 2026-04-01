import { useMemo, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { useCreateQuote } from '@/hooks/useQuotes'
import { useSettings } from '@/hooks/useSettings'
import { CompactReviewSummary } from '@/components/configurator/CompactReviewSummary'
import type { BoatWithSpecs, EquipmentCategoryWithItems } from '@/types'

interface ReviewStepProps {
  boatDetails: BoatWithSpecs | null
  boatEquipment: EquipmentCategoryWithItems[]
}

export default function ReviewStep({ boatDetails, boatEquipment }: ReviewStepProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language as 'hr' | 'en'
  const { data: settings } = useSettings()
  const {
    selectedBoat,
    selectedEquipment,
    clientData,
    discounts,
    templateGroupId,
    deliveryTerms,
    setDeliveryTerms,
    modelYear,
    setModelYear,
    paymentTerms,
    setPaymentTerms,
    reset,
  } = useConfiguratorStore()

  const createQuote = useCreateQuote()

  // Prefill delivery terms from company settings if store value is empty
  useEffect(() => {
    if (!deliveryTerms && settings) {
      const defaultTerms = lang === 'hr'
        ? settings.delivery_terms_hr ?? settings.delivery_terms_en ?? ''
        : settings.delivery_terms_en ?? settings.delivery_terms_hr ?? ''
      if (defaultTerms) setDeliveryTerms(defaultTerms)
    }
  }, [settings, lang, deliveryTerms, setDeliveryTerms])

  // Prefill payment terms from company settings if store value is empty
  useEffect(() => {
    if (!paymentTerms && settings) {
      const defaultPaymentTerms = lang === 'hr'
        ? settings.terms_hr ?? settings.terms_en ?? ''
        : settings.terms_en ?? settings.terms_hr ?? ''
      if (defaultPaymentTerms) setPaymentTerms(defaultPaymentTerms)
    }
  }, [settings, lang, paymentTerms, setPaymentTerms])

  const equipmentArray = useMemo(
    () => [...selectedEquipment.values()],
    [selectedEquipment],
  )

  const handleSave = useCallback(async (status: 'draft' | 'sent') => {
    if (!selectedBoat || !boatDetails) return

    try {
      const quote = await createQuote.mutateAsync({
        boatId: selectedBoat.id,
        boatBasePrice: selectedBoat.base_price,
        clientData,
        selectedEquipment: equipmentArray,
        discounts,
        templateGroupId,
        status,
        categories: boatEquipment,
        deliveryTerms,
        modelYear,
        paymentTerms,
      })

      toast.success(
        status === 'draft'
          ? t('configurator.quoteSaved', { number: quote.quote_number })
          : t('configurator.offerCreated', { number: quote.quote_number }),
      )

      reset()
      navigate(`/quotes/${quote.id}`)
    } catch {
      toast.error(t('configurator.saveError'))
    }
  }, [selectedBoat, boatDetails, boatEquipment, createQuote, clientData, equipmentArray, discounts, templateGroupId, t, reset, navigate])

  // Listen for save events from MobileBottomBar / desktop bottom nav
  useEffect(() => {
    const handler = (e: Event) => {
      const status = (e as CustomEvent<string>).detail as 'draft' | 'sent'
      handleSave(status)
    }
    document.addEventListener('configurator:save', handler)
    return () => document.removeEventListener('configurator:save', handler)
  }, [handleSave])

  if (!selectedBoat || !boatDetails) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CompactReviewSummary
        boat={selectedBoat}
        boatEquipment={boatEquipment}
        selectedEquipment={selectedEquipment}
        discounts={discounts}
        clientData={clientData}
      />

      {/* Model Year (only for new boats) */}
      {selectedBoat?.category === 'new' && (
        <div className="rounded-lg border border-border bg-card p-4">
          <label className={cn(ds.input.label, 'mb-1.5')}>
            {t('configurator.modelYear')}
          </label>
          <input
            type="number"
            min={2024}
            max={2035}
            value={modelYear ?? ''}
            onChange={(e) => setModelYear(e.target.value ? parseInt(e.target.value, 10) : null)}
            placeholder={t('configurator.modelYearPlaceholder')}
            className={cn(ds.input.base, 'w-32')}
          />
        </div>
      )}

      {/* Delivery Terms */}
      <div className="rounded-lg border border-border bg-card p-4">
        <label className={cn(ds.input.label, 'mb-1.5')}>
          {t('configurator.deliveryTerms')}
        </label>
        <textarea
          value={deliveryTerms}
          onChange={(e) => setDeliveryTerms(e.target.value)}
          rows={3}
          placeholder={t('configurator.deliveryTermsPlaceholder')}
          className={ds.input.textarea}
        />
      </div>

      {/* Payment Terms */}
      <div className="rounded-lg border border-border bg-card p-4">
        <label className={cn(ds.input.label, 'mb-1.5')}>
          {t('configurator.paymentTerms')}
        </label>
        <textarea
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          rows={3}
          placeholder={t('configurator.paymentTermsPlaceholder')}
          className={ds.input.textarea}
        />
      </div>
    </div>
  )
}
