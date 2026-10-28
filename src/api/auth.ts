import { request } from './http'

export interface User {
  id: string
  email: string
  role: 'admin'
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<User>('/auth/me'),
}
