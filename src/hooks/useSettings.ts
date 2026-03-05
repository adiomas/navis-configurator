import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CompanySettings, PDFTemplate } from '@/types'
import type { CompanySettingsFormData } from '@/lib/validators'

export function useSettings() {
  return useQuery<CompanySettings | null>({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CompanySettingsFormData) => {
      // Get existing row to determine upsert
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single()

      if (existing) {
        const { data: updated, error } = await supabase
          .from('company_settings')
          .update({
            name: data.name,
            oib: data.oib ?? null,
            address: data.address ?? null,
            city: data.city ?? null,
            postal_code: data.postal_code ?? null,
            email: data.email ?? null,
            phone: data.phone ?? null,
            website: data.website ?? null,
            iban: data.iban ?? null,
            bic: data.bic ?? null,
            bank_name: data.bank_name ?? null,
            default_currency: data.default_currency,
            default_language: data.default_language,
          })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        return updated
      } else {
        const { data: created, error } = await supabase
          .from('company_settings')
          .insert({
            name: data.name,
            oib: data.oib ?? null,
            address: data.address ?? null,
            city: data.city ?? null,
            postal_code: data.postal_code ?? null,
            email: data.email ?? null,
            phone: data.phone ?? null,
            website: data.website ?? null,
            iban: data.iban ?? null,
            bic: data.bic ?? null,
            bank_name: data.bank_name ?? null,
            default_currency: data.default_currency,
            default_language: data.default_language,
          })
          .select()
          .single()
        if (error) throw error
        return created
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
    },
  })
}

export function useUpdateTerms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { terms_hr: string; terms_en: string }) => {
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single()

      if (!existing) throw new Error('Company settings not found. Save company details first.')

      const { error } = await supabase
        .from('company_settings')
        .update({
          terms_hr: data.terms_hr || null,
          terms_en: data.terms_en || null,
        })
        .eq('id', existing.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
    },
  })
}

export function useUploadLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `logo.${ext}`

      // Remove old logo files
      const { data: existingFiles } = await supabase.storage
        .from('company-assets')
        .list('', { search: 'logo' })

      if (existingFiles?.length) {
        await supabase.storage
          .from('company-assets')
          .remove(existingFiles.map((f) => f.name))
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      // Get public URL with cache-busting param
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(path)
      const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`

      // Update company_settings logo_url
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('company_settings')
          .update({ logo_url: publicUrl })
          .eq('id', existing.id)
        if (error) throw error
      }

      return publicUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
    },
  })
}

export function useRemoveLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Remove all logo files
      const { data: existingFiles } = await supabase.storage
        .from('company-assets')
        .list('', { search: 'logo' })

      if (existingFiles?.length) {
        await supabase.storage
          .from('company-assets')
          .remove(existingFiles.map((f) => f.name))
      }

      // Set logo_url to null
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('company_settings')
          .update({ logo_url: null })
          .eq('id', existing.id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
    },
  })
}

export function usePDFTemplates() {
  return useQuery<PDFTemplate[]>({
    queryKey: ['pdf-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useSetDefaultPDFTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      // Reset all templates to non-default
      const { error: resetError } = await supabase
        .from('pdf_templates')
        .update({ is_default: false })
        .neq('id', templateId)
      if (resetError) throw resetError

      // Set the selected template as default
      const { error } = await supabase
        .from('pdf_templates')
        .update({ is_default: true })
        .eq('id', templateId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] })
    },
  })
}
