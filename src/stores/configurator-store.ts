import { create } from 'zustand'
import type {
  Boat,
  ClientFormData,
  ConfiguratorDiscount,
  EquipmentCategoryWithItems,
  EquipmentItem,
  QuoteWithDetails,
  DiscountLevel,
  DiscountType,
} from '@/types'

interface ConfiguratorState {
  currentStep: 1 | 2 | 3 | 4
  selectedBoat: Boat | null
  selectedEquipment: Map<string, EquipmentItem>
  clientData: ClientFormData
  discounts: ConfiguratorDiscount[]
  templateGroupId: string | null

  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void
  setBoat: (boat: Boat | null) => void
  toggleEquipment: (item: EquipmentItem) => void
  setSelectedEquipment: (items: Map<string, EquipmentItem>) => void
  setClientData: (data: Partial<ClientFormData>) => void
  addDiscount: (discount: ConfiguratorDiscount) => void
  removeDiscount: (id: string) => void
  setTemplateGroupId: (id: string | null) => void
  loadFromQuote: (quote: QuoteWithDetails, boatEquipment: EquipmentCategoryWithItems[]) => void
  reset: () => void
}

const initialClientData: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  companyName: '',
  notes: '',
  language: 'hr',
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  currentStep: 1,
  selectedBoat: null,
  selectedEquipment: new Map(),
  clientData: { ...initialClientData },
  discounts: [],
  templateGroupId: null,

  setStep: (step) => set({ currentStep: step }),

  setBoat: (boat) => set({
    selectedBoat: boat,
    selectedEquipment: new Map(),
    discounts: [],
    templateGroupId: null,
  }),

  toggleEquipment: (item) =>
    set((state) => {
      const next = new Map(state.selectedEquipment)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.set(item.id, item)
      }
      return { selectedEquipment: next }
    }),

  setSelectedEquipment: (items) => set({ selectedEquipment: items }),

  setClientData: (data) =>
    set((state) => ({
      clientData: { ...state.clientData, ...data },
    })),

  addDiscount: (discount) =>
    set((state) => ({
      discounts: [...state.discounts, discount],
    })),

  removeDiscount: (id) =>
    set((state) => ({
      discounts: state.discounts.filter((d) => d.id !== id),
    })),

  setTemplateGroupId: (id) => set({ templateGroupId: id }),

  loadFromQuote: (quote, boatEquipment) => {
    // Build equipment map by matching quote_items with actual equipment
    const allItems = boatEquipment.flatMap((cat) => cat.items)
    const equipmentMap = new Map<string, EquipmentItem>()
    for (const qi of quote.items) {
      if (qi.equipment_item_id) {
        const match = allItems.find((item) => item.id === qi.equipment_item_id)
        if (match) {
          equipmentMap.set(match.id, match)
        }
      }
    }

    // Convert quote discounts to configurator discounts
    const discounts: ConfiguratorDiscount[] = quote.discounts.map((d) => ({
      id: crypto.randomUUID(),
      level: d.discount_level as DiscountLevel,
      type: d.discount_type as DiscountType,
      value: Number(d.value),
      equipmentItemId: d.equipment_item_id ?? undefined,
      description: d.description ?? undefined,
    }))

    set({
      currentStep: 1,
      selectedBoat: quote.boat,
      selectedEquipment: equipmentMap,
      clientData: {
        companyId: quote.company?.id,
        contactId: quote.contact?.id,
        name: quote.contact?.full_name ?? '',
        email: quote.contact?.email ?? '',
        phone: quote.contact?.phone ?? '',
        companyName: quote.company?.name ?? '',
        notes: quote.notes ?? '',
        language: (quote.language as 'hr' | 'en') ?? 'en',
      },
      discounts,
      templateGroupId: quote.template_group_id ?? null,
    })
  },

  reset: () =>
    set({
      currentStep: 1,
      selectedBoat: null,
      selectedEquipment: new Map(),
      clientData: { ...initialClientData },
      discounts: [],
      templateGroupId: null,
    }),
}))
