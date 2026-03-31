import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { importPayloadSchema, validateImportPayload } from '@/lib/price-import'
import type { ImportPayload, ImportWarning } from '@/lib/price-import'
import type { Json } from '@/types/supabase'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data:application/pdf;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface ExtractResult {
  payload: ImportPayload
  warnings: ImportWarning[]
}

export function useExtractPriceList() {
  return useMutation<ExtractResult, Error, File>({
    mutationFn: async (file: File) => {
      const pdf_base64 = await fileToBase64(file)

      const { data, error } = await supabase.functions.invoke('extract-price-list', {
        body: { pdf_base64 },
      })

      if (error) throw new Error(error.message || 'Extraction failed')
      if (data?.error) throw new Error(data.error)

      const parsed = importPayloadSchema.parse(data)
      const warnings = validateImportPayload(parsed)

      return { payload: parsed, warnings }
    },
  })
}

interface SaveResult {
  boatId: string
  categories: number
  items: number
}

export function useSaveImportedBoat() {
  const queryClient = useQueryClient()

  return useMutation<SaveResult, Error, ImportPayload>({
    mutationFn: async (payload: ImportPayload) => {
      const { data, error } = await supabase.rpc('import_boat_from_pricelist', {
        payload: payload as unknown as Json,
      })
      if (error) throw error
      const result = data as unknown as SaveResult
      return { boatId: result.boatId, categories: result.categories, items: result.items }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] })
    },
  })
}
