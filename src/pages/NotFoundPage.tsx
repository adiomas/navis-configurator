import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileQuestion } from 'lucide-react'

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-display text-6xl font-bold text-navy/20">404</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-navy">
          {t('common.pageNotFound')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('common.pageNotFoundDesc')}
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          {t('common.goHome')}
        </Link>
      </div>
    </div>
  )
}
