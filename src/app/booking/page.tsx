'use client';

import React, { useState, useMemo } from 'react';
import { useHotels, useGuesthouses } from '@/hooks/useHotels';
import { useGuesthouses as useGh } from '@/hooks/useGuesthouses';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  MapPin,
  Star,
  Users,
  Calendar,
  Hotel,
  Home,
  SlidersHorizontal,
  List,
  Filter,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';

interface HotelData {
  id: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  rating: number;
  pricePerNight: number;
  currency: string;
  amenities: string | null;
  images: string | null;
  slug: string | null;
  rooms?: unknown[];
  _count?: { reviews_hotel?: number };
}

interface GuesthouseData {
  id: string;
  name: string;
  city: string;
  country: string;
  overallRating: number;
  reviewCount: number;
  images: string | null;
  slug: string | null;
  amenities?: string | null;
  rooms: Array<{ id: string; name: string; capacity: number; basePrice: number; currency: string; amenities?: string | null }>;
  _count?: { bookings?: number };
}

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯',
  CI: '🇨🇮',
  BF: '🇧🇫',
  TG: '🇹🇬',
};

const COMMON_AMENITIES = [
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'parking', label: 'Parking' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'pool', label: 'Piscine' },
  { key: 'gym', label: 'Salle de sport' },
  { key: 'breakfast', label: 'Petit-déjeuner' },
  { key: 'ac', label: 'Climatisation' },
  { key: 'tv', label: 'Télévision' },
  { key: 'security', label: 'Sécurité' },
];

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function BookingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [propertyType, setPropertyType] = useState<'all' | 'hotel' | 'guesthouse'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(500000);
  const [minStars, setMinStars] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const effectiveCountry = selectedCountry !== 'all' ? selectedCountry : undefined;

  const { data: hotelsData, isLoading: hotelsLoading } = useHotels(undefined, effectiveCountry);
  const { data: guesthousesData, isLoading: ghLoading } = useGh(undefined, effectiveCountry);

  const hotels = (hotelsData?.hotels || []) as HotelData[];
  const guesthouses = (guesthousesData?.guesthouses || []) as GuesthouseData[];

  const allListings = useMemo(() => {
    const hotelListings = hotels.map((h) => ({
      id: h.id,
      type: 'hotel' as const,
      name: h.name,
      city: h.city,
      country: h.country,
      stars: h.stars,
      rating: h.rating,
      reviewCount: h._count?.reviews_hotel || 0,
      price: h.pricePerNight,
      currency: h.currency || 'XOF',
      amenities: h.amenities ? (typeof h.amenities === 'string' ? JSON.parse(h.amenities) : h.amenities) : [],
      image: h.images ? (typeof h.images === 'string' ? (JSON.parse(h.images) as string[])[0] : null) : null,
      slug: h.slug,
    }));

    const ghListings = guesthouses.map((g) => ({
      id: g.id,
      type: 'guesthouse' as const,
      name: g.name,
      city: g.city,
      country: g.country,
      stars: 0,
      rating: g.overallRating,
      reviewCount: g.reviewCount || 0,
      price: g.rooms?.[0]?.basePrice || 0,
      currency: g.rooms?.[0]?.currency || 'XOF',
      amenities: g.amenities ? (typeof g.amenities === 'string' ? JSON.parse(g.amenities) : g.amenities) : [],
      image: g.images ? (typeof g.images === 'string' ? (JSON.parse(g.images) as string[])[0] : null) : null,
      slug: g.slug,
    }));

    let combined = [...hotelListings, ...ghListings];

    // Filter by type
    if (propertyType !== 'all') {
      combined = combined.filter((l) => l.type === propertyType);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)
      );
    }

    // Filter by stars
    if (minStars > 0) {
      combined = combined.filter((l) => l.stars >= minStars);
    }

    // Filter by minimum rating
    if (minRating > 0) {
      combined = combined.filter((l) => l.rating >= minRating);
    }

    // Filter by price range
    combined = combined.filter((l) => l.price >= priceMin && l.price <= priceMax);

    // Filter by amenities
    if (selectedAmenities.length > 0) {
      combined = combined.filter((l) => {
        const listingAmenities = (l.amenities as string[] || []).map((a: string) => a.toLowerCase());
        return selectedAmenities.every((a) => listingAmenities.some((la: string) => la.includes(a)));
      });
    }

    return combined;
  }, [hotels, guesthouses, propertyType, searchQuery, minStars, minRating, priceMin, priceMax, selectedAmenities]);

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setPriceMin(0);
    setPriceMax(500000);
    setMinStars(0);
    setMinRating(0);
    setSelectedAmenities([]);
    setSearchQuery('');
    setSelectedCountry('all');
  };

  const activeFilterCount = [
    priceMin > 0,
    priceMax < 500000,
    minStars > 0,
    minRating > 0,
    selectedAmenities.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero search bar */}
      <div className="bg-[#003087] pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Réservation <span className="text-[#D4AF37]">en Afrique</span>
            </h1>
            <p className="text-white/70 mb-6 text-sm">
              Le Booking.com africain — Hôtels, guesthouses et séjours dans 4 pays
            </p>

            {/* Search bar */}
            <div className="bg-white rounded-2xl p-3 shadow-2xl">
              <div className="flex flex-col lg:flex-row gap-2">
                {/* Destination */}
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <Search className="w-5 h-5 text-[#003087] shrink-0" />
                  <Input
                    placeholder="Destination, ville ou hôtel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent"
                  />
                </div>

                {/* Check-in */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="text-sm text-gray-600 outline-none bg-transparent"
                  />
                </div>

                {/* Check-out */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="text-sm text-gray-600 outline-none bg-transparent"
                  />
                </div>

                {/* Guests */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="text-sm text-gray-600 bg-transparent outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="text-sm text-gray-600 bg-transparent outline-none"
                  >
                    <option value="all">Tous les pays</option>
                    {COUNTRIES_CONFIG.map((c) => (
                      <option key={c.code} value={c.code}>
                        {COUNTRY_FLAGS[c.code]} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type selector */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as 'all' | 'hotel' | 'guesthouse')}
                    className="text-sm text-gray-600 bg-transparent outline-none"
                  >
                    <option value="all">Tous types</option>
                    <option value="hotel">Hôtels</option>
                    <option value="guesthouse">Guesthouses</option>
                  </select>
                </div>

                {/* Search button */}
                <Button className="bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-xl px-6 font-semibold shrink-0">
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 shrink-0`}
          >
            <Card className="rounded-3xl card-shadow sticky top-20">
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#2C2E2F] flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtres
                  </h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[#D4AF37] hover:underline font-medium"
                    >
                      Réinitialiser ({activeFilterCount})
                    </button>
                  )}
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium text-[#2C2E2F] mb-3">Prix par nuit (FCFA)</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={priceMin || ''}
                      onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
                      placeholder="Min"
                      className="text-sm"
                    />
                    <span className="text-gray-400 text-xs">—</span>
                    <Input
                      type="number"
                      value={priceMax || ''}
                      onChange={(e) => setPriceMax(Number(e.target.value) || 500000)}
                      placeholder="Max"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Stars */}
                <div>
                  <h4 className="text-sm font-medium text-[#2C2E2F] mb-3">Étoiles</h4>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setMinStars(minStars === s ? 0 : s)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          minStars === s
                            ? 'bg-[#003087] text-white'
                            : minStars > 0 && s <= minStars
                              ? 'bg-[#003087]/10 text-[#003087]'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {s} <Star className="w-3 h-3 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minimum Rating */}
                <div>
                  <h4 className="text-sm font-medium text-[#2C2E2F] mb-3">Note minimum</h4>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 3, 3.5, 4, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          minRating === r
                            ? 'bg-[#D4AF37] text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {r === 0 ? 'Toutes' : `${r}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-sm font-medium text-[#2C2E2F] mb-3">Équipements</h4>
                  <div className="space-y-2.5">
                    {COMMON_AMENITIES.map((amenity) => (
                      <label
                        key={amenity.key}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <Checkbox
                          checked={selectedAmenities.includes(amenity.key)}
                          onCheckedChange={() => toggleAmenity(amenity.key)}
                          className="data-[state=checked]:bg-[#003087] data-[state=checked]:border-[#003087]"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-[#2C2E2F] transition-colors">
                          {amenity.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mobile close button */}
                <div className="lg:hidden">
                  <Button
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-[#003087] text-white"
                  >
                    Voir les résultats ({allListings.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filtres
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 bg-[#D4AF37] text-white text-[10px] px-1.5 py-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                <div className="text-sm text-gray-500">
                  {allListings.length} établissement{allListings.length !== 1 ? 's' : ''} trouvé{allListings.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Type tabs */}
              <div className="flex items-center gap-1">
                <Button
                  variant={propertyType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPropertyType('all')}
                  className={propertyType === 'all' ? 'bg-[#003087]' : ''}
                >
                  Tout
                </Button>
                <Button
                  variant={propertyType === 'hotel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPropertyType('hotel')}
                  className={propertyType === 'hotel' ? 'bg-[#003087]' : ''}
                >
                  <Hotel className="w-4 h-4 mr-1" /> Hôtels
                </Button>
                <Button
                  variant={propertyType === 'guesthouse' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPropertyType('guesthouse')}
                  className={propertyType === 'guesthouse' ? 'bg-[#003087]' : ''}
                >
                  <Home className="w-4 h-4 mr-1" /> Guesthouses
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {(hotelsLoading || ghLoading) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse rounded-3xl">
                    <div className="aspect-[4/3] bg-gray-200 rounded-t-3xl" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allListings.length === 0 ? (
              <Card className="p-8 text-center text-gray-400 rounded-3xl">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-lg mb-1">Aucun établissement trouvé</p>
                <p className="text-sm mb-4">Essayez de modifier vos critères de recherche</p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-[#003087] text-[#003087]"
                >
                  Réinitialiser les filtres
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {allListings.map((listing, i) => (
                  <motion.div
                    key={`${listing.type}-${listing.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5), ease: easeOut }}
                  >
                    <Link href={`/booking/${listing.id}`}>
                      <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group rounded-3xl card-shadow border-0">
                        {/* Image area */}
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-[#003087]/10 to-[#009CDE]/10 overflow-hidden">
                          {listing.image ? (
                            <img
                              src={listing.image}
                              alt={listing.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {listing.type === 'hotel' ? (
                                <Hotel className="w-12 h-12 text-[#003087]/30" />
                              ) : (
                                <Home className="w-12 h-12 text-[#003087]/30" />
                              )}
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-[#D4AF37] text-white text-xs border-0 px-2.5 py-1">
                              {listing.type === 'hotel' ? 'Hôtel' : 'Guesthouse'}
                            </Badge>
                          </div>
                          {listing.stars > 0 && (
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-[#D4AF37] flex items-center gap-0.5">
                              {Array.from({ length: listing.stars }).map((_, si) => (
                                <Star key={si} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                              ))}
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-[#2C2E2F] mb-1 group-hover:text-[#003087] transition-colors text-sm">
                            {listing.name}
                          </h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3" />
                            {listing.city}, {COUNTRY_FLAGS[listing.country] || ''} {listing.country}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div className="bg-[#003087] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                {listing.rating.toFixed(1)}
                              </div>
                              {listing.reviewCount > 0 && (
                                <span className="text-xs text-gray-400">
                                  ({listing.reviewCount} avis)
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-[#D4AF37]">
                                {listing.price.toLocaleString('fr-FR')}
                              </span>
                              <span className="text-xs text-gray-500"> FCFA/nuit</span>
                            </div>
                          </div>
                          <Button className="w-full mt-3 bg-[#D4AF37] hover:bg-[#b8961f] text-white text-sm font-semibold rounded-xl">
                            Réserver
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
