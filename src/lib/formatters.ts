/**
 * Format price with European conventions (dot as thousands separator)
 * Example: 12500000 → "€12.500.000"
 */
export function formatPrice(amount: number, currency = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : currency
  const formatted = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${symbol}${formatted}`
}

/**
 * Format date using locale conventions
 */
export function formatDate(dateString: string, locale = 'en-GB'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string, locale = 'en-GB'): string {
  return new Date(dateString).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}
