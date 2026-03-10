import type { ConfiguratorDiscount, EquipmentItem, PriceBreakdown } from '@/types'

/**
 * Apply a list of discounts to an amount.
 * Percentage discounts apply first, then fixed amounts.
 */
function applyDiscounts(amount: number, discounts: ConfiguratorDiscount[]): number {
  let result = amount
  const percentages = discounts.filter(d => d.type === 'percentage')
  const fixed = discounts.filter(d => d.type === 'fixed')

  for (const d of percentages) {
    result -= result * (d.value / 100)
  }
  for (const d of fixed) {
    result -= d.value
  }

  return Math.max(0, result)
}

/**
 * Calculate total discount amount from a list of discounts on a base amount.
 */
function calculateDiscountAmount(amount: number, discounts: ConfiguratorDiscount[]): number {
  return amount - applyDiscounts(amount, discounts)
}

/**
 * Calculate full price breakdown for a quote.
 * itemDiscountableMap: resolved per-item discountable flag (item.is_discountable ?? category.is_discountable ?? true)
 * Equipment-wide discounts apply ONLY to discountable items.
 * Per-item discounts apply to ALL items regardless of discountable flag.
 */
export function calculatePriceBreakdown(
  basePrice: number,
  selectedEquipment: EquipmentItem[],
  discounts: ConfiguratorDiscount[],
  itemDiscountableMap?: Map<string, boolean>,
): PriceBreakdown {
  // 1. Boat discounts
  const boatDiscounts = discounts.filter(d => d.level === 'boat_base')
  const boatDiscountAmount = calculateDiscountAmount(basePrice, boatDiscounts)
  const boatFinalPrice = basePrice - boatDiscountAmount

  // 2. Equipment with per-item discounts (apply to ALL items)
  let equipmentSubtotal = 0
  let equipmentItemDiscounts = 0

  for (const item of selectedEquipment) {
    const itemDiscounts = discounts.filter(
      d => d.level === 'equipment_item' && d.equipmentItemId === item.id,
    )
    const itemDiscount = calculateDiscountAmount(item.price, itemDiscounts)
    equipmentItemDiscounts += itemDiscount
    equipmentSubtotal += item.price
  }

  // 3. Equipment-wide discounts — apply ONLY to discountable items (after per-item discounts)
  const equipAllDiscounts = discounts.filter(d => d.level === 'equipment_all')

  let discountableAfterPerItem = 0
  let nonDiscountableAfterPerItem = 0

  for (const item of selectedEquipment) {
    const isDiscountable = itemDiscountableMap?.get(item.id) ?? true
    const itemDiscounts = discounts.filter(
      d => d.level === 'equipment_item' && d.equipmentItemId === item.id,
    )
    const itemAfterPerItem = item.price - calculateDiscountAmount(item.price, itemDiscounts)

    if (isDiscountable) {
      discountableAfterPerItem += itemAfterPerItem
    } else {
      nonDiscountableAfterPerItem += itemAfterPerItem
    }
  }

  const equipmentAllDiscountsAmount = calculateDiscountAmount(
    discountableAfterPerItem,
    equipAllDiscounts,
  )
  const equipmentFinalTotal =
    (discountableAfterPerItem - equipmentAllDiscountsAmount) + nonDiscountableAfterPerItem

  const totalDiscount = boatDiscountAmount + equipmentItemDiscounts + equipmentAllDiscountsAmount
  const grandTotal = boatFinalPrice + equipmentFinalTotal

  return {
    boatBasePrice: basePrice,
    boatDiscounts: boatDiscountAmount,
    boatFinalPrice,
    equipmentSubtotal,
    equipmentItemDiscounts,
    equipmentAllDiscounts: equipmentAllDiscountsAmount,
    equipmentFinalTotal,
    totalDiscount,
    grandTotal,
  }
}
