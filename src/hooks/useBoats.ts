import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Boat, BoatInsert, BoatUpdate, BoatWithSpecs, EquipmentCategoryWithItems } from '@/types'
import type { BoatFormData } from '@/lib/validators'

interface BoatFilters {
  search?: string
  category?: 'new' | 'used'
  sort?: 'price_asc' | 'price_desc' | 'name' | 'year'
}

export function useBoats(filters?: BoatFilters) {
  return useQuery<Boat[]>({
    queryKey: ['boats', filters],
    queryFn: async () => {
      let query = supabase
        .from('boats')
        .select('*')
        .eq('status', 'active')

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      switch (filters?.sort) {
        case 'price_asc':
          query = query.order('base_price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('base_price', { ascending: false })
          break
        case 'name':
          query = query.order('name', { ascending: true })
          break
        case 'year':
          query = query.order('year', { ascending: false })
          break
        default:
          query = query.order('base_price', { ascending: false })
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useBoat(id: string | undefined) {
  return useQuery<BoatWithSpecs>({
    queryKey: ['boat', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boats')
        .select('*, specs:boat_specs(*), images:boat_images(*)')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as unknown as BoatWithSpecs
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBoatEquipment(boatId: string | undefined) {
  return useQuery<EquipmentCategoryWithItems[]>({
    queryKey: ['boat', boatId, 'equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*, items:equipment_items(*)')
        .eq('boat_id', boatId!)
        .order('sort_order')
      if (error) throw error
      return data as unknown as EquipmentCategoryWithItems[]
    },
    enabled: !!boatId,
    staleTime: 5 * 60 * 1000,
  })
}

// --- Boat Mutations ---

export function useCreateBoat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BoatFormData) => {
      const { data: session } = await supabase.auth.getSession()
      const insertData: BoatInsert = {
        name: data.name,
        brand: data.brand,
        model: data.model ?? null,
        year: data.year ?? null,
        category: data.category,
        base_price: data.base_price,
        description_hr: data.description_hr ?? null,
        description_en: data.description_en ?? null,
        created_by: session.session?.user.id ?? null,
      }
      const { data: boat, error } = await supabase
        .from('boats')
        .insert(insertData)
        .select()
        .single()
      if (error) throw error
      return boat as Boat
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] })
    },
  })
}

export function useUpdateBoat(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BoatFormData) => {
      const updateData: BoatUpdate = {
        name: data.name,
        brand: data.brand,
        model: data.model ?? null,
        year: data.year ?? null,
        category: data.category,
        base_price: data.base_price,
        description_hr: data.description_hr ?? null,
        description_en: data.description_en ?? null,
      }
      const { data: boat, error } = await supabase
        .from('boats')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return boat as Boat
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] })
      queryClient.invalidateQueries({ queryKey: ['boat', id] })
    },
  })
}

export function useDeleteBoat(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('boats')
        .update({ status: 'archived' as const })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] })
      queryClient.invalidateQueries({ queryKey: ['boat', id] })
    },
  })
}

// --- Image Mutations ---

export function useUploadBoatImage(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop()
      const filePath = `${boatId}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('boat-images')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('boat-images')
        .getPublicUrl(filePath)

      const { data: newImage, error: insertError } = await supabase
        .from('boat_images')
        .insert({
          boat_id: boatId,
          storage_path: filePath,
          display_url: publicUrl,
          category: 'exterior' as const,
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      // Set as hero image (upload button is on the hero area)
      const { error: rpcError } = await supabase.rpc('set_primary_boat_image', {
        p_boat_id: boatId,
        p_image_id: newImage.id,
      })
      if (rpcError) throw rpcError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
      queryClient.invalidateQueries({ queryKey: ['boats'] })
    },
  })
}

export function useDeleteBoatImage(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ imageId, storagePath }: { imageId: string; storagePath: string }) => {
      const { error: storageError } = await supabase.storage
        .from('boat-images')
        .remove([storagePath])
      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('boat_images')
        .delete()
        .eq('id', imageId)
      if (dbError) throw dbError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

export function useSetPrimaryImage(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase.rpc('set_primary_boat_image', {
        p_boat_id: boatId,
        p_image_id: imageId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
      queryClient.invalidateQueries({ queryKey: ['boats'] })
    },
  })
}

// --- Spec Mutations ---

export function useCreateBoatSpec(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { label_hr: string; label_en: string; value: string; category: string; sort_order: number }) => {
      const { error } = await supabase
        .from('boat_specs')
        .insert({ ...data, boat_id: boatId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

export function useUpdateBoatSpec(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ specId, data }: { specId: string; data: { label_hr?: string; label_en?: string; value?: string } }) => {
      const { error } = await supabase
        .from('boat_specs')
        .update(data)
        .eq('id', specId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

export function useDeleteBoatSpec(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (specId: string) => {
      const { error } = await supabase
        .from('boat_specs')
        .delete()
        .eq('id', specId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}

export function useCopySpecs(boatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sourceBoatId: string) => {
      const { data: sourceSpecs, error: fetchError } = await supabase
        .from('boat_specs')
        .select('*')
        .eq('boat_id', sourceBoatId)
      if (fetchError) throw fetchError

      if (sourceSpecs.length > 0) {
        const specsToInsert = sourceSpecs.map((spec) => ({
          boat_id: boatId,
          label_hr: spec.label_hr,
          label_en: spec.label_en,
          value: spec.value,
          category: spec.category,
          sort_order: spec.sort_order,
        }))

        for (let i = 0; i < specsToInsert.length; i += 1000) {
          const batch = specsToInsert.slice(i, i + 1000)
          const { error } = await supabase.from('boat_specs').insert(batch)
          if (error) throw error
        }
      }

      return { specs: sourceSpecs.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boat', boatId] })
    },
  })
}
