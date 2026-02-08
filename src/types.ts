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
  foreigner_uplift_pct?: number
  skg_opd_factor?: number
  skg_ipd_factor?: number

  updated_at?: string
  updated_by?: string
}

export type Config = {
  skg_discount_pct: number
  min_margin_pct_warning: number
  default_ipd_factor: number
  default_foreigner_uplift_pct: number
}

export type CreateItemResponse = {
  ok: true
  mode: 'create' | 'update'
  item: Item
}

export type PricingSaveRow = {
  item_code: string
  opd_price?: number
  ipd_price?: number
  skg_opd_price?: number
  skg_ipd_price?: number
  opd_foreigner_price?: number
  ipd_foreigner_price?: number
  ipd_factor?: number
  foreigner_uplift_pct?: number
  skg_opd_factor?: number
  skg_ipd_factor?: number
}

export type BulkSavePricingResponse = {
  ok: true
  updated: number
}