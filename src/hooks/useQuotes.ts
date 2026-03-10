import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { calculatePriceBreakdown, calculateDiscountAmount } from '@/lib/pricing'
import type {
  ClientFormData,
  ConfiguratorDiscount,
  EquipmentCategoryWithItems,
  EquipmentItem,
  QuoteInsert,
  QuoteItemInsert,
  QuoteDiscountInsert,
  QuoteStatus,
  QuoteStatusHistory,
  QuoteWithDetails,
} from '@/types'

// --- List & filter hooks ---

interface QuoteFilters {
  page?: number
  search?: string
  status?: QuoteStatus | 'all'
  sort?: 'date' | 'amount'
  templateGroupId?: string
}

const PER_PAGE = 10

export function useQuotes(filters?: QuoteFilters) {
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: async () => {
      const page = filters?.page ?? 1
      const from = (page - 1) * PER_PAGE
      const to = from + PER_PAGE - 1

      let query = supabase
        .from('quotes')
        .select(
          '*, boat:boats(id, name, hero_image_url), company:companies(id, name), contact:contacts(id, full_name), created_by_profile:profiles!quotes_created_by_fkey(id, full_name)',
          { count: 'exact' }
        )

      if (filters?.search) {
        query = query.ilike('quote_number', `%${filters.search}%`)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.templateGroupId) {
        query = query.eq('template_group_id', filters.templateGroupId)
      }

      if (filters?.sort === 'amount') {
        query = query.order('total_price', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      query = query.range(from, to)

      const { data, count, error } = await query
      if (error) throw error
      return { data: data ?? [], count: count ?? 0 }
    },
    staleTime: 30 * 1000,
  })
}

export function useQuoteStatusCounts(templateGroupId?: string) {
  return useQuery<Record<string, number>>({
    queryKey: ['quotes', 'status-counts', templateGroupId ?? 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_quote_status_counts', {
        p_template_group_id: templateGroupId,
      })
      if (error) throw error
      return data as unknown as Record<string, number>
    },
    staleTime: 30 * 1000,
  })
}

export function useTemplateGroupQuoteCounts() {
  return useQuery<Record<string, { total: number; accepted: number }>>({
    queryKey: ['template-groups', 'quote-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_template_group_quote_counts')
      if (error) throw error
      return data as unknown as Record<string, { total: number; accepted: number }>
    },
    staleTime: 60 * 1000,
  })
}

