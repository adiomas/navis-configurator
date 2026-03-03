import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const

export const ResponsiveModal = ({
  open,
  onOpenChange,
  title,
  children,
  footer,
  size = 'md',
}: ResponsiveModalProps) => {
  const [visible, setVisible] = useState(open)
  const [animating, setAnimating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Sync state with prop during render (React-recommended pattern)
  if (open && !visible) {
    setVisible(true)
  }
  if (!open && animating) {
    setAnimating(false)
  }

  useEffect(() => {
    if (open) {
      const frameId = requestAnimationFrame(() => setAnimating(true))
      return () => cancelAnimationFrame(frameId)
    }
    const timer = setTimeout(() => setVisible(false), 200)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onOpenChange(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-opacity duration-200',
        animating ? 'opacity-100' : 'opacity-0'
      )}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Desktop: centered modal */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center p-4">
        <div
          ref={contentRef}
          className={cn(
            'relative w-full rounded-xl bg-white shadow-xl transition-transform duration-200',
            sizeClasses[size],
            animating ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-display text-base font-semibold text-navy">
              {title}
            </h3>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className={cn(
            'overflow-y-auto p-5',
            footer ? 'max-h-[calc(100vh-14rem)]' : 'max-h-[calc(100vh-10rem)]'
          )}>
            {children}
          </div>
          {footer && (
            <div className="flex justify-end gap-2.5 border-t border-border px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className="md:hidden absolute inset-x-0 bottom-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            'rounded-t-2xl bg-white shadow-xl transition-transform duration-200',
            animating ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          {/* Handle bar */}
          <div className="flex justify-center py-3">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
          <div className="flex items-center justify-between border-b border-border px-5 pb-4">
            <h3 className="font-display text-base font-semibold text-navy">
              {title}
            </h3>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className={cn(
            'overflow-y-auto p-5',
            footer ? 'max-h-[60vh]' : 'max-h-[70vh]'
          )}>
            {children}
          </div>
          {footer && (
            <div className="flex justify-end gap-2.5 border-t border-border px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
