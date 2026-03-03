/**
 * Generate next quote number in format NM-YYYY-NNN
 */
export function generateQuoteNumber(lastNumber: string | null): string {
  const year = new Date().getFullYear()
  const prefix = `NM-${year}-`

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}001`
  }

  const seq = parseInt(lastNumber.slice(prefix.length), 10)
  const next = (seq + 1).toString().padStart(3, '0')
  return `${prefix}${next}`
}
