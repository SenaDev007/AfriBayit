import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { CountryCode } from '@/contexts/CountryContext';

export function useCourses(category?: string, level?: string, country?: CountryCode, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (level) params.set('level', level);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['courses', category, level, country, page, limit],
    queryFn: () => apiFetch<{ courses: unknown[]; pagination: unknown }>(`/api/courses?${params.toString()}`),
  });
}
