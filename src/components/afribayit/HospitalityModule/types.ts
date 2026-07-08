// P3.7-2 — Shared types for the HospitalityModule.
// API response shapes used by the hotel list, detail view, and booking dialog.

export interface RoomAvailability {
  date: string;
  status: string;
  priceOverride: number | null;
}

export interface RoomApiItem {
  id: string;
  hotelId: string;
  type: string;
  name: string | null;
  capacity: number;
  amenities: string | null;
  basePriceXof: number;
  currency: string;
  photos: string | null;
  totalRooms: number;
  available: boolean;
  availability?: RoomAvailability[];
}

export interface ReviewApiItem {
  id: string;
  overall: number;
  comment: string | null;
  cleanliness?: number;
  comfort?: number;
  location?: number;
  value?: number;
  service?: number;
  createdAt: string;
}

export interface OtaSyncLog {
  ota: string;
  status: string;
  executedAt: string;
}

export interface HotelApiItem {
  id: string;
  name: string;
  slug?: string;
  city: string;
  country: string;
  stars: number;
  rating: number;
  pricePerNight: number;
  currency: string;
  amenities: string | null;
  images: string | null;
  available: boolean;
  connectionLevel: number;
  otaRefs?: string | null;
  rooms: unknown[];
  createdAt?: string;
  _count?: { reviews_hotel?: number; rooms?: number };
}

export interface HotelDetailApiItem extends HotelApiItem {
  rooms: RoomApiItem[];
  reviews_hotel: ReviewApiItem[];
  _count: { rooms: number; bookings: number; reviews_hotel: number };
  otaSyncLogs?: OtaSyncLog[];
}

export interface HotelPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface HotelsApiResponse {
  hotels: HotelApiItem[];
  pagination?: HotelPagination;
}

export type View = 'list' | 'detail';

export interface BookingFormState {
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests: string;
}

export const DEFAULT_BOOKING_FORM: BookingFormState = {
  checkIn: '',
  checkOut: '',
  guests: 1,
  specialRequests: '',
};

export const DEFAULT_PRICE_RANGE: [number, number] = [0, 500000];
