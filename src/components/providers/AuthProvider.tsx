'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session } from '@/types/auth'
import { authService } from '@/lib/services/authService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  refreshSession: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  country: string
  profileType: 'BUYER' | 'SELLER' | 'INVESTOR' | 'TOURIST' | 'AGENT' | 'AGENCY' | 'DEVELOPER'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isInitialized && !isAuthenticating) {
      initializeAuth()
      setIsInitialized(true)
    }
  }, [isInitialized, isAuthenticating])

  const initializeAuth = async () => {
    try {
      if (typeof window !== 'undefined') {
        // Check both localStorage (remember me) and sessionStorage (session only)
        const persistentToken = localStorage.getItem('auth_token')
        const sessionToken = sessionStorage.getItem('auth_token')
        const token = persistentToken || sessionToken

        if (token) {
          try {
            const userData = await authService.getCurrentUser()
            setUser(userData)

            const sessionData = await authService.getSession()
            setSession(sessionData)
          } catch (error) {
            console.error('Token validation failed:', error)
            // Token is invalid, remove it from both storages
            localStorage.removeItem('auth_token')
            sessionStorage.removeItem('auth_token')
            setUser(null)
            setSession(null)
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_token')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    if (user) {
      console.log('User already authenticated, skipping login')
      return
    }

    try {
      setIsLoading(true)
      setIsAuthenticating(true)
      console.log('Attempting login with:', email)
      const response = await authService.login({ email, password, rememberMe })
      console.log('Login response:', response)

      if (typeof window !== 'undefined') {
        if (rememberMe) {
          // Store in localStorage for persistent login (30 days)
          localStorage.setItem('auth_token', response.token)
        } else {
          // Store in sessionStorage for session-only login (24 hours)
          sessionStorage.setItem('auth_token', response.token)
        }
      }
      setUser(response.user)
      setSession(response.session)

      console.log('User profile type:', response.user.profileType)

      // Redirect based on user type
      if (response.user.profileType === 'AGENT' || response.user.profileType === 'AGENCY') {
        console.log('Redirecting to dashboard')
        router.replace('/dashboard')
      } else {
        console.log('Redirecting to properties')
        router.replace('/properties')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      // Delay setting loading to false to prevent race condition
      setTimeout(() => {
        setIsLoading(false)
        setIsAuthenticating(false)
      }, 100)
    }
  }

  const register = async (userData: RegisterData) => {
    if (user) {
      console.log('User already authenticated, skipping registration')
      return
    }

    try {
      setIsAuthenticating(true)
      const response = await authService.register(userData)

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token)
      }
      setUser(response.user)
      setSession(response.session)

      // Wait exactly 3 seconds for smooth loading experience
      await new Promise(resolve => setTimeout(resolve, 3000))

      router.replace('/onboarding')
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_token')
      }
      setUser(null)
      setSession(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data)
      setUser(updatedUser)
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const refreshSession = async () => {
    try {
      const sessionData = await authService.refreshSession()
      setSession(sessionData)
    } catch (error) {
      console.error('Session refresh error:', error)
      logout()
    }
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshSession,
  }

  // Only show full-screen loading during initial auth check, not during login/register
  if (isLoading && !isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
