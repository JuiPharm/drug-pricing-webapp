import { Item, SubclassSummaryRow } from '../types'

const API_URL = import.meta.env.VITE_API_URL as string
const API_KEY = import.meta.env.VITE_API_KEY as string

function assertEnv() {
  if (!API_URL) throw new Error('Missing VITE_API_URL')
  if (!API_KEY) throw new Error('Missing VITE_API_KEY')
}

export async function fetchItems(q: string): Promise<Item[]> {
  assertEnv()
  const url = new URL(API_URL)
  url.searchParams.set('action', 'items')
  url.searchParams.set('apiKey', API_KEY)
  if (q.trim()) url.searchParams.set('q', q.trim())
  const res = await fetch(url.toString())
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Failed to fetch items')
  return json.items as Item[]
}

export async function fetchConfig(): Promise<Record<string, unknown>> {
  assertEnv()
  const url = new URL(API_URL)
  url.searchParams.set('action', 'config')
  url.searchParams.set('apiKey', API_KEY)
  const res = await fetch(url.toString())
  return await res.json()
}

export async function fetchSummaryBySubclass(): Promise<SubclassSummaryRow[]> {
  assertEnv()
  const url = new URL(API_URL)
  url.searchParams.set('action', 'summarySubclass')
  url.searchParams.set('apiKey', API_KEY)
  const res = await fetch(url.toString())
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Failed to fetch summary')
  return json.rows as SubclassSummaryRow[]
}

export async function createItem(item: Item, updatedBy?: string) {
  assertEnv()
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createItem', apiKey: API_KEY, item, updatedBy }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Failed to create item')
  return json.item as Item
}

export async function updatePricing(item_code: string, pricing: Partial<Item>, updatedBy?: string) {
  assertEnv()
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updatePricing', apiKey: API_KEY, item_code, pricing, updatedBy }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Failed to update pricing')
  return json.item as Item
}

export async function bulkUpdatePricing(
  updates: Array<{ item_code: string; pricing: Partial<Item> }>,
  updatedBy?: string,
) {
  assertEnv()
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'bulkUpdatePricing', apiKey: API_KEY, items: updates, updatedBy }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Failed to bulk update')
  return json.updatedCount as number
}