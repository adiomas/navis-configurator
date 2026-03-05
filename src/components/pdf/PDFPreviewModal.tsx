import { useEffect, useMemo, useState } from 'react'
import { X, Download, Loader2, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface PDFPreviewModalProps {
  isOpen: boolean
  pdfBlob: Blob | null
  isGenerating: boolean
  fileName: string
  onClose: () => void
  onDownload: () => void
}

export function PDFPreviewModal({
  isOpen,
  pdfBlob,
  isGenerating,
  fileName,
  onClose,
  onDownload,
}: PDFPreviewModalProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(isOpen)
  const [animating, setAnimating] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const objectUrl = useMemo(() => {
    if (!pdfBlob) return null
    return URL.createObjectURL(pdfBlob)
  }, [pdfBlob])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  // Reset iframe loaded state when blob changes
  useEffect(() => {
    setIframeLoaded(false)
  }, [pdfBlob])

  // Animation sync
  if (isOpen && !visible) setVisible(true)
  if (!isOpen && animating) setAnimating(false)

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

  if (!visible) return null

  const showLoading = isGenerating || (!iframeLoaded && !!objectUrl)

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col transition-opacity duration-200',
        animating ? 'opacity-100' : 'opacity-0'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={fileName}
    >
      {/* Dark background */}
      <div className="absolute inset-0 bg-[#1a1a2e]/95" />

      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-[#1a1a2e] px-3 py-2.5 md:px-5 md:py-3">
        {/* Left: filename */}
        <div className="flex items-center gap-2 min-w-0 md:gap-3">
          <FileText className="h-3.5 w-3.5 shrink-0 text-white/30" />
          <span className="truncate text-xs text-white/50">{fileName}</span>
        </div>

        {/* Right: download + close */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={onDownload}
            disabled={!pdfBlob || isGenerating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 md:px-3"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('quotes.downloadPDF')}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            title={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="relative z-10 flex-1 overflow-hidden">
        {/* Loading overlay */}
        {showLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
            <div className="rounded-2xl bg-black/40 p-6 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            </div>
            <p className="text-sm font-medium text-white/40">
              {t('quotes.pdfDownloading')}
            </p>
          </div>
        )}

        {/* PDF iframe */}
        {objectUrl && (
          <div className="h-full p-2 md:p-4 lg:p-6">
            <iframe
              src={objectUrl}
              title={fileName}
              className={cn(
                'mx-auto h-full w-full rounded-lg shadow-2xl shadow-black/50 transition-opacity duration-300',
                'max-w-5xl',
                showLoading ? 'opacity-30' : 'opacity-100'
              )}
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        )}

        {/* Empty state when no blob and not generating */}
        {!objectUrl && !isGenerating && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <FileText className="h-12 w-12 text-white/20" />
            <p className="text-sm text-white/30">{t('quotes.previewPDF')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
