import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { formatPrice, formatDate } from '@/lib/formatters'
import { getPdfLabels } from '@/lib/pdf-generator'
import type { QuoteWithDetails, CompanySettings, BoatSpec } from '@/types'

interface PDFDetailedTemplateProps {
  quote: QuoteWithDetails
  settings: CompanySettings
  barcodeDataUrl?: string | null
  boatSpecs?: BoatSpec[]
}

const NAVY = '#1a1a2e'
const GOLD = '#c9a961'
const DISCOUNT_RED = '#c0392b'
const TEXT_DARK = '#2a2a2a'
const TEXT_MUTED = '#666666'
const TEXT_LIGHT = '#999999'
const TEXT_SECONDARY = '#777777'
const TEXT_BODY = '#555555'
const BG_LIGHT = '#f7f8fa'
const BORDER_LIGHT = '#e8e9ec'

const s = StyleSheet.create({
  // ── Page ──
  page: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 8.5,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 36,
    color: TEXT_DARK,
  },

  // ── Top stripe ──
  stripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: NAVY,
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: NAVY,
    paddingVertical: 3.5,
    paddingHorizontal: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 6,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  footerPage: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 6.5,
    color: '#ffffff',
    letterSpacing: 0.3,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.75,
    borderBottomColor: NAVY,
  },
  logo: {
    width: 110,
    height: 36,
    objectFit: 'contain',
  },
  logoFallback: {
    fontFamily: 'Playfair Display',
    fontSize: 13,
    fontWeight: 700,
    color: NAVY,
    letterSpacing: 1.5,
  },
  logoTag: {
    fontSize: 5.5,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    color: '#999999',
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 13,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 2,
  },
  quoteNum: {
    fontSize: 8.5,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 0.5,
  },
  metaLabel: {
    fontSize: 7,
    color: TEXT_SECONDARY,
  },
  metaVal: {
    fontSize: 7,
    color: TEXT_DARK,
    fontWeight: 500,
  },

  // ── Info columns (client + contact) ──
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 5.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: TEXT_LIGHT,
    marginBottom: 3,
  },
  infoName: {
    fontFamily: 'Playfair Display',
    fontSize: 10,
    fontWeight: 500,
    color: NAVY,
    marginBottom: 1.5,
  },
  infoDetail: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    lineHeight: 1.45,
  },

  // ── Vessel block ──
  vessel: {
    backgroundColor: BG_LIGHT,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vesselLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  vesselName: {
    fontFamily: 'Playfair Display',
    fontSize: 11.5,
    fontWeight: 700,
    color: NAVY,
  },
  vesselYear: {
    fontSize: 7.5,
    color: TEXT_LIGHT,
  },
  vesselRight: {
    alignItems: 'flex-end',
  },
  priceTag: {
    fontSize: 5.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: TEXT_LIGHT,
    marginBottom: 0.5,
  },
  priceVal: {
    fontSize: 11.5,
    fontWeight: 700,
    color: NAVY,
  },

  // ── Specs ──
  specsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  specCell: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
  },
  specCellBorder: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRightWidth: 0.75,
    borderRightColor: BORDER_LIGHT,
  },
  specLbl: {
    fontSize: 5.5,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: TEXT_LIGHT,
    marginBottom: 1.5,
  },
  specVal: {
    fontSize: 9,
    fontWeight: 700,
    color: NAVY,
  },

  // ── Section divider ──
  secRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    marginTop: 2,
  },
  secText: {
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: NAVY,
  },
  secLine: {
    flex: 1,
    height: 0.75,
    backgroundColor: GOLD,
  },

  // ── Standard equipment (2-col) ──
  stdBox: {
    backgroundColor: BG_LIGHT,
    borderRadius: 2,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  stdGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  stdCol: {
    flex: 1,
  },
  stdCat: {
    fontSize: 7.5,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 1,
    marginTop: 3,
  },
  stdCatFirst: {
    fontSize: 7.5,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 1,
  },
  stdItems: {
    fontSize: 7,
    color: TEXT_BODY,
    lineHeight: 1.35,
  },

  // ── Equipment table ──
  tHead: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
    paddingBottom: 4,
    paddingTop: 2,
  },
  tHeadText: {
    fontSize: 6,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: NAVY,
  },
  catHeader: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: '#eef0f4',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_LIGHT,
  },
  catHeaderText: {
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: NAVY,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f2',
    alignItems: 'center',
  },
  colName: {
    width: '50%',
    paddingLeft: 6,
  },
  colPrice: {
    width: '18%',
    textAlign: 'right',
  },
  colDisc: {
    width: '14%',
    textAlign: 'right',
  },
  colNet: {
    width: '18%',
    textAlign: 'right',
  },
  cellName: {
    fontSize: 8,
    fontWeight: 500,
    color: TEXT_DARK,
  },
  cellPrice: {
    fontSize: 8,
    textAlign: 'right',
    color: TEXT_BODY,
  },
  cellDisc: {
    fontSize: 7.5,
    color: DISCOUNT_RED,
    textAlign: 'right',
  },
  cellNet: {
    fontSize: 8,
    fontWeight: 700,
    textAlign: 'right',
    color: TEXT_DARK,
  },

  // ── Pricing summary (full-width 3-col) ──
  pricingWrap: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 14,
    borderTopWidth: 1.5,
    borderTopColor: NAVY,
  },
  pricingCol: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: BG_LIGHT,
  },
  pricingColMid: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: BG_LIGHT,
    borderLeftWidth: 0.5,
    borderLeftColor: BORDER_LIGHT,
    borderRightWidth: 0.5,
    borderRightColor: BORDER_LIGHT,
  },
  pricingColTotal: {
    width: 145,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: NAVY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pColTitle: {
    fontSize: 5.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  pRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
  },
  pLbl: {
    fontSize: 7.5,
    color: TEXT_SECONDARY,
  },
  pVal: {
    fontSize: 7.5,
    fontWeight: 500,
    color: TEXT_DARK,
  },
  pDiscLbl: {
    fontSize: 7.5,
    color: DISCOUNT_RED,
  },
  pDiscVal: {
    fontSize: 7.5,
    fontWeight: 500,
    color: DISCOUNT_RED,
  },
  pDiv: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    marginVertical: 2,
  },
  pNetLbl: {
    fontSize: 8,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  pNetVal: {
    fontSize: 8,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  pTotalLbl: {
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: GOLD,
    marginBottom: 2,
  },
  pTotalVal: {
    fontFamily: 'Playfair Display',
    fontSize: 14,
    fontWeight: 700,
    color: '#ffffff',
  },

  // ── Notes ──
  noteText: {
    fontSize: 7.5,
    color: TEXT_BODY,
    lineHeight: 1.45,
    marginBottom: 10,
  },

  // ── Payment ──
  paySection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  payLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
  },
  payBlock: {
    flex: 1,
  },
  payTitle: {
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: NAVY,
    fontWeight: 700,
    marginBottom: 4,
  },
  payText: {
    fontSize: 7.5,
    lineHeight: 1.45,
    color: TEXT_BODY,
  },
  payBold: {
    fontSize: 7.5,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  payMono: {
    fontFamily: 'Courier',
    fontSize: 7.5,
    color: TEXT_DARK,
  },
  barcodeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
  },
  barcodeImg: {
    width: 110,
    height: 36,
  },
  qrImg: {
    width: 62,
    height: 62,
  },
  barcodeLbl: {
    fontSize: 6,
    color: TEXT_MUTED,
    marginTop: 3,
    textAlign: 'center',
  },

  // ── Terms ──
  termsWrap: {
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    marginBottom: 10,
  },
  termsTitle: {
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: NAVY,
    fontWeight: 700,
    marginBottom: 3,
  },
  termsBody: {
    fontSize: 6.5,
    color: TEXT_LIGHT,
    lineHeight: 1.45,
  },

  // ── Signatures ──
  sigRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 20,
  },
  sigCol: {
    flex: 1,
  },
  sigLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: '#cccccc',
    height: 28,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 6.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: TEXT_LIGHT,
  },
})

