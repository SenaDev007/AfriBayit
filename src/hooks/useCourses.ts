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
    queryFn: () => api.get<{ courses: unknown[]; pagination: unknown }>(`/api/academy/courses?${params.toString()}`),
  });
}

export function useCourseDetail(id: string) {
  return useQuery({
    queryKey: ['course-detail', id],
    queryFn: () => api.get<{ course: unknown }>(`/api/academy/courses/${id}`),
    enabled: !!id,
  });
}

// P0-6 fix: enrollment endpoint is `/academy/courses/:id/enroll` (the JWT
// identifies the user — no `userId` in the body or query). The previous
// call hit `/academy/courses/enrollments` which doesn't exist.
export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { courseId: string; userId?: string }) =>
      apiPost(`/api/academy/courses/${data.courseId}/enroll`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

// P0-6 fix: my enrollments live under `/academy/me/enrollments`. The
// previous call hit `/academy/courses/enrollments?userId=...` which
// doesn't exist (and would have been an IDOR risk).
export function useMyEnrollments(userId?: string) {
  return useQuery({
    queryKey: ['enrollments', userId],
    queryFn: () => api.get<{ enrollments: unknown[] }>(`/api/academy/me/enrollments`),
    enabled: !!userId,
  });
}

// P0-6 fix: my certificates live under `/academy/me/certificates`.
export function useMyCertificates(userId?: string) {
  return useQuery({
    queryKey: ['certificates', userId],
    queryFn: () => api.get<{ certificates: unknown[] }>(`/api/academy/me/certificates`),
    enabled: !!userId,
  });
}

// P0-6 fix: there's no dedicated `/academy/quiz/:courseId` endpoint — the
// quiz is embedded in the course detail. We fetch `/academy/courses/:id`
// (which returns the course object directly with a `quizzes` array) and
// surface `quizzes[0]` as the active quiz.
export function useCourseQuiz(courseId: string) {
  return useQuery({
    queryKey: ['course-quiz', courseId],
    queryFn: async () => {
      const res: any = await api.get(`/api/academy/courses/${courseId}`);
      // Backend returns the course object directly; defensively unwrap
      // `course` if a future version wraps it.
      const course = res?.course ?? res;
      const quiz = Array.isArray(course?.quizzes) ? course.quizzes[0] ?? null : null;
      return { quiz, course };
    },
    enabled: !!courseId,
  });
}

// P0-6 fix: quiz attempts go to `/academy/courses/:id/quiz/attempt`.
export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { courseId: string; answers: any; score?: number }) =>
      apiPost(`/api/academy/courses/${data.courseId}/quiz/attempt`, {
        answers: data.answers,
        score: data.score,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-quiz', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });
}

// P0-6 fix: certificate generation is `/academy/courses/:id/certificate`.
export function useGenerateCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { courseId: string; userId?: string }) =>
      apiPost(`/api/academy/courses/${data.courseId}/certificate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
