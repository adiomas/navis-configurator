import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Ship } from 'lucide-react'
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
          .select('*, specs:boat_specs(*), images:boat_images(*)')
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
        'group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10'
          : 'border-border/60 hover:border-border hover:shadow-lg hover:shadow-navy/5'
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {boat.hero_image_url ? (
          <img
            src={boat.hero_image_url}
            alt={boat.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Ship className="h-10 w-10 text-border" strokeWidth={1} />
          </div>
        )}

        {/* Category badge */}
        <div className="absolute right-2.5 top-2.5">
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm',
              boat.category === 'new'
                ? 'bg-success/85 text-white'
                : 'bg-warning/85 text-white'
            )}
          >
            {t(`boats.${boat.category}`)}
          </span>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute left-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Info — outside the image, clean and readable */}
      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        {/* Boat name — prominent */}
        <h3 className="font-display text-base font-semibold leading-snug text-navy transition-colors duration-200 group-hover:text-primary">
          {boat.name}
        </h3>

        {/* Brand + Year */}
        <p className="mt-1 text-xs text-muted-foreground">
          {boat.brand}
          {boat.year && <> &middot; {boat.year}</>}
        </p>

        {/* Price — gold accent with separator */}
        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2.5">
          <p className="font-display text-sm font-bold tracking-tight text-gold">
            {formatPrice(boat.base_price)}
          </p>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            EUR
          </span>
        </div>
      </div>
    </button>
  )
}
