import { apiGet, apiPost } from './client'
import type { Item, Config, CreateItemResponse, BulkSavePricingResponse, PricingSaveRow } from '../types'

export async function getItems(): Promise<Item[]> {
  return apiGet<Item[]>('items')
}

export async function getConfig(): Promise<Config> {
  return apiGet<Config>('config')
}

export async function createItem(item: Item, updatedBy: string): Promise<CreateItemResponse> {
  return apiPost<CreateItemResponse>('create_item', { item }, updatedBy)
}

export async function bulkSavePricing(rows: PricingSaveRow[], updatedBy: string): Promise<BulkSavePricingResponse> {
  return apiPost<BulkSavePricingResponse>('bulk_update_pricing', { rows }, updatedBy)
}

export async function bulkSaveFactors(rows: PricingSaveRow[], updatedBy: string): Promise<BulkSavePricingResponse> {
  return apiPost<BulkSavePricingResponse>('bulk_update_factors', { rows }, updatedBy)
}