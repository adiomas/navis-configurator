import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Ship, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import { ClientSelector } from '@/components/configurator/ClientSelector'
import { DiscountSection } from '@/components/configurator/CompactDiscountEditor'
import { CompanyForm } from '@/components/clients/CompanyForm'
import { useTemplateGroup } from '@/hooks/useTemplateGroups'
import { useCreateQuote } from '@/hooks/useQuotes'
import { useCreateCompany } from '@/hooks/useCompanies'
import { useBoatEquipment } from '@/hooks/useBoats'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import type { CompanyWithContacts, ConfiguratorDiscount } from '@/types'
import type { CompanyFormData } from '@/lib/validators'

interface QuickQuoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateGroupId: string
}

export const QuickQuoteModal = ({
  open,
  onOpenChange,
  templateGroupId,
}: QuickQuoteModalProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: group, isLoading: groupLoading } = useTemplateGroup(
    open ? templateGroupId : undefined
  )
  const createQuote = useCreateQuote()
  const createCompany = useCreateCompany()

  const [selectedBoatId, setSelectedBoatId] = useState<string | null>(null)
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyWithContacts[]>([])
  const [showAddClient, setShowAddClient] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)

  // Auto-select if only one boat
  const boats = group?.boats ?? []
  const effectiveBoatId = boats.length === 1 ? boats[0].boat_id : selectedBoatId

  // Load selected boat's equipment categories
  const { data: boatEquipment } = useBoatEquipment(effectiveBoatId ?? undefined)

  // Get template equipment for selected boat
  const templateEquipment = useMemo(() => {
    if (!group || !effectiveBoatId) return []
    return group.equipment
      .filter((e) => e.boat_id === effectiveBoatId)
      .map((e) => e.item)
  }, [group, effectiveBoatId])

  // Local editable discounts — initialized from template, user can adjust
  const [localDiscounts, setLocalDiscounts] = useState<ConfiguratorDiscount[]>([])

  useEffect(() => {
    if (!group) return
    setLocalDiscounts(
      group.discounts.map((d, i) => ({
        id: `tpl-${i}`,
        level: d.discount_level as ConfiguratorDiscount['level'],
        type: d.discount_type as ConfiguratorDiscount['type'],
        value: d.value,
        description: d.description ?? undefined,
      }))
    )
  }, [group])

  const addLocalDiscount = useCallback((d: ConfiguratorDiscount) => {
    setLocalDiscounts((prev) => [...prev, d])
  }, [])

  const removeLocalDiscount = useCallback((id: string) => {
    setLocalDiscounts((prev) => prev.filter((d) => d.id !== id))
  }, [])

  // Get boat base price (special price from template or original)
  const selectedTemplateBoat = boats.find((b) => b.boat_id === effectiveBoatId)
  const selectedBoatData = boats.find((b) => b.boat_id === effectiveBoatId)?.boat
  const boatBasePrice =
    selectedTemplateBoat?.special_price ?? selectedBoatData?.base_price ?? 0

  const equipmentSubtotal = useMemo(
    () => templateEquipment.reduce((sum, item) => sum + Number(item.price ?? 0), 0),
    [templateEquipment],
  )

  const boatDiscounts = useMemo(
    () => localDiscounts.filter((d) => d.level === 'boat_base'),
    [localDiscounts],
  )
  const equipmentDiscounts = useMemo(
    () => localDiscounts.filter((d) => d.level === 'equipment_all'),
    [localDiscounts],
  )

  const canCreate = !!effectiveBoatId && selectedCompanies.length > 0

  const selectedCompanyIds = useMemo(
    () => selectedCompanies.map((c) => c.id),
    [selectedCompanies]
  )

  const handleToggleCompany = useCallback((company: CompanyWithContacts) => {
    setSelectedCompanies((prev) => {
      const exists = prev.some((c) => c.id === company.id)
      return exists ? prev.filter((c) => c.id !== company.id) : [...prev, company]
    })
  }, [])

  const handleCreateCompany = (data: CompanyFormData) => {
    createCompany.mutate(data, {
      onSuccess: () => {
        setShowAddClient(false)
      },
    })
  }

  const handleCreateQuotes = async () => {
    if (!effectiveBoatId || selectedCompanies.length === 0 || !boatEquipment) return

    const total = selectedCompanies.length
    setBatchProgress({ current: 0, total })

    for (let i = 0; i < selectedCompanies.length; i++) {
      const company = selectedCompanies[i]
      const primaryContact =
        company.contacts.find((c) => c.is_primary) ?? company.contacts[0]

      setBatchProgress({ current: i + 1, total })

      try {
        await createQuote.mutateAsync({
          boatId: effectiveBoatId,
          boatBasePrice,
          clientData: {
            companyId: company.id,
            contactId: primaryContact?.id,
            name: primaryContact?.full_name ?? company.name,
            email: primaryContact?.email ?? company.email ?? '',
            language: (company.preferred_language as 'hr' | 'en') ?? 'hr',
          },
          selectedEquipment: templateEquipment,
          discounts: localDiscounts,
          templateGroupId,
          status: 'draft',
          categories: boatEquipment,
          deliveryTerms: '',
        })
      } catch {
        // Stop on first error — already created quotes remain as drafts
        setBatchProgress(null)
        return
      }
    }

    toast.success(t('templateGroups.quotesCreated', { count: total }))
    setBatchProgress(null)
    onOpenChange(false)
    navigate(`/quotes?template=${templateGroupId}`)
  }

  const handleClose = () => {
    if (batchProgress) return // Don't close during batch creation
    onOpenChange(false)
    setSelectedBoatId(null)
    setSelectedCompanies([])
    setLocalDiscounts([])
  }

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleClose}
        title={t('templateGroups.quickQuote')}
        size="lg"
      >
        {groupLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !group ? (
          <p className="text-sm text-muted-foreground">{t('common.error')}</p>
        ) : (
          <div className="space-y-6">
            {/* Template info */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-medium text-foreground">{group.name}</h4>
              {group.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.description}
                </p>
              )}
            </div>

            {/* Boat selection */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">
                {t('templateGroups.selectBoat')}
              </h4>
              {boats.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('templateGroups.noActiveBoats')}
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {boats.map((tb) => {
                    const boat = tb.boat
                    const isSelected = effectiveBoatId === tb.boat_id
                    const price = tb.special_price ?? boat.base_price

                    return (
                      <button
                        key={tb.boat_id}
                        type="button"
                        onClick={() => setSelectedBoatId(tb.boat_id)}
                        disabled={boats.length === 1}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border hover:bg-muted/50',
                          boats.length === 1 && 'cursor-default'
                        )}
                      >
                        {boat.hero_image_url ? (
                          <img
                            src={boat.hero_image_url}
                            alt={boat.name}
                            className="h-12 w-16 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded bg-muted">
                            <Ship className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {boat.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(price)}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Client selection */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  {t('templateGroups.selectClient')}
                </h4>
                {selectedCompanies.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t('templateGroups.selectedClients', { count: selectedCompanies.length })}
                  </span>
                )}
              </div>

              {/* Selected clients chips */}
              {selectedCompanies.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedCompanies.map((company) => (
                    <span
                      key={company.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 py-1 pl-3 pr-1.5 text-xs font-medium text-foreground"
                    >
                      {company.name}
                      <button
                        type="button"
                        onClick={() => handleToggleCompany(company)}
                        className="rounded-full p-0.5 transition-colors hover:bg-primary/10"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <ClientSelector
                onSelectCompany={handleToggleCompany}
                onAddNew={() => setShowAddClient(true)}
                multiSelect
                selectedCompanyIds={selectedCompanyIds}
                onToggleCompany={handleToggleCompany}
              />
            </div>

            {/* Discounts (optional adjustments) */}
            {effectiveBoatId && (
              <div>
                <h4 className="mb-3 text-sm font-medium text-foreground">
                  {t('templateGroups.adjustDiscounts')}
                </h4>
                <div className="space-y-1.5">
                  <DiscountSection
                    title={t('configurator.boatDiscount')}
                    hint={t('configurator.boatDiscountHint')}
                    level="boat_base"
                    baseAmount={boatBasePrice}
                    activeDiscounts={boatDiscounts}
                    addDiscount={addLocalDiscount}
                    removeDiscount={removeLocalDiscount}
                    t={t}
                  />
                  <DiscountSection
                    title={t('configurator.equipmentWideDiscount')}
                    hint={t('configurator.equipmentDiscountHint')}
                    level="equipment_all"
                    baseAmount={equipmentSubtotal}
                    activeDiscounts={equipmentDiscounts}
                    addDiscount={addLocalDiscount}
                    removeDiscount={removeLocalDiscount}
                    t={t}
                  />
                </div>
              </div>
            )}

            {/* Create button */}
            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              {batchProgress && (
                <div className="mr-auto flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t('templateGroups.creatingQuotes', { current: batchProgress.current, total: batchProgress.total })}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={handleClose}
                disabled={!!batchProgress}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateQuotes}
                disabled={!canCreate || !!batchProgress}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {selectedCompanies.length <= 1
                  ? t('templateGroups.createQuote')
                  : t('templateGroups.createQuotes', { count: selectedCompanies.length })}
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* Add Client modal */}
      <CompanyForm
        isOpen={showAddClient}
        onClose={() => setShowAddClient(false)}
        onSubmit={handleCreateCompany}
        isLoading={createCompany.isPending}
      />
    </>
  )
}
