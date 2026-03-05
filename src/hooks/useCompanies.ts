import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Company, CompanyWithContacts } from '@/types'
import type { CompanyFormData } from '@/lib/validators'

interface CompanyFilters {
  search?: string
  category?: 'vip' | 'regular' | 'prospect'
}

export function useCompanies(filters?: CompanyFilters) {
  return useQuery<(CompanyWithContacts & { quotes: { count: number }[] })[]>({
    queryKey: ['companies', filters],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('id, name, client_type, email, phone, client_category, city, country, created_at, status, contacts(id, full_name, email, phone, position, is_primary), quotes:quotes(count)')
        .eq('status', 'active')
        .order('name')

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      if (filters?.category) {
        query = query.eq('client_category', filters.category)
      }

      const { data, error } = await query
      if (error) throw error
      return data as unknown as (CompanyWithContacts & { quotes: { count: number }[] })[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*, contacts(*), quotes(*, boat:boats(name, brand)), created_by')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as unknown as CompanyWithContacts & {
        quotes: (Company & { boat: { name: string; brand: string } | null })[]
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCompaniesSearch(query: string) {
  return useQuery<CompanyWithContacts[]>({
    queryKey: ['companies', 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*, contacts(*)')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name')
        .limit(10)

      if (error) throw error
      return data as unknown as CompanyWithContacts[]
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const { data: session } = await supabase.auth.getSession()
      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          client_type: data.client_type,
          name: data.name,
          registration_number: data.registration_number ?? null,
          address: data.address ?? null,
          city: data.city ?? null,
          postal_code: data.postal_code ?? null,
          country: data.country ?? null,
          phone: data.phone ?? null,
          email: data.email || null,
          website: data.website || null,
          client_category: data.client_category,
          lead_source: data.lead_source ?? null,
          preferred_language: data.preferred_language,
          notes: data.notes ?? null,
          created_by: session.session?.user.id ?? null,
        })
        .select()
        .single()
      if (error) throw error

      // Auto-create primary contact for individual clients
      if (data.client_type === 'individual') {
        await supabase.from('contacts').insert({
          company_id: company.id,
          full_name: data.name,
          email: data.email || null,
          phone: data.phone ?? null,
          is_primary: true,
        })
      }

      return company as Company
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const { data: company, error } = await supabase
        .from('companies')
        .update({
          client_type: data.client_type,
          name: data.name,
          registration_number: data.registration_number ?? null,
          address: data.address ?? null,
          city: data.city ?? null,
          postal_code: data.postal_code ?? null,
          country: data.country ?? null,
          phone: data.phone ?? null,
          email: data.email || null,
          website: data.website || null,
          client_category: data.client_category,
          lead_source: data.lead_source ?? null,
          preferred_language: data.preferred_language,
          notes: data.notes ?? null,
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      // Sync primary contact for individual clients
      if (data.client_type === 'individual') {
        const { data: primaryContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('company_id', id)
          .eq('is_primary', true)
          .single()

        if (primaryContact) {
          await supabase
            .from('contacts')
            .update({
              full_name: data.name,
              email: data.email || null,
              phone: data.phone ?? null,
            })
            .eq('id', primaryContact.id)
        }
      }

      return company as Company
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company', id] })
    },
  })
}

export function useDeleteCompany(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'archived' as const })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company', id] })
    },
  })
}
