export type Item = {
  item_code: string
  generic_name: string
  full_name: string
  dosage_form: string
  major_class: string
  sub_class: string
  cost: number

  opd_price?: number
  ipd_price?: number
  skg_opd_price?: number
  skg_ipd_price?: number
  opd_foreigner_price?: number
  ipd_foreigner_price?: number

  ipd_factor?: number
  skg_opd_factor?: number
  skg_ipd_factor?: number
  foreigner_uplift_pct?: number

  updated_at?: string
  updated_by?: string
}

export type PricingResult = {
  opd_price: number
  ipd_price: number
  skg_opd_price: number
  skg_ipd_price: number
  opd_foreigner_price: number
  ipd_foreigner_price: number

  gm_opd: number
  gm_ipd: number
  gm_skg_opd: number
  gm_skg_ipd: number
  gm_opd_foreigner: number
  gm_ipd_foreigner: number

  skg_discount_pct: number
  skg_opd_discounted: number
  skg_ipd_discounted: number
  profit_skg_opd_discounted: number
  profit_skg_ipd_discounted: number

  loss_after_skg_discount_opd: boolean
  loss_after_skg_discount_ipd: boolean
}

export type SubclassSummaryRow = {
  sub_class: string
  item_count: number
  avg_gm_opd: number | null
  avg_gm_ipd: number | null
}