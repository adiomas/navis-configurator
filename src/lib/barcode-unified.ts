import QRCode from 'qrcode'
import { generateHUB3Barcode } from '@/lib/barcode'
import type { CompanySettings } from '@/types'

/**
 * Generate EPC QR code data string per EPC069-12 specification.
 * Used for SEPA payments in English-language quotes.
 */
function buildEPCData(params: {
  bic: string
  recipientName: string
  iban: string
  amount: number
  reference: string
  text: string
}): string {
  const lines = [
    'BCD',                              // Service Tag
    '002',                              // Version
    '1',                                // Encoding (UTF-8)
    'SCT',                              // Identification
    params.bic,                         // BIC
    params.recipientName,               // Beneficiary Name
    params.iban,                        // IBAN
    `EUR${params.amount.toFixed(2)}`,   // Amount
    '',                                 // Purpose (empty)
    '',                                 // Structured reference (empty)
    params.text,                        // Unstructured remittance info
  ]
  return lines.join('\n')
}

/**
 * Generate EPC QR code as base64 data URL.
 */
async function generateEPCQRCode(
  quoteNumber: string,
  totalAmount: number,
  settings: CompanySettings,
): Promise<string | null> {
  if (!settings.iban) return null

  const epcData = buildEPCData({
    bic: settings.bic ?? '',
    recipientName: settings.name ?? 'Navis Marine d.o.o.',
    iban: settings.iban,
    amount: totalAmount,
    reference: quoteNumber,
    text: `Quote ${quoteNumber}`,
  })

  try {
    const dataUrl = await QRCode.toDataURL(epcData, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 200,
    })
    return dataUrl
  } catch (err) {
    console.error('EPC QR code generation failed:', err)
    return null
  }
}

/**
 * Unified payment barcode generator.
 * - HR quotes: HUB-3 PDF417 barcode
 * - EN quotes: EPC QR code for SEPA payment
 * Returns a base64 data URL or null if IBAN is missing.
 */
export async function generatePaymentBarcode(
  quoteNumber: string,
  totalAmount: number,
  companyName: string,
  settings: CompanySettings,
  language: string,
): Promise<string | null> {
  if (!settings.iban) return null

  if (language === 'hr') {
    return generateHUB3Barcode(quoteNumber, totalAmount, companyName, settings, language)
  }

  return generateEPCQRCode(quoteNumber, totalAmount, settings)
}
