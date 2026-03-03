import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const [visible, setVisible] = useState(isOpen)
  const [animating, setAnimating] = useState(false)

  if (isOpen && !visible) {
    setVisible(true)
  }
  if (!isOpen && animating) {
    setAnimating(false)
  }

  useEffect(() => {
    if (isOpen) {
      confirmRef.current?.focus()
      const frameId = requestAnimationFrame(() => setAnimating(true))
      return () => cancelAnimationFrame(frameId)
    }
    const timer = setTimeout(() => setVisible(false), 200)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!visible) return null

  const buttons = (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary, 'disabled:opacity-50')}
      >
        {cancelText}
      </button>
      <button
        ref={confirmRef}
        type="button"
        onClick={onConfirm}
        disabled={isLoading}
        className={cn(
          ds.btn.base, ds.btn.sm,
          'text-white disabled:opacity-50',
          isDangerous
            ? ds.btn.danger
            : 'bg-navy hover:bg-navy-light'
        )}
      >
        {isLoading ? '...' : confirmText}
      </button>
    </>
  )

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
        onClick={onCancel}
      />

      {/* Desktop: centered dialog */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full max-w-sm rounded-xl bg-white shadow-xl transition-transform duration-200',
            animating ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={ds.modal.header}>
            <div>
              <h3 className={ds.modal.title}>{title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className={ds.modal.footer}>
            {buttons}
          </div>
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
          <div className="flex justify-center py-3">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
          <div className="px-5 pb-2">
            <h3 className={ds.modal.title}>{title}</h3>
            <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex justify-end gap-2.5 px-5 pb-5 pt-3">
            {buttons}
          </div>
        </div>
      </div>
    </div>
  )
}
