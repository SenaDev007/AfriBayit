import type { ReactNode } from 'react';

export interface ModuleProps {
  onNavigate?: (section: string) => void;
}

export type TabKey =
  | 'listings'
  | 'chambers'
  | 'booking'
  | 'meals'
  | 'staff'
  | 'pricing'
  | 'certification';

export interface GuesthouseListItem {
  id: string;
  name: string;
  city: string;
  country: string;
  certificationStatus: string;
  overallRating: number;
  reviewCount: number;
  images: string | null;
  rooms: GuesthouseRoomItem[];
  _count?: { bookings?: number };
}

export interface GuesthouseDetail extends GuesthouseListItem {
  ownerId: string;
  description?: string;
  quartier?: string;
  address?: string;
  amenities: string | null;
  meals: GuesthouseMealItem[];
  staff: GuesthouseStaffItem[];
  pricingRules: GuesthousePricingRuleItem[];
}

export interface GuesthouseRoomItem {
  id: string;
  name: string;
  capacity: number;
  amenities: string | null;
  basePrice: number;
  available: boolean;
}

export interface GuesthouseMealItem {
  id: string;
  mealType: string;
  price: number;
  includedInPrice: boolean;
}

export interface GuesthouseStaffItem {
  id: string;
  name: string;
  role: string;
  schedule: string | null;
}

export interface GuesthousePricingRuleItem {
  id: string;
  name: string;
  period: string;
  multiplier: number;
  startDate: string | null;
  endDate: string | null;
  event_name: string | null;
}

export interface BookingItem {
  id: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  breakfastIncluded: boolean;
}

export interface CalendarCell {
  day: number | null;
  booked: boolean;
}

export interface TabConfig {
  key: TabKey;
  label: string;
  icon: ReactNode;
}
