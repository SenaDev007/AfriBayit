export interface User {
  id: string
  email: string
  phone?: string
  firstName?: string
  lastName?: string
  profileType: 'BUYER' | 'SELLER' | 'INVESTOR' | 'TOURIST' | 'AGENT' | 'AGENCY' | 'DEVELOPER'
  avatarUrl?: string
  countryCode?: string
  preferredLanguage: string
  preferredCurrency: string
  isVerified: boolean
  isPremium: boolean
  reputationScore: number
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  userId: string
  bio?: string
  investmentBudgetMin?: number
  investmentBudgetMax?: number
  preferredLocations: string[]
  propertyTypes: string[]
  onboardingCompleted: boolean
  onboardingData?: any
  preferences?: any
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  profileType: 'BUYER' | 'SELLER' | 'INVESTOR' | 'TOURIST' | 'AGENT' | 'AGENCY' | 'DEVELOPER'
  phone?: string
  countryCode?: string
}

export interface AuthResponse {
  user: User
  session: Session
  token: string
}

export interface TwoFactorAuth {
  id: string
  userId: string
  secret: string
  backupCodes: string[]
  isEnabled: boolean
  createdAt: Date
}
