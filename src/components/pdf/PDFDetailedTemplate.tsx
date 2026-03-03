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
const GRAY = '#f5f5f5'
const LIGHT_GRAY = '#f9f9f9'
const MUTED = '#666666'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 40,
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
  // Section
  sectionLabel: {
    fontFamily: 'Playfair Display',
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 8,
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 4,
  },
  // Two-column
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  infoColumn: {
    flex: 1,
  },
  infoColumnLabel: {
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
    fontSize: 10,
    fontWeight: 700,
    color: NAVY,
  },
  // Specs grid
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specCategoryHeader: {
    width: '100%',
    backgroundColor: NAVY,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 6,
    marginBottom: 2,
  },
  specCategoryText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  specItem: {
    width: '50%',
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
  },
  specLabel: {
    fontSize: 8,
    color: MUTED,
    width: '50%',
  },
  specValue: {
    fontSize: 8,
    fontWeight: 700,
    color: '#333333',
    width: '50%',
  },
  // Equipment table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  categoryHeader: {
    flexDirection: 'row',
    backgroundColor: GRAY,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 4,
  },
  categoryName: {
    fontSize: 8,
    fontWeight: 700,
    color: NAVY,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
  },
  itemRowAlt: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    backgroundColor: LIGHT_GRAY,
  },
  itemName: {
    fontSize: 8,
    flex: 1,
    color: '#444444',
  },
  itemCategory: {
    fontSize: 8,
    width: 90,
    color: MUTED,
  },
  itemType: {
    fontSize: 8,
    width: 50,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 8,
    fontWeight: 700,
    width: 80,
    textAlign: 'right',
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
    padding: 12,
    marginTop: 14,
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
    fontSize: 13,
    fontWeight: 700,
    color: NAVY,
  },
  grandTotalValue: {
    fontFamily: 'Playfair Display',
    fontSize: 16,
    fontWeight: 700,
    color: GOLD,
  },
  // Terms
  termsTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 4,
    marginTop: 14,
  },
  termsText: {
    fontSize: 7,
    color: MUTED,
    lineHeight: 1.5,
  },
  // Signatures
  signatureRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 30,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 30,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 4,
  },
  signatureDateLabel: {
    fontSize: 8,
    color: MUTED,
    marginTop: 8,
  },
  signatureDateLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    marginTop: 14,
    width: '60%',
  },
  // Barcode
  barcodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 6,
    backgroundColor: GRAY,
    borderRadius: 3,
  },
  barcodeImage: {
    width: 160,
    height: 50,
  },
  qrImage: {
    width: 80,
    height: 80,
  },
  barcodeLabel: {
    fontSize: 7,
    color: MUTED,
  },
  // Footer
  companyFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    fontSize: 7,
    color: MUTED,
    marginTop: 'auto',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 35,
    fontSize: 7,
    color: MUTED,
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

  // Group specs by category
  const specsByCategory = new Map<string, BoatSpec[]>()
  if (boatSpecs) {
    for (const spec of boatSpecs) {
      const cat = spec.category ?? 'General'
      const existing = specsByCategory.get(cat) ?? []
      existing.push(spec)
      specsByCategory.set(cat, existing)
    }
  }

  const terms = lang === 'hr' ? settings.terms_hr : settings.terms_en
  const isQR = lang !== 'hr'

  return (
    <Document>
      {/* Page 1 — Header, Client, Boat, Specs */}
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

        {/* Client & Boat info */}
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoColumnLabel}>{labels.billTo}</Text>
            {company && (
              <>
                <Text style={styles.infoTextBold}>{company.name}</Text>
                {company.address && <Text style={styles.infoText}>{company.address}</Text>}
                {company.city && (
                  <Text style={styles.infoText}>
                    {[company.postal_code, company.city].filter(Boolean).join(' ')}
                  </Text>
                )}
                {company.registration_number && (
                  <Text style={styles.infoText}>OIB: {company.registration_number}</Text>
                )}
              </>
            )}
            {contact && (
              <View style={{ marginTop: 4 }}>
                <Text style={styles.infoText}>{contact.full_name}</Text>
                {contact.email && <Text style={styles.infoText}>{contact.email}</Text>}
                {contact.phone && <Text style={styles.infoText}>{contact.phone}</Text>}
              </View>
            )}
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoColumnLabel}>{labels.boatDetails}</Text>
            {boat && (
              <>
                <Text style={styles.infoTextBold}>{boat.name}</Text>
                <Text style={styles.infoText}>
                  {boat.brand}
                  {boat.year ? ` · ${boat.year}` : ''}
                </Text>
                <Text style={[styles.infoText, { color: GOLD, fontWeight: 700, marginTop: 4 }]}>
                  {labels.basePrice}: {formatPrice(Number(quote.boat_base_price ?? 0))}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Specifications */}
        {specsByCategory.size > 0 && (
          <View>
            <Text style={styles.sectionLabel}>{labels.specifications}</Text>
            <View style={styles.specsGrid}>
              {Array.from(specsByCategory.entries()).map(([category, specs]) => (
                <View key={category} style={{ width: '100%' }}>
                  <View style={styles.specCategoryHeader}>
                    <Text style={styles.specCategoryText}>{category}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {specs.map((spec) => {
                      const specLabel = lang === 'hr'
                        ? (spec.label_hr ?? spec.label_en ?? '')
                        : (spec.label_en ?? spec.label_hr ?? '')
                      return (
                        <View key={spec.id} style={styles.specItem}>
                          <Text style={styles.specLabel}>{specLabel}</Text>
                          <Text style={styles.specValue}>{spec.value ?? '—'}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${labels.page} ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 2 — Equipment, Discounts, Price, Terms, Signatures, Barcode */}
      <Page size="A4" style={styles.page}>
        {/* Equipment table */}
        <Text style={styles.sectionLabel}>{labels.optionalEquipment}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>{labels.item}</Text>
          <Text style={[styles.tableHeaderText, { width: 90 }]}>{labels.category}</Text>
          <Text style={[styles.tableHeaderText, { width: 50, textAlign: 'center' }]}>{labels.type}</Text>
          <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'right' }]}>{labels.price}</Text>
        </View>

        {Array.from(equipmentByCategory.entries()).map(([category, items]) => (
          <View key={category}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{category}</Text>
            </View>
            {items.map((item, idx) => {
              const itemName = lang === 'hr' ? item.name_hr : item.name_en
              const isStandard = item.item_type === 'equipment_standard'
              const rowStyle = idx % 2 === 0 ? styles.itemRow : styles.itemRowAlt
              return (
                <View key={item.id} style={rowStyle}>
                  <Text style={styles.itemName}>{itemName ?? '—'}</Text>
                  <Text style={styles.itemCategory}>{category}</Text>
                  <View style={{ width: 50, alignItems: 'center' }}>
                    {isStandard ? (
                      <Text style={styles.standardBadge}>{labels.standard}</Text>
                    ) : (
                      <Text style={[styles.itemType, { color: MUTED }]}>Opt.</Text>
                    )}
                  </View>
                  <Text style={styles.itemPrice}>
                    {isStandard ? '—' : formatPrice(Number(item.price ?? 0))}
                  </Text>
                </View>
              )
            })}
          </View>
        ))}

        {/* Discounts */}
        {quote.discounts.length > 0 && (
          <View style={{ marginTop: 10 }}>
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

        {/* Terms & Conditions (full text) */}
        {terms && (
          <View>
            <Text style={styles.termsTitle}>{labels.termsAndConditions}</Text>
            <Text style={styles.termsText}>{terms}</Text>
          </View>
        )}

        {/* Signature lines */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>{labels.seller}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureDateLabel}>{labels.dateLabel}:</Text>
            <View style={styles.signatureDateLine} />
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>{labels.buyer}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureDateLabel}>{labels.dateLabel}:</Text>
            <View style={styles.signatureDateLine} />
          </View>
        </View>

        {/* Payment barcode */}
        {barcodeDataUrl && (
          <View style={styles.barcodeSection}>
            <Image
              src={barcodeDataUrl}
              style={isQR ? styles.qrImage : styles.barcodeImage}
            />
            <Text style={styles.barcodeLabel}>{labels.scanToPay}</Text>
          </View>
        )}

        {/* Company footer */}
        <View style={styles.companyFooter}>
          {settings.name && <Text>{settings.name}</Text>}
          {settings.address && <Text>{settings.address}</Text>}
          {settings.phone && <Text>{settings.phone}</Text>}
          {settings.email && <Text>{settings.email}</Text>}
          {settings.website && <Text>{settings.website}</Text>}
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${labels.page} ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
