export interface Property {
  id: string
  ownerId: string
  title: string
  description: string
  propertyType: 'VILLA' | 'APARTMENT' | 'HOUSE' | 'LAND' | 'COMMERCIAL' | 'OFFICE' | 'WAREHOUSE' | 'FARM' | 'RANCH'
  status: 'AVAILABLE' | 'SOLD' | 'RENTED' | 'PENDING' | 'DRAFT'
  price: number
  currency: string
  surfaceArea?: number
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number
  yearBuilt?: number
  floorNumber?: number
  totalFloors?: number
  features?: PropertyFeatures
  viewsCount: number
  favoritesCount: number
  isPremium: boolean
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
  owner?: User
  location?: PropertyLocation
  images?: PropertyImage[]
  virtualTours?: VirtualTour[]
  priceHistory?: PriceHistory[]
}

export interface PropertyLocation {
  id: string
  propertyId: string
  country: string
  city: string
  district?: string
  address: string
  latitude?: number
  longitude?: number
  postalCode?: string
  locationScore: number
  nearbyAmenities?: NearbyAmenities
}

export interface PropertyImage {
  id: string
  propertyId: string
  imageUrl: string
  thumbnailUrl?: string
  altText?: string
  isPrimary: boolean
  orderIndex: number
  createdAt: Date
}

export interface VirtualTour {
  id: string
  propertyId: string
  tourType: 'PHOTO_360' | 'MODEL_3D' | 'VIDEO' | 'AR'
  tourUrl: string
  thumbnailUrl?: string
  duration?: number
  createdAt: Date
}

export interface PriceHistory {
  id: string
  propertyId: string
  price: number
  currency: string
  changeType?: 'increase' | 'decrease' | 'stable'
  changePercent?: number
  recordedAt: Date
}

export interface PropertyFeatures {
  // Basic features
  pool?: boolean
  garden?: boolean
  balcony?: boolean
  terrace?: boolean
  parking?: boolean
  elevator?: boolean
  security?: boolean
  airConditioning?: boolean
  heating?: boolean
  internet?: boolean
  generator?: boolean
  
  // Luxury features
  jacuzzi?: boolean
  sauna?: boolean
  gym?: boolean
  cinema?: boolean
  wineCellar?: boolean
  library?: boolean
  office?: boolean
  
  // Outdoor features
  barbecue?: boolean
  outdoorKitchen?: boolean
  playground?: boolean
  tennis?: boolean
  basketball?: boolean
  
  // Smart home
  smartHome?: boolean
  homeAutomation?: boolean
  securitySystem?: boolean
  videoSurveillance?: boolean
  
  // Accessibility
  wheelchairAccess?: boolean
  groundFloor?: boolean
  elderlyFriendly?: boolean
  
  // Energy
  solarPanels?: boolean
  energyEfficient?: boolean
  doubleGlazing?: boolean
  
  // Other
  furnished?: boolean
  renovated?: boolean
  newConstruction?: boolean
  investment?: boolean
}

export interface NearbyAmenities {
  schools?: string[]
  hospitals?: string[]
  shopping?: string[]
  transport?: string[]
  offices?: string[]
  restaurants?: string[]
  banks?: string[]
  pharmacies?: string[]
  parks?: string[]
  beaches?: string[]
  airports?: string[]
  universities?: string[]
}

export interface PropertySearchFilters {
  // Location
  country?: string
  city?: string
  district?: string
  radius?: number
  
  // Property type
  propertyTypes?: string[]
  
  // Price range
  minPrice?: number
  maxPrice?: number
  currency?: string
  
  // Size
  minSurface?: number
  maxSurface?: number
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  maxBathrooms?: number
  
  // Features
  features?: string[]
  
  // Status
  status?: string[]
  
  // Other
  isPremium?: boolean
  isVerified?: boolean
  yearBuilt?: number
  hasImages?: boolean
  hasVirtualTour?: boolean
}

export interface PropertySearchResult {
  properties: Property[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  filters: PropertySearchFilters
}

export interface Favorite {
  id: string
  userId: string
  propertyId: string
  createdAt: Date
  property?: Property
}

export interface Review {
  id: string
  userId: string
  propertyId: string
  rating: number
  comment?: string
  createdAt: Date
  user?: User
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  profileType: string
  reputationScore: number
}
