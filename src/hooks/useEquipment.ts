import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EquipmentCategory, EquipmentItem, EquipmentCategoryWithItems } from '@/types'
import type { EquipmentCategoryFormData, EquipmentItemFormData } from '@/lib/validators'

// --- Category Mutations ---

export function useCreateCategory(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EquipmentCategoryFormData) => {
      const { data: category, error } = await supabase
        .from('equipment_categories')
        .insert({ ...data, boat_id: boatId })
        .select()
        .single()
      if (error) throw error
      return category as EquipmentCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

export function useUpdateCategory(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EquipmentCategoryFormData }) => {
      const { data: category, error } = await supabase
        .from('equipment_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return category as EquipmentCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

export function useDeleteCategory(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment_categories')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

// --- Item Mutations ---

export function useCreateItem(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: string; data: EquipmentItemFormData }) => {
      const { data: item, error } = await supabase
        .from('equipment_items')
        .insert({ ...data, category_id: categoryId, currency: 'EUR' })
        .select()
        .single()
      if (error) throw error
      return item as EquipmentItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

export function useUpdateItem(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EquipmentItemFormData }) => {
      const { data: item, error } = await supabase
        .from('equipment_items')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return item as EquipmentItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

export function useDeleteItem(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment_items')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

// --- Copy Equipment ---

export function useCopyEquipment(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sourceBoatId: string) => {
      // Fetch source boat equipment
      const { data: sourceCategories, error: fetchError } = await supabase
        .from('equipment_categories')
        .select('*, items:equipment_items(*)')
        .eq('boat_id', sourceBoatId)
      if (fetchError) throw fetchError

      const categories = sourceCategories as EquipmentCategoryWithItems[]
      let totalItems = 0

      for (const cat of categories) {
        // Insert category for target boat
        const { data: newCat, error: catError } = await supabase
          .from('equipment_categories')
          .insert({
            boat_id: boatId,
            name_hr: cat.name_hr,
            name_en: cat.name_en,
            sort_order: cat.sort_order,
          })
          .select()
          .single()
        if (catError) throw catError

        // Insert items for new category
        if (cat.items.length > 0) {
          const itemsToInsert = cat.items.map((item) => ({
            category_id: newCat.id,
            name_hr: item.name_hr,
            name_en: item.name_en,
            description_hr: item.description_hr,
            description_en: item.description_en,
            price: item.price,
            currency: item.currency,
            is_standard: item.is_standard,
            sort_order: item.sort_order,
          }))

          // Batch in chunks of 1000
          for (let i = 0; i < itemsToInsert.length; i += 1000) {
            const batch = itemsToInsert.slice(i, i + 1000)
            const { error: itemsError } = await supabase
              .from('equipment_items')
              .insert(batch)
            if (itemsError) throw itemsError
          }
          totalItems += cat.items.length
        }
      }

      return { categories: categories.length, items: totalItems }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

// --- Reorder ---

export function useReorderCategories(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; sort_order: number }>) => {
      for (const { id, sort_order } of updates) {
        const { error } = await supabase
          .from('equipment_categories')
          .update({ sort_order })
          .eq('id', id)
        if (error) throw error
      }
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['boat', boatId, 'equipment'] })
      const previous = queryClient.getQueryData<EquipmentCategoryWithItems[]>(['boat', boatId, 'equipment'])
      if (previous) {
        const orderMap = new Map(updates.map((u) => [u.id, u.sort_order]))
        queryClient.setQueryData<EquipmentCategoryWithItems[]>(['boat', boatId, 'equipment'],
          previous.map((cat) => ({
            ...cat,
            sort_order: orderMap.get(cat.id) ?? cat.sort_order,
          })),
        )
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['boat', boatId, 'equipment'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId, 'equipment'] })
    },
  })
}

export function useReorderItems(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; sort_order: number }>) => {
      for (const { id, sort_order } of updates) {
        const { error } = await supabase
          .from('equipment_items')
          .update({ sort_order })
          .eq('id', id)
        if (error) throw error
      }
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['boat', boatId, 'equipment'] })
      const previous = queryClient.getQueryData<EquipmentCategoryWithItems[]>(['boat', boatId, 'equipment'])
      if (previous) {
        const orderMap = new Map(updates.map((u) => [u.id, u.sort_order]))
        queryClient.setQueryData<EquipmentCategoryWithItems[]>(['boat', boatId, 'equipment'],
          previous.map((cat) => ({
            ...cat,
            items: cat.items.map((item) => ({
              ...item,
              sort_order: orderMap.get(item.id) ?? item.sort_order,
            })),
          })),
        )
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['boat', boatId, 'equipment'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId, 'equipment'] })
    },
  })
}

// --- Bulk Delete ---

export function useDeleteItems(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('equipment_items')
        .delete()
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}
