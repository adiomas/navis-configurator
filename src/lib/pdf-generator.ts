import { pdf, Font, type DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

let fontsRegistered = false

function registerFonts(): void {
  if (fontsRegistered) return

  Font.register({
    family: 'Playfair Display',
    fonts: [
      { src: '/fonts/PlayfairDisplay-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/PlayfairDisplay-Regular.ttf', fontWeight: 700 },
    ],
  })

  Font.register({
    family: 'Plus Jakarta Sans',
    fonts: [
      { src: '/fonts/PlusJakartaSans-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/PlusJakartaSans-Regular.ttf', fontWeight: 700 },
    ],
  })

  fontsRegistered = true
}

/**
 * Generate PDF blob from a React PDF document element.
 */
export async function generatePDF(document: ReactElement<DocumentProps>): Promise<Blob> {
  registerFonts()
  const blob = await pdf(document).toBlob()
  return blob
}

/**
 * Trigger browser download of a blob as a file.
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

interface PdfLabels {
  quote: string
  date: string
  validUntil: string
  billTo: string
  boatDetails: string
  standardEquipment: string
  optionalEquipment: string
  subtotal: string
  discount: string
  total: string
  termsAndConditions: string
  scanToPay: string
  basePrice: string
  equipmentTotal: string
  grandTotal: string
  standard: string
  quoteNumber: string
  specifications: string
  seller: string
  buyer: string
  signature: string
  dateLabel: string
  page: string
  item: string
  category: string
  type: string
  price: string
}

const labelsHr: PdfLabels = {
  quote: 'PONUDA',
  date: 'Datum',
  validUntil: 'Vrijedi do',
  billTo: 'Kupac',
  boatDetails: 'Detalji broda',
  standardEquipment: 'Standardna oprema',
  optionalEquipment: 'Dodatna oprema',
  subtotal: 'Međuzbroj',
  discount: 'Popust',
  total: 'Ukupno',
  termsAndConditions: 'Uvjeti poslovanja',
  scanToPay: 'Skenirajte za uplatu',
  basePrice: 'Osnovna cijena',
  equipmentTotal: 'Ukupno oprema',
  grandTotal: 'UKUPNO',
  standard: 'Std.',
  quoteNumber: 'Ponuda br.',
  specifications: 'Specifikacije',
  seller: 'Prodavatelj',
  buyer: 'Kupac',
  signature: 'Potpis',
  dateLabel: 'Datum',
  page: 'Stranica',
  item: 'Stavka',
  category: 'Kategorija',
  type: 'Tip',
  price: 'Cijena',
}

const labelsEn: PdfLabels = {
  quote: 'QUOTE',
  date: 'Date',
  validUntil: 'Valid Until',
  billTo: 'Bill To',
  boatDetails: 'Boat Details',
  standardEquipment: 'Standard Equipment',
  optionalEquipment: 'Optional Equipment',
  subtotal: 'Subtotal',
  discount: 'Discount',
  total: 'Total',
  termsAndConditions: 'Terms & Conditions',
  scanToPay: 'Scan to pay',
  basePrice: 'Base Price',
  equipmentTotal: 'Equipment Total',
  grandTotal: 'GRAND TOTAL',
  standard: 'Std.',
  quoteNumber: 'Quote #',
  specifications: 'Specifications',
  seller: 'Seller',
  buyer: 'Buyer',
  signature: 'Signature',
  dateLabel: 'Date',
  page: 'Page',
  item: 'Item',
  category: 'Category',
  type: 'Type',
  price: 'Price',
}

/**
 * Get all PDF labels for a given language.
 * Used instead of i18n hooks since @react-pdf/renderer renders outside React DOM.
 */
export function getPdfLabels(lang: 'hr' | 'en'): PdfLabels {
  return lang === 'hr' ? labelsHr : labelsEn
}

export type { PdfLabels }
