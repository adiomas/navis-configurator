import { useEffect, useMemo, useState } from 'react'
import { X, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'

interface PDFPreviewModalProps {
  isOpen: boolean
  pdfBlob: Blob | null
  fileName: string
  onClose: () => void
  onDownload: () => void
}

export function PDFPreviewModal({
  isOpen,
  pdfBlob,
  fileName,
  onClose,
  onDownload,
}: PDFPreviewModalProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(isOpen)
  const [animating, setAnimating] = useState(false)

  const objectUrl = useMemo(() => {
    if (!pdfBlob) return null
    return URL.createObjectURL(pdfBlob)
  }, [pdfBlob])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  if (isOpen && !visible) {
    setVisible(true)
  }
  if (!isOpen && animating) {
    setAnimating(false)
  }

  useEffect(() => {
    if (isOpen) {
      const frameId = requestAnimationFrame(() => setAnimating(true))
      return () => cancelAnimationFrame(frameId)
    }
    const timer = setTimeout(() => setVisible(false), 200)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!visible || !objectUrl) return null

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className={cn(ds.btn.base, ds.btn.md, ds.btn.secondary)}
      >
        {t('common.close')}
      </button>
      <button
        type="button"
        onClick={onDownload}
        className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
      >
        <Download className="h-4 w-4" />
        {t('quotes.downloadPDF')}
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
      aria-label={fileName}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Desktop: centered modal */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center p-4">
        <div
          className={cn(
            'relative flex h-[85vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl transition-transform duration-200',
            animating ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-display text-base font-semibold text-navy">
              {t('quotes.previewPDF')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-gray-100 p-4">
            <iframe
              src={objectUrl}
              title={fileName}
              className="h-full w-full rounded-lg border border-border"
            />
          </div>
          <div className="flex justify-end gap-2.5 border-t border-border px-5 py-3">
            {footerButtons}
          </div>
        </div>
      </div>

      {/* Mobile: full-screen sheet */}
      <div
        className="md:hidden absolute inset-x-0 bottom-0 top-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            'flex h-full flex-col bg-white transition-transform duration-200',
            animating ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-display text-base font-semibold text-navy">
              {t('quotes.previewPDF')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-gray-100 p-3">
            <iframe
              src={objectUrl}
              title={fileName}
              className="h-full w-full rounded-lg border border-border"
            />
          </div>
          <div className="flex justify-end gap-2.5 border-t border-border px-5 py-3">
            {footerButtons}
          </div>
        </div>
      </div>
    </div>
  )
}
