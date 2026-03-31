import { z } from 'zod'

// --- Import payload types ---

export interface ImportedBoat {
  name: string
  brand: string
  model: string
  year: number
  base_price: number
  description_en?: string
  description_hr?: string
}

export interface ImportedSpec {
  category: string
  label_en: string
  label_hr: string
  value: string
}

export interface ImportedItem {
  name_en: string
  name_hr?: string
  description_en?: string
  description_hr?: string
  price: number
  manufacturer_code?: string
  is_standard: boolean
  is_discountable: boolean
}

export interface ImportedCategory {
  name_en: string
  name_hr?: string
  items: ImportedItem[]
}

export interface ImportPayload {
  boat: ImportedBoat
  specs: ImportedSpec[]
  categories: ImportedCategory[]
}

// --- Zod schemas for validation ---

const importedItemSchema = z.object({
  name_en: z.string().min(1),
  name_hr: z.string().optional().nullable().transform((v) => v ?? undefined),
  description_en: z.string().optional().nullable().transform((v) => v ?? undefined),
  description_hr: z.string().optional().nullable().transform((v) => v ?? undefined),
  price: z.number().min(0),
  manufacturer_code: z.string().optional().nullable().transform((v) => v ?? undefined),
  is_standard: z.boolean(),
  is_discountable: z.boolean(),
})

const importedCategorySchema = z.object({
  name_en: z.string().min(1),
  name_hr: z.string().optional().nullable().transform((v) => v ?? undefined),
  items: z.array(importedItemSchema),
})

const importedSpecSchema = z.object({
  category: z.string().transform(cat => cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()),
  label_en: z.string(),
  label_hr: z.string(),
  value: z.string(),
})

const importedBoatSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  model: z.string(),
  year: z.number().int().min(2000).max(2035),
  base_price: z.number().positive(),
  description_en: z.string().optional().nullable().transform((v) => v ?? undefined),
  description_hr: z.string().optional().nullable().transform((v) => v ?? undefined),
})

export const importPayloadSchema = z.object({
  boat: importedBoatSchema,
  specs: z.array(importedSpecSchema),
  categories: z.array(importedCategorySchema),
})

// --- Validation warnings ---

export type ImportWarningType = 'missing_hr_translation' | 'zero_price' | 'duplicate_name'

export interface ImportWarning {
  type: ImportWarningType
  category?: string
  item?: string
  message: string
}

export function validateImportPayload(payload: ImportPayload): ImportWarning[] {
  const warnings: ImportWarning[] = []
  const seenNames = new Set<string>()

  for (const cat of payload.categories) {
    if (!cat.name_hr) {
      warnings.push({
        type: 'missing_hr_translation',
        category: cat.name_en,
        message: `Category "${cat.name_en}" missing Croatian translation`,
      })
    }

    for (const item of cat.items) {
      if (!item.name_hr) {
        warnings.push({
          type: 'missing_hr_translation',
          category: cat.name_en,
          item: item.name_en,
          message: `Item "${item.name_en}" missing Croatian translation`,
        })
      }

      if (item.price === 0 && !item.is_standard) {
        warnings.push({
          type: 'zero_price',
          category: cat.name_en,
          item: item.name_en,
          message: `Optional item "${item.name_en}" has zero price`,
        })
      }

      const key = item.name_en.toLowerCase()
      if (seenNames.has(key)) {
        warnings.push({
          type: 'duplicate_name',
          category: cat.name_en,
          item: item.name_en,
          message: `Duplicate item name: "${item.name_en}"`,
        })
      }
      seenNames.add(key)
    }
  }

  return warnings
}