export function PDFDetailedTemplate({
  quote,
  settings,
  barcodeDataUrl,
  boatSpecs,
}: PDFDetailedTemplateProps) {
  const lang = (quote.language === 'hr' ? 'hr' : 'en') as 'hr' | 'en'
  const labels = getPdfLabels(lang)
  const locale = lang === 'hr' ? 'hr-HR' : 'en-GB'

  const boat = quote.boat
  const company = quote.company
  const contact = quote.contact

  const validUntilDate = new Date(quote.created_at)
  validUntilDate.setDate(validUntilDate.getDate() + 30)
  const validUntil = formatDate(validUntilDate.toISOString(), locale)

  // Separate standard vs optional equipment
  const standardByCategory = new Map<string, string[]>()
  const optionalByCategory = new Map<string, QuoteWithDetails['items']>()

  for (const item of quote.items) {
    const catName = lang === 'hr'
      ? (item.category_name_hr ?? 'Ostalo')
      : (item.category_name_en ?? 'Other')
    const itemName = lang === 'hr' ? (item.name_hr ?? '—') : (item.name_en ?? '—')
    const isStandard = item.item_type === 'equipment_standard'

    if (isStandard) {
      const existing = standardByCategory.get(catName) ?? []
      existing.push(itemName)
      standardByCategory.set(catName, existing)
    } else {
      const existing = optionalByCategory.get(catName) ?? []
      existing.push(item)
      optionalByCategory.set(catName, existing)
    }
  }

  const hasStandard = standardByCategory.size > 0
  const hasOptional = optionalByCategory.size > 0

  // Split standard categories into 2 columns for compact layout
  const stdEntries = Array.from(standardByCategory.entries())
  const stdMid = Math.ceil(stdEntries.length / 2)
  const stdCol1 = stdEntries.slice(0, stdMid)
  const stdCol2 = stdEntries.slice(stdMid)

  // Top 5 specs
  const topSpecs = boatSpecs
    ? [...boatSpecs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).slice(0, 5)
    : []

  // Pricing
  const boatBasePrice = Number(quote.boat_base_price ?? 0)
  const boatDiscountAmount = Number(quote.boat_discount ?? 0)
  const boatNet = boatBasePrice - boatDiscountAmount
  const equipmentSubtotal = Number(quote.equipment_subtotal ?? 0)
  const equipmentDiscountAmount = Number(quote.equipment_discount ?? 0)
  const equipmentNet = equipmentSubtotal - equipmentDiscountAmount
  const grandTotal = Number(quote.total_price ?? 0)

  const terms = lang === 'hr' ? settings.terms_hr : settings.terms_en
  const isQR = lang !== 'hr'

  // Footer
  const footerParts: string[] = []
  if (settings.name) footerParts.push(settings.name)
  if (settings.address) footerParts.push(settings.address)
  if (settings.oib) footerParts.push(`OIB: ${settings.oib}`)
  if (settings.iban) footerParts.push(`IBAN: ${settings.iban}`)

  // Barcode label
  const barcodeLabelText = (() => {
    const dpct = quote.deposit_percentage != null ? Number(quote.deposit_percentage) : null
    if (dpct && dpct > 0 && dpct < 100) {
      const amt = formatPrice(Number(quote.deposit_amount ?? 0))
      return lang === 'hr'
        ? `Predujam ${dpct}% — ${amt}`
        : `Advance payment ${dpct}% — ${amt}`
    }
    return labels.scanToPay
  })()

  const renderStdColumn = (entries: [string, string[]][], isFirst: boolean) => (
    <View style={s.stdCol}>
      {entries.map(([category, items], idx) => (
        <View key={category}>
          <Text style={idx === 0 && isFirst ? s.stdCatFirst : s.stdCat}>{category}</Text>
          <Text style={s.stdItems}>{items.join(', ')}</Text>
        </View>
      ))}
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.stripe} fixed />

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{footerParts.join('  \u2022  ')}</Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) =>
              `${labels.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>

        {/* Header */}
        <View style={s.header}>
          <View>
            {settings.logo_url ? (
              <Image src={settings.logo_url} style={s.logo} />
            ) : (
              <>
                <Text style={s.logoFallback}>
                  {settings.name ?? 'NAVIS MARINE'}
                </Text>
                <Text style={s.logoTag}>{labels.authorized}</Text>
              </>
            )}
          </View>
          <View style={s.headerRight}>
            <Text style={s.docTitle}>{labels.quote}</Text>
            <Text style={s.quoteNum}>{quote.quote_number}</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.date}:</Text>
              <Text style={s.metaVal}>{formatDate(quote.created_at, locale)}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.validUntil}:</Text>
              <Text style={s.metaVal}>{validUntil}</Text>
            </View>
          </View>
        </View>

        {/* Client + Contact */}
        <View style={s.infoRow}>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>{labels.billTo}</Text>
            {company && (
              <>
                <Text style={s.infoName}>{company.name}</Text>
                <Text style={s.infoDetail}>
                  {[
                    company.address,
                    [company.postal_code, company.city].filter(Boolean).join(' '),
                    company.registration_number ? `OIB: ${company.registration_number}` : null,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </Text>
              </>
            )}
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>{labels.contactPerson}</Text>
            {contact && (
              <>
                <Text style={s.infoName}>{contact.full_name}</Text>
                <Text style={s.infoDetail}>
                  {[contact.email, contact.phone].filter(Boolean).join('\n')}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Vessel bar */}
        {boat && (
          <View style={s.vessel}>
            <View style={s.vesselLeft}>
              <Text style={s.vesselName}>{boat.name}</Text>
              {boat.year && (
                <Text style={s.vesselYear}>{labels.model} {boat.year}</Text>
              )}
            </View>
            <View style={s.vesselRight}>
              <Text style={s.priceTag}>{labels.basePrice}</Text>
              <Text style={s.priceVal}>{formatPrice(boatBasePrice)}</Text>
            </View>
          </View>
        )}

        {/* Specs row */}
        {topSpecs.length > 0 && (
          <View style={s.specsRow}>
            {topSpecs.map((spec, idx) => {
              const specLabel = lang === 'hr'
                ? (spec.label_hr ?? spec.label_en ?? '')
                : (spec.label_en ?? spec.label_hr ?? '')
              const isLast = idx === topSpecs.length - 1
              return (
                <View key={spec.id} style={isLast ? s.specCell : s.specCellBorder}>
                  <Text style={s.specLbl}>{specLabel}</Text>
                  <Text style={s.specVal}>{spec.value ?? '—'}</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Standard Equipment */}
        {hasStandard && (
          <>
            <View style={s.secRow}>
              <Text style={s.secText}>{labels.standardEquipment}</Text>
              <View style={s.secLine} />
            </View>
            <View style={s.stdBox} wrap={false}>
              <View style={s.stdGrid}>
                {renderStdColumn(stdCol1, true)}
                {stdCol2.length > 0 && renderStdColumn(stdCol2, false)}
              </View>
            </View>
          </>
        )}

        {/* Optional Equipment Table */}
        {hasOptional && (
          <>
            <View style={s.secRow}>
              <Text style={s.secText}>{labels.optionalEquipment}</Text>
              <View style={s.secLine} />
            </View>

            <View style={s.tHead}>
              <Text style={[s.tHeadText, { width: '50%' }]}>{labels.item}</Text>
              <Text style={[s.tHeadText, { width: '18%', textAlign: 'right' }]}>{labels.price}</Text>
              <Text style={[s.tHeadText, { width: '14%', textAlign: 'right' }]}>{labels.discount}</Text>
              <Text style={[s.tHeadText, { width: '18%', textAlign: 'right' }]}>{labels.net}</Text>
            </View>

            {Array.from(optionalByCategory.entries()).map(([category, items]) => (
              <View key={category} wrap={false}>
                <View style={s.catHeader}>
                  <Text style={s.catHeaderText}>{category}</Text>
                </View>
                {items.map((item) => {
                  const itemName = lang === 'hr' ? item.name_hr : item.name_en
                  const itemPrice = Number(item.price ?? 0)
                  const itemDiscount = Number(item.item_discount ?? 0)
                  const netPrice = itemPrice - itemDiscount
                  const discountType = item.item_discount_type as string | null
                  const discountValue = Number(item.item_discount_value ?? 0)
                  const discountDisplay = itemDiscount > 0
                    ? discountType === 'percentage'
                      ? `-${discountValue}%`
                      : `-${formatPrice(itemDiscount)}`
                    : null
                  return (
                    <View key={item.id} style={s.row}>
                      <View style={s.colName}>
                        <Text style={s.cellName}>{itemName ?? '—'}</Text>
                      </View>
                      <View style={s.colPrice}>
                        <Text style={s.cellPrice}>{formatPrice(itemPrice)}</Text>
                      </View>
                      <View style={s.colDisc}>
                        {discountDisplay && (
                          <Text style={s.cellDisc}>{discountDisplay}</Text>
                        )}
                      </View>
                      <View style={s.colNet}>
                        <Text style={s.cellNet}>{formatPrice(netPrice)}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            ))}
          </>
        )}

        {/* Pricing Summary — 3 columns */}
        <View style={s.pricingWrap} wrap={false}>
          {/* Col 1: Boat */}
          <View style={s.pricingCol}>
            <Text style={s.pColTitle}>{labels.boatDetails}</Text>
            <View style={s.pRow}>
              <Text style={s.pLbl}>{labels.basePrice}</Text>
              <Text style={s.pVal}>{formatPrice(boatBasePrice)}</Text>
            </View>
            {boatDiscountAmount > 0 && (
              <View style={s.pRow}>
                <Text style={s.pDiscLbl}>{labels.vesselDiscount}</Text>
                <Text style={s.pDiscVal}>-{formatPrice(boatDiscountAmount)}</Text>
              </View>
            )}
            <View style={s.pDiv} />
            <View style={s.pRow}>
              <Text style={s.pNetLbl}>{labels.vesselNet}</Text>
              <Text style={s.pNetVal}>{formatPrice(boatNet)}</Text>
            </View>
          </View>

          {/* Col 2: Equipment */}
          <View style={s.pricingColMid}>
            <Text style={s.pColTitle}>{labels.equipmentAndAddons}</Text>
            <View style={s.pRow}>
              <Text style={s.pLbl}>{labels.equipmentTotal}</Text>
              <Text style={s.pVal}>{formatPrice(equipmentSubtotal)}</Text>
            </View>
            {equipmentDiscountAmount > 0 && (
              <View style={s.pRow}>
                <Text style={s.pDiscLbl}>{labels.equipmentDiscounts}</Text>
                <Text style={s.pDiscVal}>-{formatPrice(equipmentDiscountAmount)}</Text>
              </View>
            )}
            <View style={s.pDiv} />
            <View style={s.pRow}>
              <Text style={s.pNetLbl}>{labels.equipmentNet}</Text>
              <Text style={s.pNetVal}>{formatPrice(equipmentNet)}</Text>
            </View>
          </View>

          {/* Col 3: Grand Total (navy bg) */}
          <View style={s.pricingColTotal}>
            <Text style={s.pTotalLbl}>{labels.grandTotal}</Text>
            <Text style={s.pTotalVal}>{formatPrice(grandTotal)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <>
            <View style={s.secRow}>
              <Text style={s.secText}>{labels.quoteDetails}</Text>
              <View style={s.secLine} />
            </View>
            <Text style={s.noteText}>{quote.notes}</Text>
          </>
        )}

        {/* Payment + Terms + Signatures (keep together) */}
        <View wrap={false}>
          <View style={s.secRow}>
            <Text style={s.secText}>{labels.paymentDetails}</Text>
            <View style={s.secLine} />
          </View>
          <View style={s.paySection}>
            <View style={s.payLeft}>
              <View style={s.payBlock}>
                <Text style={s.payTitle}>{labels.recipient}</Text>
                {settings.name && <Text style={s.payBold}>{settings.name}</Text>}
                <Text style={s.payText}>
                  {[
                    settings.address,
                    [settings.postal_code, settings.city].filter(Boolean).join(' '),
                    settings.oib ? `OIB: ${settings.oib}` : null,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </Text>
              </View>
              <View style={s.payBlock}>
                <Text style={s.payTitle}>{labels.bankDetails}</Text>
                {settings.iban && <Text style={s.payMono}>IBAN: {settings.iban}</Text>}
                {settings.bic && <Text style={s.payMono}>BIC/SWIFT: {settings.bic}</Text>}
                {settings.bank_name && <Text style={s.payText}>{settings.bank_name}</Text>}
                <Text style={s.payText}>
                  {labels.callNumber}: {quote.quote_number}
                </Text>
              </View>
            </View>
            {barcodeDataUrl && (
              <View style={s.barcodeWrap}>
                <Image
                  src={barcodeDataUrl}
                  style={isQR ? s.qrImg : s.barcodeImg}
                />
                <Text style={s.barcodeLbl}>{barcodeLabelText}</Text>
              </View>
            )}
          </View>

          {terms && (
            <View style={s.termsWrap}>
              <Text style={s.termsTitle}>{labels.termsAndConditions}</Text>
              <Text style={s.termsBody}>{terms}</Text>
            </View>
          )}

          <View style={s.sigRow}>
            <View style={s.sigCol}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>
                {labels.forSeller} — {settings.name ?? 'Navis Marine d.o.o.'}
              </Text>
            </View>
            <View style={s.sigCol}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>
                {labels.forBuyer} — {company?.name ?? ''}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
