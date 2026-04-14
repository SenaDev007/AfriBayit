import { User, RegisterData, AuthResponse, LoginCredentials } from '@/types/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

class AuthService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = typeof window !== 'undefined' ?
      (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')) : null

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }))
      throw new Error(error.message || 'Une erreur est survenue')
    }

    return response.json()
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me')
  }

  async getSession(): Promise<any> {
    return this.request<any>('/auth/session')
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async refreshSession(): Promise<any> {
    return this.request<any>('/auth/refresh', {
      method: 'POST',
    })
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  async forgotPassword(email: string): Promise<void> {
    return this.request<void>('/auth/forgot-password/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async verifyResetCode(email: string, code: string): Promise<void> {
    return this.request<void>('/auth/forgot-password/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
  }

  async resendResetCode(email: string): Promise<void> {
    return this.request<void>('/auth/forgot-password/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    return this.request<void>('/auth/forgot-password/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    })
  }

  async enable2FA(): Promise<{ secret: string; qrCode: string }> {
    return this.request<{ secret: string; qrCode: string }>('/security/2fa/setup', {
      method: 'POST',
    })
  }

  async verify2FA(code: string): Promise<void> {
    return this.request<void>('/security/2fa/setup', {
      method: 'PUT',
      body: JSON.stringify({ code }),
    })
  }

  async disable2FA(): Promise<void> {
    throw new Error('Endpoint disable 2FA non implemente')
  }

  async socialLogin(provider: string, token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>(`/auth/social/${provider}`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  async verifyEmail(token: string): Promise<void> {
    return this.request<void>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  async resendVerificationEmail(): Promise<void> {
    return this.request<void>('/auth/resend-verification', {
      method: 'POST',
    })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.request<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  async deleteAccount(): Promise<void> {
    return this.request<void>('/auth/delete-account', {
      method: 'DELETE',
    })
  }

  // Utility methods
  isAuthenticated(): boolean {
    return typeof window !== 'undefined' && !!localStorage.getItem('auth_token')
  }

  getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }
}

export const authService = new AuthService()
