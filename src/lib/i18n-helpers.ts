interface LocalizedItem {
  name_hr?: string | null
  name_en?: string | null
}

export function getLocalizedName(item: LocalizedItem, lang: 'hr' | 'en'): string {
  return (lang === 'hr' ? item.name_hr : item.name_en) ?? item.name_hr ?? item.name_en ?? ''
}
