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

interface PDFLuxuryTemplateProps {
  quote: QuoteWithDetails
  settings: CompanySettings
  barcodeDataUrl?: string | null
  boatSpecs?: BoatSpec[]
}

const NAVY = '#1a1a2e'
const GOLD = '#c9a961'
const LIGHT_GOLD = '#f5f0e5'
const MUTED = '#888888'
const LIGHT_GRAY = '#f9f9f9'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 9,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    color: '#333333',
  },
  pageInner: {
    paddingHorizontal: 40,
    paddingTop: 30,
    paddingBottom: 40,
  },

  // Cover page
  goldBar: {
    height: 4,
    backgroundColor: GOLD,
    width: '100%',
  },
  coverContent: {
    paddingHorizontal: 50,
    paddingTop: 60,
    flex: 1,
  },
  boatNameLarge: {
    fontFamily: 'Playfair Display',
    fontSize: 36,
    fontWeight: 700,
    color: NAVY,
    textAlign: 'center',
    marginBottom: 8,
  },
  brandYear: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  quoteInfoRight: {
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  quoteInfoText: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 2,
  },
  clientCard: {
    backgroundColor: NAVY,
    borderRadius: 6,
    padding: 20,
    marginTop: 30,
  },
  clientCardTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 10,
    fontWeight: 700,
    color: GOLD,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  clientCardText: {
    fontSize: 10,
    color: '#ffffff',
    lineHeight: 1.6,
  },
  clientCardTextBold: {
    fontSize: 12,
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: 4,
  },
  coverFooter: {
    marginTop: 'auto',
  },

  // Details page
  sectionHeader: {
    fontFamily: 'Playfair Display',
    fontSize: 14,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 10,
    marginTop: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Specs
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  specCategoryHeader: {
    width: '100%',
    marginTop: 8,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
  },
  specCategoryText: {
    fontSize: 8,
    fontWeight: 700,
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  specCard: {
    width: '25%',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
    marginBottom: 4,
  },
  specLabel: {
    fontSize: 7,
    color: MUTED,
    marginBottom: 2,
  },
  specValue: {
    fontSize: 9,
    fontWeight: 700,
    color: '#333333',
  },

  // Equipment
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 2,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryHeader: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GOLD,
    paddingHorizontal: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
  },
  itemRowAlt: {
    flexDirection: 'row',
    paddingHorizontal: 8,
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
  itemNameStd: {
    fontSize: 8,
    flex: 1,
    color: MUTED,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 8,
    fontWeight: 700,
    width: 80,
    textAlign: 'right',
  },

  // Discount
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  discountValue: {
    fontSize: 8,
    fontWeight: 700,
    color: '#dc2626',
    textAlign: 'right',
    minWidth: 70,
  },

  // Price summary box
  priceBox: {
    backgroundColor: NAVY,
    borderRadius: 6,
    padding: 16,
    marginTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  priceLabel: {
    fontSize: 9,
    color: '#cccccc',
  },
  priceValue: {
    fontSize: 9,
    fontWeight: 700,
    color: '#ffffff',
  },
  priceDivider: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    marginVertical: 6,
  },
  grandTotalLabel: {
    fontFamily: 'Playfair Display',
    fontSize: 13,
    fontWeight: 700,
    color: '#ffffff',
  },
  grandTotalValue: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 700,
    color: GOLD,
  },

  // Terms
  termsColumns: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  termsColumn: {
    flex: 1,
  },
  termsTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 10,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 4,
    marginTop: 16,
  },
  termsText: {
    fontSize: 6,
    color: MUTED,
    lineHeight: 1.5,
  },

  // Signatures
  signatureRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 24,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 24,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    marginBottom: 4,
  },
  signatureDateLabel: {
    fontSize: 7,
    color: MUTED,
    marginTop: 8,
  },
  signatureDateLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    marginTop: 12,
    width: '60%',
  },

  // Barcode
  barcodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 8,
    backgroundColor: LIGHT_GOLD,
    borderRadius: 4,
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
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: GOLD,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    fontSize: 7,
    color: MUTED,
  },
  footerLogo: {
    width: 60,
    height: 20,
    objectFit: 'contain',
    marginTop: 6,
    alignSelf: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 40,
    fontSize: 7,
    color: MUTED,
  },
})

