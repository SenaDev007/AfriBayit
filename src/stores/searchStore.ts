import { create } from 'zustand';

interface SearchFilters {
  type?: string;
  transaction?: string;
  city?: string;
  country?: string;
  quartier?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
  geoTrust?: boolean;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface SearchState {
  filters: SearchFilters;
  results: unknown[];
  mapBounds: MapBounds | null;
  page: number;
  total: number;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setResults: (results: unknown[], total: number) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  setPage: (page: number) => void;
}

const defaultFilters: SearchFilters = {
  type: undefined,
  transaction: undefined,
  city: undefined,
  country: undefined,
  quartier: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  bedrooms: undefined,
  bathrooms: undefined,
  verified: undefined,
  geoTrust: undefined,
};

export const useSearchStore = create<SearchState>((set) => ({
  filters: { ...defaultFilters },
  results: [],
  mapBounds: null,
  page: 1,
  total: 0,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      page: 1,
    })),
  resetFilters: () => set({ filters: { ...defaultFilters }, page: 1 }),
  setResults: (results, total) => set({ results, total }),
  setMapBounds: (mapBounds) => set({ mapBounds }),
  setPage: (page) => set({ page }),
}));
