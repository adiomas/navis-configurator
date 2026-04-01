import type { Database } from './supabase'

// Database row types (convenience aliases)
type Tables = Database['public']['Tables']

export type Profile = Tables['profiles']['Row']
export type ProfileInsert = Tables['profiles']['Insert']

export type CompanySettings = Tables['company_settings']['Row']

export type Boat = Tables['boats']['Row']
export type BoatInsert = Tables['boats']['Insert']
export type BoatUpdate = Tables['boats']['Update']

export type BoatSpec = Tables['boat_specs']['Row']
export type BoatSpecInsert = Tables['boat_specs']['Insert']

export type BoatImage = Tables['boat_images']['Row']
export type BoatImageInsert = Tables['boat_images']['Insert']

export type EquipmentCategory = Tables['equipment_categories']['Row']
export type EquipmentCategoryInsert = Tables['equipment_categories']['Insert']

export type EquipmentItem = Tables['equipment_items']['Row']
export type EquipmentItemInsert = Tables['equipment_items']['Insert']

export type Company = Tables['companies']['Row']
export type CompanyInsert = Tables['companies']['Insert']
export type CompanyUpdate = Tables['companies']['Update']

export type Contact = Tables['contacts']['Row']
export type ContactInsert = Tables['contacts']['Insert']
export type ContactUpdate = Tables['contacts']['Update']

export type Quote = Tables['quotes']['Row']
export type QuoteInsert = Tables['quotes']['Insert']

export type QuoteItem = Tables['quote_items']['Row']
export type QuoteItemInsert = Tables['quote_items']['Insert']

export type QuoteDiscount = Tables['quote_discounts']['Row']
export type QuoteDiscountInsert = Tables['quote_discounts']['Insert']

export type QuoteStatusHistory = Tables['quote_status_history']['Row']

export type QuoteTemplateGroup = Tables['quote_template_groups']['Row']
export type QuoteTemplateGroupInsert = Tables['quote_template_groups']['Insert']

export type QuoteTemplateGroupBoat = Tables['quote_template_group_boats']['Row']
export type QuoteTemplateGroupBoatInsert = Tables['quote_template_group_boats']['Insert']

export type QuoteTemplateGroupEquipment = Tables['quote_template_group_equipment']['Row']
export type QuoteTemplateGroupEquipmentInsert = Tables['quote_template_group_equipment']['Insert']

export type QuoteTemplateGroupDiscount = Tables['quote_template_group_discounts']['Row']
export type QuoteTemplateGroupDiscountInsert = Tables['quote_template_group_discounts']['Insert']

export type PDFTemplate = Tables['pdf_templates']['Row']

export type PartnerLogo = Tables['partner_logos']['Row']
export type PartnerLogoInsert = Tables['partner_logos']['Insert']

// Composite types for UI
export type BoatWithSpecs = Boat & {
  specs: BoatSpec[]
  images: BoatImage[]
}

export type EquipmentCategoryWithItems = EquipmentCategory & {
  items: EquipmentItem[]
}

export type CompanyWithContacts = Company & {
  contacts: Contact[]
}

export type QuoteTemplateGroupWithDetails = QuoteTemplateGroup & {
  boats: (QuoteTemplateGroupBoat & { boat: Boat })[]
  equipment: (QuoteTemplateGroupEquipment & { item: EquipmentItem })[]
  discounts: QuoteTemplateGroupDiscount[]
}

export type QuoteWithDetails = Quote & {
  boat: Boat | null
  company: Company | null
  contact: Contact | null
  items: QuoteItem[]
  discounts: QuoteDiscount[]
  status_history: QuoteStatusHistory[]
  created_by_profile: Profile | null
}

// Configurator state types
export type DiscountLevel = 'boat_base' | 'equipment_all' | 'equipment_item'
export type DiscountType = 'fixed' | 'percentage'

export interface ConfiguratorDiscount {
  id: string
  level: DiscountLevel
  type: DiscountType
  value: number
  equipmentItemId?: string
  description?: string
}

export interface PriceBreakdown {
  boatBasePrice: number
  boatDiscounts: number
  boatFinalPrice: number
  equipmentSubtotal: number
  equipmentItemDiscounts: number
  equipmentAllDiscounts: number
  equipmentFinalTotal: number
  totalDiscount: number
  grandTotal: number
  vatAmount: number
  grandTotalWithVat: number
}

export type EquipmentItemWithQuantity = EquipmentItem & { quantity?: number }

export interface ClientFormData {
  companyId?: string
  contactId?: string
  name: string
  email: string
  phone?: string
  companyName?: string
  notes?: string
  language: 'hr' | 'en'
  deliveryTerms?: string
}

// Quote status
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type BoatCategory = 'new' | 'used'
export type ClientCategory = 'vip' | 'regular' | 'prospect'
export type ClientType = 'company' | 'individual'
export type UserRole = 'admin' | 'sales'