export function useQuote(quoteId?: string) {
  return useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          boat:boats(*),
          company:companies(*),
          contact:contacts(*),
          items:quote_items(*),
          discounts:quote_discounts(*),
          status_history:quote_status_history(
            *,
            changed_by_profile:profiles!quote_status_history_changed_by_fkey(id, full_name)
          ),
          created_by_profile:profiles!quotes_created_by_fkey(id, full_name)
        `)
        .eq('id', quoteId!)
        .order('created_at', { referencedTable: 'quote_status_history', ascending: false })
        .single()
      if (error) throw error
      return data as unknown as QuoteWithDetails & {
        status_history: Array<QuoteStatusHistory & {
          changed_by_profile: { id: string; full_name: string | null } | null
        }>
      }
    },
    enabled: !!quoteId,
    staleTime: 30 * 1000,
  })
}

export function useUpdateQuoteDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ quoteId, depositPercentage }: { quoteId: string; depositPercentage: number | null }) => {
      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select('total_price')
        .eq('id', quoteId)
        .single()
      if (fetchError) throw fetchError

      const depositAmount = depositPercentage != null && depositPercentage > 0
        ? Number(quote.total_price) * (depositPercentage / 100)
        : null

      const { error: updateError } = await supabase
        .from('quotes')
        .update({ deposit_percentage: depositPercentage, deposit_amount: depositAmount })
        .eq('id', quoteId)
      if (updateError) throw updateError
    },
    onSuccess: (_data, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] })
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useUpdateQuoteLanguage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ quoteId, language }: { quoteId: string; language: 'hr' | 'en' }) => {
      const { error } = await supabase
        .from('quotes')
        .update({ language })
        .eq('id', quoteId)
      if (error) throw error
    },
    onSuccess: (_data, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] })
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ quoteId, newStatus }: { quoteId: string; newStatus: QuoteStatus }) => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id ?? null

      // Fetch current status
      const { data: current, error: fetchError } = await supabase
        .from('quotes')
        .select('status')
        .eq('id', quoteId)
        .single()

      if (fetchError) throw fetchError

      // Build update payload
      const updatePayload: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'sent') updatePayload.sent_at = new Date().toISOString()
      if (newStatus === 'accepted') updatePayload.accepted_at = new Date().toISOString()
      if (newStatus === 'rejected') updatePayload.rejected_at = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('quotes')
        .update(updatePayload)
        .eq('id', quoteId)

      if (updateError) throw updateError

      // Insert status history
      await supabase.from('quote_status_history').insert({
        quote_id: quoteId,
        old_status: current.status,
        new_status: newStatus,
        changed_by: userId,
      })

      return quoteId
    },
    onSuccess: (_data, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] })
    },
  })
}

export function useCopyQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sourceQuoteId: string) => {
      // 1. Fetch source quote with items and discounts
      const { data: source, error: fetchError } = await supabase
        .from('quotes')
        .select('*, items:quote_items(*), discounts:quote_discounts(*)')
        .eq('id', sourceQuoteId)
        .single()
      if (fetchError) throw fetchError

      // 2. Get current user
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id ?? null

      // 3. Generate new quote number (atomic RPC with row locking)
      const { data: quoteNumber, error: rpcError } = await supabase.rpc('generate_quote_number')
      if (rpcError) throw rpcError

      // 4. Insert new quote (draft, timestamps reset)
      const { data: newQuote, error: insertError } = await supabase
        .from('quotes')
        .insert({
          quote_number: quoteNumber,
          boat_id: source.boat_id,
          company_id: source.company_id,
          contact_id: source.contact_id,
          status: 'draft' as const,
          language: source.language,
          notes: source.notes,
          boat_base_price: source.boat_base_price,
          boat_discount: source.boat_discount,
          equipment_subtotal: source.equipment_subtotal,
          equipment_discount: source.equipment_discount,
          total_discount: source.total_discount,
          total_price: source.total_price,
          currency: source.currency,
          template_group_id: source.template_group_id,
          deposit_percentage: source.deposit_percentage,
          deposit_amount: source.deposit_amount,
          created_by: userId,
          sent_at: null,
          accepted_at: null,
          rejected_at: null,
        })
        .select()
        .single()
      if (insertError) throw insertError

      // 5. Copy quote items
      const items = (source as Record<string, unknown>).items as Array<Record<string, unknown>>
      if (items && items.length > 0) {
        const newItems: QuoteItemInsert[] = items.map((item, index) => ({
          quote_id: newQuote.id,
          equipment_item_id: item.equipment_item_id as string | null,
          name_hr: item.name_hr as string,
          name_en: item.name_en as string,
          price: item.price as number,
          item_discount: (item.item_discount as number) ?? 0,
          item_discount_type: (item.item_discount_type as string | null) ?? null,
          item_discount_value: (item.item_discount_value as number) ?? 0,
          item_type: item.item_type as string,
          sort_order: index,
          category_name_hr: item.category_name_hr as string | null,
          category_name_en: item.category_name_en as string | null,
        }))

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(newItems)
        if (itemsError) throw itemsError
      }

      // 6. Copy quote discounts
      const discounts = (source as Record<string, unknown>).discounts as Array<Record<string, unknown>>
      if (discounts && discounts.length > 0) {
        const newDiscounts: QuoteDiscountInsert[] = discounts.map((d, index) => ({
          quote_id: newQuote.id,
          discount_level: d.discount_level as string,
          discount_type: d.discount_type as string,
          value: d.value as number,
          equipment_item_id: d.equipment_item_id as string | null,
          description: d.description as string | null,
          sort_order: index,
        }))

        const { error: discountsError } = await supabase
          .from('quote_discounts')
          .insert(newDiscounts)
        if (discountsError) throw discountsError
      }

      // 7. Insert initial status history
      await supabase.from('quote_status_history').insert({
        quote_id: newQuote.id,
        new_status: 'draft',
        changed_by: userId,
      })

      return newQuote
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

interface CreateQuoteParams {
  boatId: string
  boatBasePrice: number
  clientData: ClientFormData
  selectedEquipment: EquipmentItem[]
  discounts: ConfiguratorDiscount[]
  templateGroupId: string | null
  status: 'draft' | 'sent'
  categories: EquipmentCategoryWithItems[]
}

export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateQuoteParams) => {
      const {
        boatId, boatBasePrice, clientData, selectedEquipment,
        discounts, templateGroupId, status, categories,
      } = params

      // Get current user
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id ?? null

      // Generate quote number (atomic RPC with row locking)
      const { data: quoteNumber, error: rpcError } = await supabase.rpc('generate_quote_number')
      if (rpcError) throw rpcError

      // Calculate pricing
      const breakdown = calculatePriceBreakdown(boatBasePrice, selectedEquipment, discounts)

      // Resolve company & contact — create new if needed
      let companyId = clientData.companyId ?? null
      let contactId = clientData.contactId ?? null

      if (!companyId && clientData.companyName) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: clientData.companyName,
            client_category: 'prospect',
            created_by: userId,
          })
          .select('id')
          .single()

        if (companyError) throw companyError
        companyId = newCompany.id
      }

      if (!contactId && clientData.name && companyId) {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            full_name: clientData.name,
            email: clientData.email,
            phone: clientData.phone ?? null,
            company_id: companyId,
            is_primary: true,
          })
          .select('id')
          .single()

        if (contactError) throw contactError
        contactId = newContact.id
      }

      // Insert quote
      const quoteInsert: QuoteInsert = {
        quote_number: quoteNumber,
        boat_id: boatId,
        company_id: companyId,
        contact_id: contactId,
        status,
        language: clientData.language,
        notes: clientData.notes ?? null,
        boat_base_price: boatBasePrice,
        boat_discount: breakdown.boatDiscounts,
        equipment_subtotal: breakdown.equipmentSubtotal,
        equipment_discount: breakdown.equipmentItemDiscounts + breakdown.equipmentAllDiscounts,
        total_discount: breakdown.totalDiscount,
        total_price: breakdown.grandTotal,
        template_group_id: templateGroupId,
        created_by: userId,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      }

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert(quoteInsert)
        .select()
        .single()

      if (quoteError) throw quoteError

      // Build category lookup for item snapshots
      const categoryMap = new Map(
        categories.flatMap(cat => cat.items.map(item => [item.id, cat]))
      )

      // Insert quote items (snapshot of equipment)
      if (selectedEquipment.length > 0) {
        const quoteItems: QuoteItemInsert[] = selectedEquipment.map((item, index) => {
          const itemDiscounts = discounts.filter(
            d => d.level === 'equipment_item' && d.equipmentItemId === item.id,
          )
          const itemDiscountAmount = itemDiscounts.length > 0
            ? calculateDiscountAmount(item.price, itemDiscounts)
            : 0

          // Store discount type & raw value for PDF display (single discount case)
          const singleDiscount = itemDiscounts.length === 1 ? itemDiscounts[0] : null

          return {
            quote_id: quote.id,
            equipment_item_id: item.id,
            name_hr: item.name_hr,
            name_en: item.name_en,
            price: item.price,
            item_discount: itemDiscountAmount,
            item_discount_type: singleDiscount?.type ?? (itemDiscounts.length > 1 ? 'fixed' : null),
            item_discount_value: singleDiscount?.value ?? itemDiscountAmount,
            item_type: item.is_standard ? 'equipment_standard' : 'equipment_optional',
            sort_order: index,
            category_name_hr: categoryMap.get(item.id)?.name_hr ?? null,
            category_name_en: categoryMap.get(item.id)?.name_en ?? null,
          }
        })

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)

        if (itemsError) throw itemsError
      }

      // Insert quote discounts
      if (discounts.length > 0) {
        const quoteDiscounts: QuoteDiscountInsert[] = discounts.map((d, index) => ({
          quote_id: quote.id,
          discount_level: d.level,
          discount_type: d.type,
          value: d.value,
          equipment_item_id: d.equipmentItemId ?? null,
          description: d.description ?? null,
          sort_order: index,
        }))

        const { error: discountsError } = await supabase
          .from('quote_discounts')
          .insert(quoteDiscounts)

        if (discountsError) throw discountsError
      }

      // Insert status history
      await supabase
        .from('quote_status_history')
        .insert({
          quote_id: quote.id,
          new_status: status,
          changed_by: userId,
        })

      return quote
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['template-groups', 'quote-counts'] })
    },
  })
}
