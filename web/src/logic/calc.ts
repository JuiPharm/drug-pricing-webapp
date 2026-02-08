import { Item, PricingResult } from '../types'

function n(v: unknown): number | null {
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

function gm(price: number, cost: number): number {
  if (price <= 0) return 0
  return ((price - cost) / price) * 100
}

/**
 * Business rule (ตามที่แจ้งล่าสุด):
 * - IPD = OPD * 1.2
 * - SKG OPD = OPD
 * - SKG IPD = IPD
 * - Foreigner = IPD * 1.3 (เพิ่ม 30% จากราคา IPD)
 *
 * หมายเหตุ: opd_foreigner_price และ ipd_foreigner_price จะตั้งเท่ากัน = IPD*1.3
 */
export function computeFromManualPrices(item: Item, opd_price: number, ipd_price: number, skgDiscountPct: number): PricingResult {
  const cost = n(item.cost) ?? 0

  const skg_opd_price = opd_price
  const skg_ipd_price = ipd_price

  const foreigner = ipd_price * 1.3
  const opd_foreigner_price = foreigner
  const ipd_foreigner_price = foreigner

  const skg_opd_discounted = skg_opd_price * (1 - skgDiscountPct / 100)
  const skg_ipd_discounted = skg_ipd_price * (1 - skgDiscountPct / 100)

  const profit_skg_opd_discounted = skg_opd_discounted - cost
  const profit_skg_ipd_discounted = skg_ipd_discounted - cost

  return {
    opd_price,
    ipd_price,
    skg_opd_price,
    skg_ipd_price,
    opd_foreigner_price,
    ipd_foreigner_price,

    gm_opd: gm(opd_price, cost),
    gm_ipd: gm(ipd_price, cost),
    gm_skg_opd: gm(skg_opd_price, cost),
    gm_skg_ipd: gm(skg_ipd_price, cost),
    gm_opd_foreigner: gm(opd_foreigner_price, cost),
    gm_ipd_foreigner: gm(ipd_foreigner_price, cost),

    skg_discount_pct: skgDiscountPct,
    skg_opd_discounted,
    skg_ipd_discounted,
    profit_skg_opd_discounted,
    profit_skg_ipd_discounted,

    loss_after_skg_discount_opd: profit_skg_opd_discounted < 0,
    loss_after_skg_discount_ipd: profit_skg_ipd_discounted < 0,
  }
}

export function computeFromOPD(item: Item, opdTarget: number, skgDiscountPct: number): PricingResult {
  const opd_price = opdTarget
  const ipd_price = opd_price * 1.2
  return computeFromManualPrices(item, opd_price, ipd_price, skgDiscountPct)
}

export function computeFromGM(item: Item, gmTarget: number, skgDiscountPct: number): PricingResult {
  const cost = n(item.cost) ?? 0
  const target = Math.max(0, Math.min(99.99, gmTarget))
  // gm = (p - c) / p => p = c / (1 - gm)
  const opd_price = (1 - target / 100) <= 0 ? 0 : (cost / (1 - target / 100))
  const ipd_price = opd_price * 1.2
  return computeFromManualPrices(item, opd_price, ipd_price, skgDiscountPct)
}