export function PDFLuxuryTemplate({
  quote,
  settings,
  barcodeDataUrl,
  boatSpecs,
}: PDFLuxuryTemplateProps) {
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
      {/* Page 1 — Cover */}
      <Page size="A4" style={styles.page}>
        <View style={styles.goldBar} />
        <View style={styles.coverContent}>
          {/* Logo */}
          {settings.logo_url && (
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
              <Image src={settings.logo_url} style={{ width: 140, height: 46, objectFit: 'contain' }} />
            </View>
          )}

          {/* Boat name centered */}
          <Text style={styles.boatNameLarge}>
            {boat?.name ?? '—'}
          </Text>
          <Text style={styles.brandYear}>
            {[boat?.brand, boat?.year].filter(Boolean).join(' · ')}
          </Text>

          {/* Quote info right-aligned */}
          <View style={styles.quoteInfoRight}>
            <Text style={styles.quoteInfoText}>
              {labels.quoteNumber} {quote.quote_number}
            </Text>
            <Text style={styles.quoteInfoText}>
              {labels.date}: {formatDate(quote.created_at, locale)}
            </Text>
          </View>

          {/* Client card */}
          {company && (
            <View style={styles.clientCard}>
              <Text style={styles.clientCardTitle}>{labels.billTo}</Text>
              <Text style={styles.clientCardTextBold}>{company.name}</Text>
              {contact && (
                <>
                  <Text style={styles.clientCardText}>{contact.full_name}</Text>
                  {contact.email && <Text style={styles.clientCardText}>{contact.email}</Text>}
                </>
              )}
            </View>
          )}

          <View style={styles.coverFooter}>
            <View style={styles.goldBar} />
          </View>
        </View>
      </Page>

      {/* Page 2 — Specs + Equipment + Price */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageInner}>
          {/* Specifications */}
          {specsByCategory.size > 0 && (
            <View>
              <Text style={styles.sectionHeader}>{labels.specifications}</Text>
              {Array.from(specsByCategory.entries()).map(([category, specs]) => (
                <View key={category}>
                  <View style={styles.specCategoryHeader}>
                    <Text style={styles.specCategoryText}>{category}</Text>
                  </View>
                  <View style={styles.specsGrid}>
                    {specs.map((spec) => {
                      const specLabel = lang === 'hr'
                        ? (spec.label_hr ?? spec.label_en ?? '')
                        : (spec.label_en ?? spec.label_hr ?? '')
                      return (
                        <View key={spec.id} style={styles.specCard}>
                          <Text style={styles.specLabel}>{specLabel}</Text>
                          <Text style={styles.specValue}>{spec.value ?? '—'}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Equipment */}
          <Text style={styles.sectionHeader}>{labels.optionalEquipment}</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>{labels.item}</Text>
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
                    <Text style={isStandard ? styles.itemNameStd : styles.itemName}>
                      {itemName ?? '—'}
                    </Text>
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
            <View style={{ marginTop: 8 }}>
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

          {/* Price summary box */}
          <View style={styles.priceBox}>
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
                <Text style={[styles.priceValue, { color: '#ef4444' }]}>
                  -{formatPrice(Number(quote.total_discount ?? 0))}
                </Text>
              </View>
            )}
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.grandTotalLabel}>{labels.grandTotal}</Text>
              <Text style={styles.grandTotalValue}>
                {formatPrice(Number(quote.total_price ?? 0))}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${labels.page} ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 3 — Terms, Signatures, Barcode, Footer (if terms exist) */}
      {terms && (
        <Page size="A4" style={styles.page}>
          <View style={styles.pageInner}>
            {/* Terms in 2-column layout */}
            <Text style={styles.termsTitle}>{labels.termsAndConditions}</Text>
            <View style={styles.termsColumns}>
              <View style={styles.termsColumn}>
                <Text style={styles.termsText}>
                  {terms.substring(0, Math.ceil(terms.length / 2))}
                </Text>
              </View>
              <View style={styles.termsColumn}>
                <Text style={styles.termsText}>
                  {terms.substring(Math.ceil(terms.length / 2))}
                </Text>
              </View>
            </View>

            {/* Signature blocks */}
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

            {/* Footer */}
            <View style={styles.footer}>
              {settings.name && <Text>{settings.name}</Text>}
              {settings.address && <Text>{settings.address}</Text>}
              {settings.phone && <Text>{settings.phone}</Text>}
              {settings.email && <Text>{settings.email}</Text>}
              {settings.website && <Text>{settings.website}</Text>}
            </View>
            {settings.logo_url && (
              <Image src={settings.logo_url} style={styles.footerLogo} />
            )}
          </View>

          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${labels.page} ${pageNumber} / ${totalPages}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  )
}
