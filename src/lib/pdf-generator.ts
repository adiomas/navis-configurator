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
  termsOfPayment: string
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
  offerMadeBy: string
  net: string
  optional: string
  vesselDiscount: string
  vesselNet: string
  equipmentDiscounts: string
  equipmentNet: string
  quoteDetails: string
  paymentDetails: string
  recipient: string
  bankDetails: string
  forSeller: string
  forBuyer: string
  equipmentAndAddons: string
  callNumber: string
  authorized: string
  model: string
  deliveryTerms: string
  quantity: string
  unitPrice: string
  exclVat: string
  inclVat: string
  signatureBuyer: string
  signatureSeller: string
  customer: string
  registeredAt: string
  shareCapitalLabel: string
  directorLabel: string
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
  termsOfPayment: 'Uvjeti plaćanja',
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
  offerMadeBy: 'Ponudu izradio/la',
  net: 'Neto',
  optional: 'Opcionalno',
  vesselDiscount: 'Popust na plovilo',
  vesselNet: 'Plovilo neto',
  equipmentDiscounts: 'Popusti na opremu',
  equipmentNet: 'Oprema neto',
  quoteDetails: 'Detalji ponude',
  paymentDetails: 'Podaci za plaćanje',
  recipient: 'Primatelj',
  bankDetails: 'Bankovni podaci',
  forSeller: 'Za prodavatelja',
  forBuyer: 'Za kupca',
  equipmentAndAddons: 'Oprema i dodaci',
  callNumber: 'Poziv na broj',
  authorized: 'Ovlašteni Azimut Yachts zastupnik',
  model: 'Model',
  deliveryTerms: 'Uvjeti isporuke',
  quantity: 'Kol.',
  unitPrice: 'Cijena',
  exclVat: 'bez PDV-a',
  inclVat: 's PDV-om',
  signatureBuyer: 'Potpis kupca',
  signatureSeller: 'Potpis prodavatelja',
  customer: 'Kupac',
  registeredAt: 'Registrirano kod Trgovačkog suda u Zagrebu pod',
  shareCapitalLabel: 'Temeljni kapital uplaćen u cijelosti',
  directorLabel: 'Predsjednik Uprave',
}

const labelsEn: PdfLabels = {
  quote: 'QUOTE',
  date: 'Date',
  validUntil: 'Valid Until',
  billTo: 'Customer',
  boatDetails: 'Boat Details',
  standardEquipment: 'Standard Equipment',
  optionalEquipment: 'Optional Equipment',
  subtotal: 'Subtotal',
  discount: 'Discount',
  total: 'Total',
  termsOfPayment: 'Terms of Payment',
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
  offerMadeBy: 'Offer Made By',
  net: 'Net',
  optional: 'Optional',
  vesselDiscount: 'Vessel Discount',
  vesselNet: 'Vessel Net',
  equipmentDiscounts: 'Equipment Discounts',
  equipmentNet: 'Equipment Net',
  quoteDetails: 'Quote Details',
  paymentDetails: 'Payment Details',
  recipient: 'Recipient',
  bankDetails: 'Bank Details',
  forSeller: 'For Seller',
  forBuyer: 'For Buyer',
  equipmentAndAddons: 'Equipment & Accessories',
  callNumber: 'Reference',
  authorized: 'Authorized Azimut Yachts Dealer',
  model: 'Model',
  deliveryTerms: 'Terms of Delivery',
  quantity: 'Qty',
  unitPrice: 'Price',
  exclVat: 'excl. VAT',
  inclVat: 'incl. VAT',
  signatureBuyer: 'Signature for Buyer',
  signatureSeller: 'Signature for Seller',
  customer: 'Customer',
  registeredAt: 'Registered at the Commercial Court in Zagreb under Reg. No.',
  shareCapitalLabel: 'Share capital fully paid',
  directorLabel: 'Director',
}

/**
 * Get all PDF labels for a given language.
 * Used instead of i18n hooks since @react-pdf/renderer renders outside React DOM.
 */
export function getPdfLabels(lang: 'hr' | 'en'): PdfLabels {
  return lang === 'hr' ? labelsHr : labelsEn
}

export type { PdfLabels }
