// AfriBayit — Types partagés

export interface PropertyCard {
  id: string;
  title: string;
  slug: string;
  type: string;
  listingType: string;
  status: string;
  price: number;
  currency: string;
  country: string;
  city: string;
  district?: string;
  surface?: number;
  bedrooms?: number;
  bathrooms?: number;
  hasAC?: boolean;
  hasPool?: boolean;
  hasGarage?: boolean;
  hasGarden?: boolean;
  hasBalcony?: boolean;
  hasSecurity?: boolean;
  hasGenerator?: boolean;
  hasWifi?: boolean;
  images: { url: string; alt?: string }[];
  viewCount: number;
  favoriteCount: number;
  investmentScore?: number;
  owner: {
    id: string;
    name?: string;
    image?: string;
    isPremium?: boolean;
  };
  createdAt: string;
  publishedAt?: string;
}

export interface GuesthouseCard {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string;
  district?: string;
  avgRating: number;
  totalReviews: number;
  isCertified: boolean;
  hasBreakfast: boolean;
  images: { url: string; alt?: string }[];
  rooms: { id: string; basePrice: number; currency: string }[];
}

export interface ArtisanCard {
  id: string;
  userId: string;
  businessName?: string;
  category: string;
  specialty: string[];
  country: string;
  city: string;
  avgRating: number;
  totalReviews: number;
  isCertified: boolean;
  emergencyService: boolean;
  completedJobs: number;
  dailyRate?: number;
  currency: string;
  user: {
    name?: string;
    image?: string;
  };
  images: { url: string; caption?: string }[];
}

export interface SearchFilters {
  query?: string;
  type?: string;
  listingType?: string;
  country?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minSurface?: number;
  hasPool?: boolean;
  hasAC?: boolean;
  hasGarage?: boolean;
  hasSecurity?: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  error?: string;
}
