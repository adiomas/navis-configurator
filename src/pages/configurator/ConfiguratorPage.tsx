import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Check, Save, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { useBoat, useBoatEquipment } from '@/hooks/useBoats'
import { calculatePriceBreakdown } from '@/lib/pricing'
import { CompactPriceSidebar } from '@/components/configurator/CompactPriceSidebar'
import { MobileBottomBar } from '@/components/configurator/MobileBottomBar'
import BoatStep from './BoatStep'
import EquipmentStep from './EquipmentStep'
import ClientStep from './ClientStep'
import ReviewStep from './ReviewStep'

const STEPS = [
  { number: 1 as const, key: 'configurator.step1' },
  { number: 2 as const, key: 'configurator.step2' },
  { number: 3 as const, key: 'configurator.step3' },
  { number: 4 as const, key: 'configurator.step4' },
]

export default function ConfiguratorPage() {
  const { t } = useTranslation()
  const {
    currentStep,
    setStep,
    selectedBoat,
    selectedEquipment,
    discounts,
    clientData,
  } = useConfiguratorStore()

  const { data: boatDetails } = useBoat(selectedBoat?.id)
  const { data: boatEquipment } = useBoatEquipment(selectedBoat?.id)

  const equipmentArray = useMemo(
    () => [...selectedEquipment.values()],
    [selectedEquipment],
  )

  const itemDiscountableMap = useMemo(() => {
    if (!boatEquipment) return new Map<string, boolean>()
    const map = new Map<string, boolean>()
    for (const cat of boatEquipment) {
      for (const item of cat.items) {
        if (selectedEquipment.has(item.id)) {
          map.set(item.id, item.is_discountable ?? cat.is_discountable ?? true)
        }
      }
    }
    return map
  }, [boatEquipment, selectedEquipment])

  const priceBreakdown = useMemo(
    () => calculatePriceBreakdown(
      selectedBoat?.base_price ?? 0,
      equipmentArray,
      discounts,
      itemDiscountableMap,
    ),
    [selectedBoat?.base_price, equipmentArray, discounts, itemDiscountableMap],
  )

  const discountableEquipmentSubtotal = useMemo(() =>
    equipmentArray
      .filter(item => !item.is_standard && (itemDiscountableMap.get(item.id) ?? true))
      .reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0),
    [equipmentArray, itemDiscountableMap],
  )

  const selectedOptionalItems = useMemo(
    () => equipmentArray.filter((item) => !item.is_standard),
    [equipmentArray],
  )

  const canGoNext = (() => {
    switch (currentStep) {
      case 1: return selectedBoat !== null
      case 2: return true
      case 3: return clientData.name.trim() !== '' && clientData.email.includes('@')
      case 4: return false
    }
  })()

  const handleStepClick = (step: 1 | 2 | 3 | 4) => {
    if (step < currentStep) {
      setStep(step)
    } else if (step === currentStep + 1 && canGoNext) {
      setStep(step)
    }
  }

  const goBack = () => {
    if (currentStep > 1) setStep((currentStep - 1) as 1 | 2 | 3 | 4)
  }

  const goNext = () => {
    if (currentStep < 4 && canGoNext) setStep((currentStep + 1) as 1 | 2 | 3 | 4)
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col gap-4 pb-16 lg:pb-0">
      {/* Header: Title + Step Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-navy lg:text-xl">
            {t('configurator.title')}
          </h1>

          {/* Step stepper */}
          <div className="flex items-center gap-0">
            {STEPS.map((step, idx) => {
              const isActive = step.number === currentStep
              const isCompleted = step.number < currentStep
              const isClickable = step.number < currentStep || (step.number === currentStep + 1 && canGoNext)
              return (
                <div key={step.number} className="flex items-center">
                  {idx > 0 && (
                    <div className={cn(
                      'h-px w-4 sm:w-6 lg:w-8 transition-colors duration-300',
                      step.number <= currentStep ? 'bg-primary' : 'bg-border',
                    )} />
                  )}
                  <button
                    type="button"
                    onClick={() => handleStepClick(step.number)}
                    disabled={!isClickable && !isActive}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
                      'h-7 w-7 justify-center text-[11px]',
                      'sm:h-auto sm:w-auto sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs',
                      isActive && 'bg-navy text-white shadow-sm scale-105',
                      isCompleted && 'bg-primary/15 text-primary',
                      !isActive && !isCompleted && 'text-muted-foreground',
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    ) : (
                      <span className="sm:hidden">{step.number}</span>
                    )}
                    <span className="hidden sm:inline">{t(step.key)}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content: step + price sidebar */}
      <div className="flex flex-1 gap-4">
        {/* Step content */}
        <div className="min-w-0 flex-1">
          {currentStep === 1 && <BoatStep />}
          {currentStep === 2 && <EquipmentStep priceBreakdown={priceBreakdown} discountableEquipmentSubtotal={discountableEquipmentSubtotal} />}
          {currentStep === 3 && <ClientStep />}
          {currentStep === 4 && (
            <ReviewStep boatDetails={boatDetails ?? null} boatEquipment={boatEquipment ?? []} />
          )}
        </div>

        {/* Price sidebar (desktop only) */}
        <div className="hidden w-72 shrink-0 lg:block xl:w-80">
          <div className="sticky top-0">
            <CompactPriceSidebar
              boatName={selectedBoat?.name ?? null}
              boatImageUrl={selectedBoat?.hero_image_url ?? null}
              basePrice={selectedBoat?.base_price ?? 0}
              selectedOptionalItems={selectedOptionalItems}
              priceBreakdown={priceBreakdown}
              discounts={discounts}
            />
          </div>
        </div>
      </div>

      {/* DESKTOP: bottom nav — sticky glass effect */}
      <div className="sticky bottom-0 z-10 -mx-6 mt-auto hidden border-t border-border/50 bg-card/95 px-6 py-2.5 backdrop-blur-sm lg:block">
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={goBack}
            className={cn(
              ds.btn.base, ds.btn.md, ds.btn.ghost,
              currentStep === 1 && 'invisible',
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('common.back')}
          </button>

          {/* Step indicator dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  step.number === currentStep
                    ? 'w-6 bg-primary'
                    : step.number < currentStep
                      ? 'w-1.5 bg-primary/40'
                      : 'w-1.5 bg-border',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 4 ? (
              <>
                <button
                  type="button"
                  onClick={() => document.dispatchEvent(new CustomEvent('configurator:save', { detail: 'draft' }))}
                  className={cn(ds.btn.base, ds.btn.md, ds.btn.secondary)}
                >
                  <Save className="h-3.5 w-3.5" />
                  {t('configurator.saveDraft')}
                </button>
                <button
                  type="button"
                  onClick={() => document.dispatchEvent(new CustomEvent('configurator:save', { detail: 'sent' }))}
                  className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  {t('configurator.createOffer')}
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!canGoNext}
                onClick={goNext}
                className={cn(
                  ds.btn.base, ds.btn.md, ds.btn.primary,
                  !canGoNext && 'cursor-not-allowed opacity-50',
                )}
              >
                {t('common.next')}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE: unified bottom bar */}
      <MobileBottomBar
        currentStep={currentStep}
        canGoNext={canGoNext}
        onBack={goBack}
        onNext={goNext}
        priceBreakdown={priceBreakdown}
        discounts={discounts}
        boatName={selectedBoat?.name}
        selectedOptionalItems={selectedOptionalItems}
        basePrice={selectedBoat?.base_price ?? 0}
      />
    </div>
  )
}
