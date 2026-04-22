import { apiGet, apiPost, apiPut } from '@/lib/api/client'

export type AuthMe = {
  id: string
  email: string
  display_name?: string | null
  role: 'admin' | 'user' | string
  is_active: boolean
  last_login_at?: string | null
}

export type AuthUser = {
  id: string
  email: string
  display_name?: string | null
  role: string
  is_active: boolean
  failed_login_count: number
  locked_until?: string | null
  last_login_at?: string | null
  created_at: string
  updated_at: string
}

export async function authMe(): Promise<AuthMe> {
  return apiGet<AuthMe>('/api/auth/me')
}

export async function sendOtp(email: string): Promise<{ ok: boolean; message: string }> {
  return apiPost('/api/auth/send-otp', { email })
}

export async function loginOtp(email: string, code: string): Promise<AuthMe> {
  return apiPost<AuthMe>('/api/auth/login-otp', { email, code })
}

export async function loginPassword(email: string, password: string): Promise<AuthMe> {
  return apiPost<AuthMe>('/api/auth/login-password', { email, password })
}

export async function resetPasswordWithOtp(email: string, code: string, newPassword: string): Promise<AuthMe> {
  return apiPost<AuthMe>('/api/auth/reset-password-otp', {
    email,
    code,
    new_password: newPassword
  })
}

export async function logout(): Promise<{ ok: boolean; message: string }> {
  return apiPost('/api/auth/logout', {})
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  return apiPost('/api/auth/me/change-password', {
    current_password: currentPassword,
    new_password: newPassword
  })
}

export async function listAuthUsers(): Promise<{ items: AuthUser[]; total: number }> {
  return apiGet('/api/auth/users')
}

export async function createAuthUser(input: {
  email: string
  displayName?: string
  role: string
  password?: string
}): Promise<AuthUser> {
  return apiPost('/api/auth/users', {
    email: input.email,
    display_name: input.displayName || null,
    role: input.role,
    password: input.password || null
  })
}

export async function setAuthUserStatus(userId: string, isActive: boolean): Promise<AuthUser> {
  return apiPut(`/api/auth/users/${encodeURIComponent(userId)}/status`, { is_active: isActive })
}

export async function resetAuthUserPassword(userId: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  return apiPut(`/api/auth/users/${encodeURIComponent(userId)}/reset-password`, { new_password: newPassword })
}
