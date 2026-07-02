'use client';

import { AlertTriangle, BookOpen, Search, X } from 'lucide-react';
import type { Course } from './types';
import { categories, CourseSkeleton, LearningPaths } from './constants';
import CourseCard from './CourseCard';

interface CataloguePanelProps {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  priceFilter: 'all' | 'free' | 'paid';
  setPriceFilter: (f: 'all' | 'free' | 'paid') => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  isLoading: boolean;
  error: Error | null;
  filtered: Course[];
  enrollingCourseId: string | null;
  isEnrolling: boolean;
  onSelect: (id: string) => void;
  onEnroll: (id: string) => void;
}

export default function CataloguePanel({
  searchQuery, setSearchQuery, priceFilter, setPriceFilter,
  selectedCategory, setSelectedCategory,
  isLoading, error, filtered,
  enrollingCourseId, isEnrolling,
  onSelect, onEnroll,
}: CataloguePanelProps) {
  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher une formation..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm outline-none focus:border-[#003087] transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPriceFilter('all')}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${priceFilter === 'all' ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border'}`}
          >
            Toutes
          </button>
          <button
            onClick={() => setPriceFilter('free')}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${priceFilter === 'free' ? 'bg-[#00A651] text-white' : 'bg-white text-gray-600 border'}`}
          >
            Gratuites
          </button>
          <button
            onClick={() => setPriceFilter('paid')}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${priceFilter === 'paid' ? 'bg-[#D4AF37] text-white' : 'bg-white text-gray-600 border'}`}
          >
            Payantes
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Learning Paths */}
      <LearningPaths />

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">Impossible de charger les formations</p>
          <p className="text-sm text-gray-400">{error.message}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">Aucune formation trouvée</p>
          <p className="text-sm text-gray-400">Essayez une autre catégorie ou recherche</p>
        </div>
      )}

      {/* Course Cards */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              index={i}
              enrollingCourseId={enrollingCourseId}
              isEnrolling={isEnrolling}
              onSelect={onSelect}
              onEnroll={onEnroll}
            />
          ))}
        </div>
      )}
    </>
  );
}
