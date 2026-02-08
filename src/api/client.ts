export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = { ok: false; status?: number; error: string }
export type ApiResponse<T> = ApiOk<T> | ApiErr

function mustGetEnv(name: string): string {
  const v = (import.meta as any).env?.[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return String(v)
}

export function getApiBase() {
  return {
    url: mustGetEnv('VITE_API_URL'),
    key: mustGetEnv('VITE_API_KEY'),
  }
}

async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`)
  }
}

export async function apiGet<T>(action: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const { url, key } = getApiBase()
  const u = new URL(url)
  u.searchParams.set('action', action)
  u.searchParams.set('apiKey', key)
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined) return
    u.searchParams.set(k, String(v))
  })
  const res = await fetch(u.toString(), { method: 'GET' })
  const json = (await parseJsonSafe(res)) as ApiResponse<T>
  if (!json || json.ok !== true) throw new Error((json as any)?.error || 'API GET error')
  return json.data
}

export async function apiPost<T>(action: string, body: Record<string, any>, updatedBy?: string): Promise<T> {
  const { url, key } = getApiBase()
  const payload = { action, apiKey: key, ...(updatedBy ? { updatedBy } : {}), ...body }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  const json = (await parseJsonSafe(res)) as ApiResponse<T>
  if (!json || json.ok !== true) throw new Error((json as any)?.error || 'API POST error')
  return json.data
}