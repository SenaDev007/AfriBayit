import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useCourses(category?: string, level?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (level) params.set('level', level);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['courses', category, level, page, limit],
    queryFn: () => apiFetch<{ courses: unknown[]; pagination: unknown }>(`/api/courses?${params.toString()}`),
  });
}
