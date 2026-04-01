import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { usePartnerLogos, useAddPartnerLogo, useDeletePartnerLogo } from '@/hooks/useSettings'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export const PartnerLogosManager = () => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: logos, isLoading } = usePartnerLogos()
  const addLogo = useAddPartnerLogo()
  const deleteLogo = useDeletePartnerLogo()

  const handleFileUpload = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t('settings.invalidFileType'))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('settings.fileTooLarge'))
      return
    }
    try {
      await addLogo.mutateAsync(file)
      toast.success(t('settings.partnerLogoAdded'))
    } catch {
      toast.error(t('settings.partnerLogoError'))
    }
  }

  const handleDelete = async (logo: NonNullable<typeof logos>[number]) => {
    try {
      await deleteLogo.mutateAsync(logo)
      toast.success(t('settings.partnerLogoDeleted'))
    } catch {
      toast.error(t('settings.partnerLogoError'))
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t('settings.partnerLogosHint')}</p>

      <div className="flex flex-wrap items-center gap-3">
        {isLoading && <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
        {logos?.map((logo) => (
          <div key={logo.id} className="group relative">
            <img
              src={logo.logo_url}
              alt={logo.name}
              className="h-10 w-auto max-w-[120px] rounded border border-border/50 object-contain p-1"
            />
            <button
              type="button"
              onClick={() => handleDelete(logo)}
              disabled={deleteLogo.isPending}
              className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-red-500 p-0.5 text-white shadow-sm transition-colors hover:bg-red-600 group-hover:block"
              aria-label={t('settings.deletePartnerLogo')}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={addLogo.isPending}
          className={cn(
            ds.btn.base, ds.btn.sm, ds.btn.secondary,
            'h-10 border-dashed'
          )}
        >
          {addLogo.isPending ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {t('settings.addPartnerLogo')}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
