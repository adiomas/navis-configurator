import bwipjs from 'bwip-js'
import type { CompanySettings } from '@/types'

interface HUB3Params {
  amount: number
  senderName: string
  senderAddress: string
  recipientName: string
  recipientAddress: string
  recipientCity: string
  iban: string
  model: string
  callNumber: string
  purposeCode: string
  description: string
}

/**
 * Format HUB-3 barcode data string per FINA specification.
 * Field order: HEADER, EUR, amount, sender name, sender address, sender city,
 * recipient name, recipient address, recipient city, IBAN, model, call number,
 * purpose code, description
 */
export function generateHUB3Data(params: HUB3Params): string {
  const amountStr = params.amount.toFixed(2).replace('.', ',').padStart(15, '0')

  const lines = [
    'HRVHUB30',                    // Header
    'EUR',                         // Currency
    amountStr,                     // Amount (15 chars, comma decimal)
    params.senderName,             // Sender name
    params.senderAddress,          // Sender address
    '',                            // Sender city (empty for B2B)
    params.recipientName,          // Recipient name
    params.recipientAddress,       // Recipient address
    params.recipientCity,          // Recipient city
    params.iban,                   // Recipient IBAN
    params.model,                  // Payment model
    params.callNumber,             // Call/reference number
    params.purposeCode,            // Purpose code
    params.description,            // Description
  ]

  return lines.join('\n')
}

/**
 * Generate HUB-3 PDF417 barcode as base64 data URL.
 * Returns null for non-HR quotes.
 */
export async function generateHUB3Barcode(
  quoteNumber: string,
  totalAmount: number,
  companyName: string,
  settings: CompanySettings,
  language: string,
): Promise<string | null> {
  if (language !== 'hr') return null
  if (!settings.iban) return null

  const hub3Data = generateHUB3Data({
    amount: totalAmount,
    senderName: companyName,
    senderAddress: '',
    recipientName: settings.name ?? 'Navis Marine d.o.o.',
    recipientAddress: settings.address ?? '',
    recipientCity: [settings.postal_code, settings.city].filter(Boolean).join(' '),
    iban: settings.iban,
    model: 'HR00',
    callNumber: quoteNumber.replace(/[^0-9-]/g, ''),
    purposeCode: 'SALE',
    description: `Ponuda ${quoteNumber}`,
  })

  try {
    const canvas = bwipjs.toCanvas(document.createElement('canvas'), {
      bcid: 'pdf417',
      text: hub3Data,
      scale: 2,
      height: 20,
      width: 200,
    } as bwipjs.RenderOptions)

    return canvas.toDataURL('image/png')
  } catch (err) {
    console.error('HUB-3 barcode generation failed:', err)
    return null
  }
}
