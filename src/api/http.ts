const TOKEN_KEY = 'token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = tokenStorage.get()

  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body) headers.set('Content-Type', 'application/json')

  const res = await fetch(`/api${path}`, { ...init, headers })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? res.statusText)
  }

  return data as T
}

export interface Paginated<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export function toQueryString(query: object) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value != null) params.set(key, String(value))
  }
  return params.toString()
}
