import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const boatSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brand: z.string().default('Azimut'),
  model: z.string().optional(),
  year: z.number().int().min(2000).max(2030).optional(),
  category: z.enum(['new', 'used']).default('new'),
  base_price: z.number().positive('Price must be positive'),
  description_hr: z.string().min(1, 'Croatian description is required'),
  description_en: z.string().min(1, 'English description is required'),
})

export const equipmentCategorySchema = z.object({
  name_hr: z.string().min(1, 'Croatian name is required'),
  name_en: z.string().min(1, 'English name is required'),
})

export const equipmentItemSchema = z.object({
  name_hr: z.string().min(1, 'Croatian name is required'),
  name_en: z.string().min(1, 'English name is required'),
  description_hr: z.string().optional(),
  description_en: z.string().optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  is_standard: z.boolean().default(false),
})

export const companySchema = z.object({
  client_type: z.enum(['company', 'individual']).default('company'),
  name: z.string().min(1, 'Company name is required'),
  registration_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  client_category: z.enum(['vip', 'regular', 'prospect']).default('prospect'),
  lead_source: z.string().optional(),
  preferred_language: z.enum(['hr', 'en']).default('hr'),
  notes: z.string().optional(),
})

export const contactSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().optional(),
  is_primary: z.boolean().default(false),
})

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  notes: z.string().optional(),
  language: z.enum(['hr', 'en']).default('en'),
})

export const templateGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  valid_from: z.string().min(1, 'Start date is required'),
  valid_until: z.string().min(1, 'End date is required'),
  is_active: z.boolean().default(true),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type BoatFormData = z.infer<typeof boatSchema>
export type EquipmentCategoryFormData = z.infer<typeof equipmentCategorySchema>
export type EquipmentItemFormData = z.infer<typeof equipmentItemSchema>
export type CompanyFormData = z.infer<typeof companySchema>
export type ContactFormData = z.infer<typeof contactSchema>
export type ClientFormSchemaData = z.infer<typeof clientFormSchema>
export const companySettingsSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  oib: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  iban: z.string()
    .transform((v) => v.replace(/\s/g, '').toUpperCase())
    .pipe(
      z.string()
        .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/, 'Invalid IBAN format (e.g. HR1210010051863000160)')
        .or(z.literal(''))
    ),
  bic: z.string()
    .transform((v) => v.replace(/\s/g, '').toUpperCase())
    .pipe(
      z.string()
        .regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid BIC/SWIFT format (e.g. ZABAHR2X)')
        .or(z.literal(''))
    ),
  bank_name: z.string().optional(),
  default_currency: z.string().default('EUR'),
  default_language: z.enum(['hr', 'en']).default('hr'),
})

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'sales']),
})

export const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'sales']),
})

export type TemplateGroupFormData = z.infer<typeof templateGroupSchema>
export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>
export type InviteUserFormData = z.infer<typeof inviteUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
