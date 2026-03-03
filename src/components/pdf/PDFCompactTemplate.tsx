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
import type { QuoteWithDetails, CompanySettings } from '@/types'

interface PDFCompactTemplateProps {
  quote: QuoteWithDetails
  settings: CompanySettings
  barcodeDataUrl?: string | null
}

const NAVY = '#1a1a2e'
const GOLD = '#c9a961'
const GRAY = '#f5f5f5'
const MUTED = '#666666'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 35,
    color: '#333333',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'column',
    maxWidth: '50%',
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 22,
    fontWeight: 700,
    color: NAVY,
    letterSpacing: 2,
  },
  quoteNumber: {
    fontSize: 10,
    color: MUTED,
    marginTop: 4,
  },
  quoteDate: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },
  // Two-column info row
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  infoColumn: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: 'Playfair Display',
    fontSize: 10,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 3,
  },
  infoText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#444444',
  },
  infoTextBold: {
    fontSize: 9,
    fontWeight: 700,
    color: NAVY,
  },
  // Equipment section
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: GRAY,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 6,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 8,
    fontWeight: 700,
    color: NAVY,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
  },
  itemName: {
    fontSize: 8,
    flex: 1,
    color: '#444444',
  },
  itemPrice: {
    fontSize: 8,
    fontWeight: 700,
    textAlign: 'right',
    minWidth: 70,
  },
  standardBadge: {
    fontSize: 7,
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  // Discounts
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountValue: {
    fontSize: 8,
    fontWeight: 700,
    color: '#dc2626',
    textAlign: 'right',
    minWidth: 70,
  },
  // Price summary
  priceSummary: {
    backgroundColor: GRAY,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 10,
    marginTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  priceLabel: {
    fontSize: 9,
    color: MUTED,
  },
  priceValue: {
    fontSize: 9,
    fontWeight: 700,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontFamily: 'Playfair Display',
    fontSize: 12,
    fontWeight: 700,
    color: NAVY,
  },
  grandTotalValue: {
    fontFamily: 'Playfair Display',
    fontSize: 14,
    fontWeight: 700,
    color: GOLD,
  },
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  terms: {
    fontSize: 7,
    color: MUTED,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  termsTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 3,
  },
  barcodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    padding: 6,
    backgroundColor: GRAY,
    borderRadius: 3,
  },
  barcodeImage: {
    width: 160,
    height: 50,
  },
  barcodeLabel: {
    fontSize: 7,
    color: MUTED,
  },
  companyFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    fontSize: 7,
    color: MUTED,
  },
})

