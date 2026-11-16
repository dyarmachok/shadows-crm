import { request, toQueryString, type Paginated } from './http'

export type UserRole = 'user' | 'admin'

/** active — Tea+ діє; expired — купував, але закінчився; purchased — купував хоч раз; never — не купував */
export type TeaPlusFilter = 'active' | 'expired' | 'purchased' | 'never'

export interface AdminUser {
  id: number
  email: string
  /** Випадковий нікнейм, ніде не показується */
  username: string
  role: UserRole
  createdAt: string
  /** Tea+ діє зараз */
  teaPlus: boolean
  teaPlusUntil: string | null
  /** Лише завершені оплати */
  payments: {
    count: number
    lastPaidAt: string | null
    /** Чи була хоч одна справжня (не sandbox) оплата */
    hasLive: boolean
  }
}

export interface UsersQuery {
  teaPlus?: TeaPlusFilter
  role?: UserRole
  /** Пошук за email */
  q?: string
  page?: number
  limit?: number
}

export const usersApi = {
  list: (query: UsersQuery = {}) => request<Paginated<AdminUser>>(`/api/users?${toQueryString(query)}`),
}
