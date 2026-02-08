import { Item, PricingResult } from '../types'

function n(v: unknown): number | null {
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

function gm(price: number, cost: number): number {
  if (price <= 0) return 0
  return ((price - cost) / price) * 100
}

export function computeFromOPD(item: Item, opdTarget: number, skgDiscountPct: number): PricingResult {
  const cost = n(item.cost) ?? 0

  const ipdFactor = n(item.ipd_factor) ?? (n(item.ipd_price) && n(item.opd_price) ? (n(item.ipd_price)! / n(item.opd_price)!) : 1)
  const skgOpdFactor = n(item.skg_opd_factor) ?? 1
  const skgIpdFactor = n(item.skg_ipd_factor) ?? 1
  const uplift = n(item.foreigner_uplift_pct) ?? 0

  const opd_price = opdTarget
  const ipd_price = opd_price * ipdFactor

  const skg_opd_price = opd_price * skgOpdFactor
  const skg_ipd_price = ipd_price * skgIpdFactor

  const opd_foreigner_price = opd_price * (1 + uplift / 100)
  const ipd_foreigner_price = ipd_price * (1 + uplift / 100)

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

export function computeFromGM(item: Item, gmTargetPct: number, skgDiscountPct: number): PricingResult {
  const cost = n(item.cost) ?? 0
  const denom = 1 - gmTargetPct / 100
  const opdTarget = denom <= 0 ? 0 : cost / denom
  return computeFromOPD(item, opdTarget, skgDiscountPct)
}