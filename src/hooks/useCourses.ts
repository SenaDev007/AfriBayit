import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';
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
    queryFn: () => api.get<{ courses: unknown[]; pagination: unknown }>(`/api/courses?${params.toString()}`),
  });
}

export function useCourseDetail(id: string) {
  return useQuery({
    queryKey: ['course-detail', id],
    queryFn: () => api.get<{ course: unknown }>(`/api/courses/${id}`),
    enabled: !!id,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { courseId: string; userId: string }) =>
      apiPost('/api/courses/enrollments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useMyEnrollments(userId?: string) {
  return useQuery({
    queryKey: ['enrollments', userId],
    queryFn: () => api.get<{ enrollments: unknown[] }>(`/api/courses/enrollments?userId=${userId}`),
    enabled: !!userId,
  });
}

export function useMyCertificates(userId?: string) {
  return useQuery({
    queryKey: ['certificates', userId],
    queryFn: () => api.get<{ certificates: unknown[] }>(`/api/academy/certificates/generate?userId=${userId}`),
    enabled: !!userId,
  });
}

export function useCourseQuiz(courseId: string) {
  return useQuery({
    queryKey: ['course-quiz', courseId],
    queryFn: () => api.get<{ quiz: unknown }>(`/api/academy/quiz/${courseId}`),
    enabled: !!courseId,
  });
}