export function PDFCompactTemplate({ quote, settings, barcodeDataUrl }: PDFCompactTemplateProps) {
  const lang = (quote.language === 'hr' ? 'hr' : 'en') as 'hr' | 'en'
  const labels = getPdfLabels(lang)
  const locale = lang === 'hr' ? 'hr-HR' : 'en-GB'

  const boat = quote.boat
  const company = quote.company
  const contact = quote.contact

  // Group items by category
  const equipmentByCategory = new Map<string, QuoteWithDetails['items']>()
  for (const item of quote.items) {
    const catName = lang === 'hr'
      ? (item.category_name_hr ?? 'Ostalo')
      : (item.category_name_en ?? 'Other')
    const existing = equipmentByCategory.get(catName) ?? []
    existing.push(item)
    equipmentByCategory.set(catName, existing)
  }

  const terms = lang === 'hr' ? settings.terms_hr : settings.terms_en
  const termsLine = terms
    ? terms.length > 200 ? terms.substring(0, 200) + '...' : terms
    : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {settings.logo_url ? (
              <Image src={settings.logo_url} style={styles.logo} />
            ) : (
              <Text style={[styles.quoteTitle, { fontSize: 14 }]}>
                {settings.name ?? 'Navis Marine'}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteTitle}>{labels.quote}</Text>
            <Text style={styles.quoteNumber}>
              {labels.quoteNumber} {quote.quote_number}
            </Text>
            <Text style={styles.quoteDate}>
              {labels.date}: {formatDate(quote.created_at, locale)}
            </Text>
          </View>
        </View>

        {/* Client & Boat info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionLabel}>{labels.billTo}</Text>
            {company && (
              <>
                <Text style={styles.infoTextBold}>{company.name}</Text>
                {contact && (
                  <>
                    <Text style={styles.infoText}>{contact.full_name}</Text>
                    {contact.email && <Text style={styles.infoText}>{contact.email}</Text>}
                    {contact.phone && <Text style={styles.infoText}>{contact.phone}</Text>}
                  </>
                )}
              </>
            )}
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionLabel}>{labels.boatDetails}</Text>
            {boat && (
              <>
                <Text style={styles.infoTextBold}>{boat.name}</Text>
                <Text style={styles.infoText}>
                  {boat.brand}
                  {boat.year ? ` · ${boat.year}` : ''}
                </Text>
                <Text style={[styles.infoText, { color: GOLD, fontWeight: 700 }]}>
                  {labels.basePrice}: {formatPrice(Number(quote.boat_base_price ?? 0))}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Equipment */}
        {quote.items.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>{labels.optionalEquipment}</Text>
            {Array.from(equipmentByCategory.entries()).map(([category, items]) => (
              <View key={category}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category}</Text>
                </View>
                {items.map((item) => {
                  const itemName = lang === 'hr' ? item.name_hr : item.name_en
                  const isStandard = item.item_type === 'equipment_standard'
                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{itemName ?? '—'}</Text>
                      {isStandard ? (
                        <Text style={styles.standardBadge}>{labels.standard}</Text>
                      ) : (
                        <Text style={styles.itemPrice}>
                          {formatPrice(Number(item.price ?? 0))}
                        </Text>
                      )}
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        )}

        {/* Discounts */}
        {quote.discounts.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionLabel}>{labels.discount}</Text>
            {quote.discounts.map((d) => (
              <View key={d.id} style={styles.discountRow}>
                <Text style={styles.itemName}>
                  {d.description ?? d.discount_level}
                </Text>
                <Text style={styles.discountValue}>
                  {d.discount_type === 'percentage'
                    ? `-${Number(d.value)}%`
                    : `-${formatPrice(Number(d.value))}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Price Summary */}
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{labels.basePrice}</Text>
            <Text style={styles.priceValue}>
              {formatPrice(Number(quote.boat_base_price ?? 0))}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{labels.equipmentTotal}</Text>
            <Text style={styles.priceValue}>
              {formatPrice(Number(quote.equipment_subtotal ?? 0))}
            </Text>
          </View>
          {Number(quote.total_discount ?? 0) > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{labels.discount}</Text>
              <Text style={[styles.priceValue, { color: '#dc2626' }]}>
                -{formatPrice(Number(quote.total_discount ?? 0))}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.grandTotalLabel}>{labels.grandTotal}</Text>
            <Text style={styles.grandTotalValue}>
              {formatPrice(Number(quote.total_price ?? 0))}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Terms */}
          {termsLine && (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.termsTitle}>{labels.termsAndConditions}</Text>
              <Text style={styles.terms}>{termsLine}</Text>
            </View>
          )}

          {/* HUB-3 barcode (HR only) */}
          {barcodeDataUrl && lang === 'hr' && (
            <View style={styles.barcodeSection}>
              <Image src={barcodeDataUrl} style={styles.barcodeImage} />
              <Text style={styles.barcodeLabel}>{labels.scanToPay}</Text>
            </View>
          )}

          {/* Company info */}
          <View style={styles.companyFooter}>
            {settings.name && <Text>{settings.name}</Text>}
            {settings.address && <Text>{settings.address}</Text>}
            {settings.phone && <Text>{settings.phone}</Text>}
            {settings.email && <Text>{settings.email}</Text>}
            {settings.website && <Text>{settings.website}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  )
}
