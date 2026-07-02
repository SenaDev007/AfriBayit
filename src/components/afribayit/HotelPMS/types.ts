export interface PMSDashboardData {
  hotel: { id: string; name: string; stars: number; country: string; city: string };
  today: {
    date: string;
    arrivals: { id: string; guestName: string; checkIn: string; checkOut: string; sourceChannel: string; status: string }[];
    departures: { id: string; guestName: string; checkOut: string; sourceChannel: string; status: string }[];
    arrivalCount: number;
    departureCount: number;
  };
  occupancy: { totalRooms: number; occupiedRooms: number; availableRooms: number; occupancyRate: number };
  revenue: { today: number; thisMonth: number; adr: number; revPAR: number; currency: string };
  channels: Record<string, { bookings: number; revenue: number }>;
  alerts: { type: string; message: string; severity: 'info' | 'warning' | 'error' }[];
  rooms: { id: string; type: string; name: string | null; totalRooms: number; basePrice: number; available: boolean }[];
}

export interface ReservationItem {
  id: string;
  bookingRef: string | null;
  hotelName: string;
  roomId: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
  sourceChannel: string;
  status: string;
  specialRequests: string | null;
  createdAt: string;
}

export interface RoomItem {
  id: string;
  type: string;
  name: string | null;
  capacity: number;
  totalRooms: number;
  basePrice: number;
  currency: string;
  available: boolean;
  status: string;
  channels: { ota: string; availableCount: number; rateXof: number | null; lastSyncedAt: string }[];
}

export interface RateItem {
  roomId: string;
  roomType: string;
  name: string | null;
  basePrice: number;
  currency: string;
  channelRates: { ota: string; rateXof: number | null; lastSyncedAt: string }[];
}

export interface SeasonalRate {
  id: string;
  name: string;
  period: string;
  multiplier: number;
  startDate: string | null;
  endDate: string | null;
}

export type PMSTab = 'dashboard' | 'calendar' | 'reservations' | 'rooms' | 'rates' | 'guests' | 'reports' | 'checkin' | 'invoicing' | 'cancellation' | 'lastminute';

export interface CalendarDay {
  day: number;
  dateStr: string;
  isCurrentMonth: boolean;
}

export const easeOut = [0.16, 1, 0.3, 1] as const;
