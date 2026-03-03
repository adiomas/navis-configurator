import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import type { Boat } from '@/types'

interface BoatCardProps {
  boat: Boat
  isSelected?: boolean
  onSelect?: (id: string) => void
}

export const BoatCard = ({ boat, isSelected, onSelect }: BoatCardProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const handlePrefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['boat', boat.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('boats')
          .select('*, specs:boat_specs(*), images:boat_images(*), equipment_categories(*, items:equipment_items(*))')
          .eq('id', boat.id)
          .single()
        if (error) throw error
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient, boat.id])

  return (
    <button
      type="button"
      onClick={() => onSelect?.(boat.id)}
      onMouseEnter={handlePrefetch}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'border-primary ring-1 ring-primary'
          : 'border-border'
      )}
    >
      {/* Hero image */}
      <div className="relative h-[140px] w-full overflow-hidden">
        {boat.hero_image_url ? (
          <img
            src={boat.hero_image_url}
            alt={boat.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Boat name on gradient */}
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="font-display text-sm font-semibold text-white">
            {boat.name}
          </h3>
        </div>

        {/* Category badge */}
        <div className="absolute right-2 top-2">
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              boat.category === 'new'
                ? 'bg-success/90 text-white'
                : 'bg-warning/90 text-white'
            )}
          >
            {t(`boats.${boat.category}`)}
          </span>
        </div>
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs text-muted-foreground">
          {boat.brand} &middot; {boat.year}
        </p>
        <p className="font-display text-sm font-semibold text-gold">
          {formatPrice(boat.base_price)}
        </p>
      </div>
    </button>
  )
}
