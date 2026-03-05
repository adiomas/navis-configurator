import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  QuoteTemplateGroup,
  QuoteTemplateGroupWithDetails,
  QuoteTemplateGroupBoatInsert,
  QuoteTemplateGroupEquipmentInsert,
  QuoteTemplateGroupDiscountInsert,
} from '@/types'
import type { TemplateGroupFormData } from '@/lib/validators'

interface TemplateGroupMutationData {
  group: TemplateGroupFormData
  boats: { boat_id: string; special_price: number | null }[]
  equipment: { boat_id: string; equipment_item_id: string; special_price: number | null }[]
  discounts: { discount_level: string; discount_type: string; value: number; description?: string }[]
}

export function useTemplateGroups() {
  return useQuery<QuoteTemplateGroup[]>({
    queryKey: ['templateGroups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_template_groups')
        .select(`
          *,
          boats:quote_template_group_boats(id),
          equipment:quote_template_group_equipment(id),
          discounts:quote_template_group_discounts(id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as QuoteTemplateGroup[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTemplateGroup(id: string | undefined) {
  return useQuery<QuoteTemplateGroupWithDetails>({
    queryKey: ['templateGroup', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_template_groups')
        .select(`
          *,
          boats:quote_template_group_boats(*, boat:boats(*)),
          equipment:quote_template_group_equipment(*, item:equipment_items(*)),
          discounts:quote_template_group_discounts(*)
        `)
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as unknown as QuoteTemplateGroupWithDetails
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useActiveTemplateGroupIds() {
  const today = new Date().toISOString().split('T')[0]

  return useQuery<{ id: string; name: string; valid_from: string; valid_until: string; boats: { boat_id: string }[] }[]>({
    queryKey: ['templateGroups', 'active-ids', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_template_groups')
        .select('id, name, valid_from, valid_until, boats:quote_template_group_boats(boat_id)')
        .eq('is_active', true)
        .lte('valid_from', today)
        .gte('valid_until', today)
        .order('name')
      if (error) throw error
      return data as unknown as { id: string; name: string; valid_from: string; valid_until: string; boats: { boat_id: string }[] }[]
    },
    staleTime: 60 * 1000,
  })
}

export function useActiveTemplateGroups() {
  const today = new Date().toISOString().split('T')[0]

  return useQuery<QuoteTemplateGroupWithDetails[]>({
    queryKey: ['templateGroups', 'active', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_template_groups')
        .select(`
          *,
          boats:quote_template_group_boats(*, boat:boats(*)),
          equipment:quote_template_group_equipment(*, item:equipment_items(*)),
          discounts:quote_template_group_discounts(*)
        `)
        .eq('is_active', true)
        .lte('valid_from', today)
        .gte('valid_until', today)
        .order('name')

      if (error) throw error
      return data as unknown as QuoteTemplateGroupWithDetails[]
    },
    staleTime: 60 * 1000,
  })
}

export function useCreateTemplateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TemplateGroupMutationData) => {
      const { data: session } = await supabase.auth.getSession()

      // Insert group
      const { data: group, error: groupError } = await supabase
        .from('quote_template_groups')
        .insert({
          name: data.group.name,
          description: data.group.description ?? null,
          valid_from: data.group.valid_from,
          valid_until: data.group.valid_until,
          is_active: data.group.is_active,
          created_by: session.session?.user.id ?? null,
        })
        .select()
        .single()
      if (groupError) throw groupError

      // Insert boats
      if (data.boats.length > 0) {
        const boatRows: QuoteTemplateGroupBoatInsert[] = data.boats.map((b) => ({
          group_id: group.id,
          boat_id: b.boat_id,
          special_price: b.special_price,
        }))
        const { error } = await supabase.from('quote_template_group_boats').insert(boatRows)
        if (error) throw error
      }

      // Insert equipment
      if (data.equipment.length > 0) {
        const eqRows: QuoteTemplateGroupEquipmentInsert[] = data.equipment.map((e) => ({
          group_id: group.id,
          boat_id: e.boat_id,
          equipment_item_id: e.equipment_item_id,
          special_price: e.special_price,
        }))
        const { error } = await supabase.from('quote_template_group_equipment').insert(eqRows)
        if (error) throw error
      }

      // Insert discounts
      if (data.discounts.length > 0) {
        const discountRows: QuoteTemplateGroupDiscountInsert[] = data.discounts.map((d) => ({
          group_id: group.id,
          discount_level: d.discount_level,
          discount_type: d.discount_type,
          value: d.value,
          description: d.description ?? null,
        }))
        const { error } = await supabase.from('quote_template_group_discounts').insert(discountRows)
        if (error) throw error
      }

      return group as QuoteTemplateGroup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateGroups'] })
    },
  })
}

export function useUpdateTemplateGroup(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TemplateGroupMutationData) => {
      // Update group
      const { error: groupError } = await supabase
        .from('quote_template_groups')
        .update({
          name: data.group.name,
          description: data.group.description ?? null,
          valid_from: data.group.valid_from,
          valid_until: data.group.valid_until,
          is_active: data.group.is_active,
        })
        .eq('id', id)
      if (groupError) throw groupError

      // Delete + reinsert boats
      await supabase.from('quote_template_group_boats').delete().eq('group_id', id)
      if (data.boats.length > 0) {
        const boatRows: QuoteTemplateGroupBoatInsert[] = data.boats.map((b) => ({
          group_id: id,
          boat_id: b.boat_id,
          special_price: b.special_price,
        }))
        const { error } = await supabase.from('quote_template_group_boats').insert(boatRows)
        if (error) throw error
      }

      // Delete + reinsert equipment
      await supabase.from('quote_template_group_equipment').delete().eq('group_id', id)
      if (data.equipment.length > 0) {
        const eqRows: QuoteTemplateGroupEquipmentInsert[] = data.equipment.map((e) => ({
          group_id: id,
          boat_id: e.boat_id,
          equipment_item_id: e.equipment_item_id,
          special_price: e.special_price,
        }))
        const { error } = await supabase.from('quote_template_group_equipment').insert(eqRows)
        if (error) throw error
      }

      // Delete + reinsert discounts
      await supabase.from('quote_template_group_discounts').delete().eq('group_id', id)
      if (data.discounts.length > 0) {
        const discountRows: QuoteTemplateGroupDiscountInsert[] = data.discounts.map((d) => ({
          group_id: id,
          discount_level: d.discount_level,
          discount_type: d.discount_type,
          value: d.value,
          description: d.description ?? null,
        }))
        const { error } = await supabase.from('quote_template_group_discounts').insert(discountRows)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateGroups'] })
      queryClient.invalidateQueries({ queryKey: ['templateGroup', id] })
    },
  })
}

export function useDeleteTemplateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quote_template_groups')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateGroups'] })
    },
  })
}
