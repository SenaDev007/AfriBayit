// Shared types for PropertyDetail module

export interface PropertyDetailProps {
  propertyId: string;
  onBack: () => void;
  onNavigate: (section: string) => void;
}

export interface ReviewData {
  id: string;
  reviewerId: string;
  targetId: string;
  targetType: string;
  rating: number;
  comment: string | null;
  verified: boolean;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface ReviewsResponse {
  reviews: ReviewData[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface VirtualTourData {
  id: string;
  tourType: string;
  url: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
}

export interface VirtualToursResponse {
  data: {
    propertyId: string;
    hasVR: boolean;
    hasDroneView: boolean;
    tours: VirtualTourData[];
  };
}

// Re-export the property type from afribayit-utils for convenience
export type { PropertyData } from '@/lib/afribayit-utils';

export const easeOut = [0.16, 1, 0.3, 1] as const;
