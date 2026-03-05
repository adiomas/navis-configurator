import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types'

interface ContactSelectorProps {
  contacts: Contact[]
  selectedContactId: string | undefined
  onSelectContact: (contact: Contact) => void
}

export const ContactSelector = ({ contacts, selectedContactId, onSelectContact }: ContactSelectorProps) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground">
        {t('configurator.selectContact')}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {contacts.map((contact) => {
          const isSelected = contact.id === selectedContactId
          return (
            <button
              key={contact.id}
              type="button"
              onClick={() => onSelectContact(contact)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-200',
                isSelected
                  ? 'border-gold/60 bg-gold/5 font-medium text-foreground shadow-sm'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50',
              )}
            >
              {contact.is_primary && (
                <Star className={cn('h-3 w-3', isSelected ? 'text-gold' : 'text-muted-foreground/50')} />
              )}
              <span>{contact.full_name}</span>
              {contact.position && (
                <span className="text-[10px] text-muted-foreground">({contact.position})</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
