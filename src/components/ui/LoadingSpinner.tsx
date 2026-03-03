import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  fullScreen?: boolean
}

export default function LoadingSpinner({ fullScreen }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', fullScreen ? 'min-h-screen' : 'h-full')}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
