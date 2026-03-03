import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/types'
import type { ContactFormData } from '@/lib/validators'

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ companyId, data }: { companyId: string; data: ContactFormData }) => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          company_id: companyId,
          full_name: data.full_name,
          email: data.email || null,
          phone: data.phone ?? null,
          position: data.position ?? null,
          is_primary: data.is_primary,
        })
        .select()
        .single()
      if (error) throw error
      return contact as Contact
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company', variables.companyId] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; companyId: string; data: ContactFormData }) => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update({
          full_name: data.full_name,
          email: data.email || null,
          phone: data.phone ?? null,
          position: data.position ?? null,
          is_primary: data.is_primary,
        })
        .eq('id', contactId)
        .select()
        .single()
      if (error) throw error
      return contact as Contact
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company', variables.companyId] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contactId }: { contactId: string; companyId: string }) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company', variables.companyId] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
