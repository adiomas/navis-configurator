import { cn } from '@/lib/utils'
import { BoatCard } from './BoatCard'
import type { Boat } from '@/types'

interface BoatGridProps {
  boats: Boat[]
  selectedBoatId?: string | null
  onSelectBoat?: (id: string) => void
  isPanelOpen?: boolean
}

export const BoatGrid = ({ boats, selectedBoatId, onSelectBoat, isPanelOpen }: BoatGridProps) => {
  return (
    <div
      className={cn(
        'grid gap-4',
        isPanelOpen
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      )}
    >
      {boats.map((boat) => (
        <BoatCard
          key={boat.id}
          boat={boat}
          isSelected={selectedBoatId === boat.id}
          onSelect={onSelectBoat}
        />
      ))}
    </div>
  )
}
