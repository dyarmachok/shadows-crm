const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function buildUrl(path: string) {
  if (!API_URL) {
    throw new ApiError('Не задано VITE_API_URL', 0)
  }

  const baseUrl = API_URL.endsWith('/') ? API_URL : `${API_URL}/`
  return new URL(path.replace(/^\//, ''), baseUrl)
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = tokenStorage.get()

  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body) headers.set('Content-Type', 'application/json')

  let res: Response

  try {
    res = await fetch(buildUrl(path), { ...init, headers })
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Не вдалося зʼєднатися із сервером', 0)
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(data?.message || `Помилка сервера (${res.status})`, res.status)
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
