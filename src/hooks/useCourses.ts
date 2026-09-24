import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import type { CountryCode } from '@/contexts/CountryContext';

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT Manus (P0) — Academy catalogue 404 fix.
//
// These hooks previously targeted the OLD split-backend NestJS paths
// (`/api/academy/courses`, `/api/academy/me/...`) which DO NOT EXIST in the
// monolith — every catalogue call 404'd and the Academy showed an error
// instead of courses. They now target the real Next.js API routes:
//
//   list            → GET  /api/courses            → { courses, pagination }
//   detail          → GET  /api/courses/[id]       → course object (unwrapped)
//   enroll          → POST /api/courses/enrollments        → { data }
//   my enrollments  → GET  /api/courses/enrollments        → { data, pagination }
//   my certificates → GET  /api/academy/me/certificates    → { certificates }
//   quiz            → GET  /api/academy/quiz/[courseId]   → { quiz, totalAttempts }
//   quiz attempt    → POST /api/academy/quiz/attempt       → { attemptId, ... }
//   certificate     → POST /api/academy/certificates/generate
//
// Response shapes are adapted here so the consuming components keep their
// original contracts (`{ courses }`, `{ course }`, `{ enrollments }`, …).
// ─────────────────────────────────────────────────────────────────────────────

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
    // /api/courses/[id] returns the course object directly — wrap it to keep
    // the `{ course }` contract used by CourseDetailDialog.
    queryFn: async () => {
      const course = await api.get<Record<string, unknown>>(`/api/courses/${id}`);
      return { course };
    },
    enabled: !!id,
  });
}

// Enrollment: POST /api/courses/enrollments — the JWT identifies the user,
// only `courseId` travels in the body (no userId → no IDOR surface).
export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { courseId: string; userId?: string }) =>
      apiPost(`/api/courses/enrollments`, { courseId: data.courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

// My enrollments: GET /api/courses/enrollments → `{ data, pagination }`,
// re-exposed as `{ enrollments }` for the My Courses panel.
export function useMyEnrollments(userId?: string) {
  return useQuery({
    queryKey: ['enrollments', userId],
    queryFn: async () => {
      const res = await api.get<{ data: unknown[]; pagination: unknown }>(
        `/api/courses/enrollments?limit=50`,
      );
      return { enrollments: res.data ?? [] };
    },
    enabled: !!userId,
  });
}

// My certificates: GET /api/academy/me/certificates → `{ certificates }`.
export function useMyCertificates(userId?: string) {
  return useQuery({
    queryKey: ['certificates', userId],
    queryFn: () => api.get<{ certificates: unknown[] }>(`/api/academy/me/certificates`),
    enabled: !!userId,
  });
}

// Course quiz: GET /api/academy/quiz/[courseId] → `{ quiz, totalAttempts }`.
// Returns the same `{ quiz, course }` shape consumers expect (`course` stays
// null — the quiz payload carries everything the viewer needs).
export function useCourseQuiz(courseId: string) {
  return useQuery({
    queryKey: ['course-quiz', courseId],
    queryFn: async () => {
      const res = await api.get<{
        quiz?: Record<string, unknown> | null;
        totalAttempts?: number;
      }>(`/api/academy/quiz/${courseId}`);
      return { quiz: res.quiz ?? null, course: null };
    },
    enabled: !!courseId,
  });
}

// Quiz attempt: POST /api/academy/quiz/attempt with `{ quizId, userId,
// answers }`. The quizId is resolved from the courseId, and userId comes
// from the signed-in session (never trusted from component props).
export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (data: {
      courseId: string;
      quizId?: string;
      answers: Record<string, unknown>;
      score?: number;
    }) => {
      let quizId = data.quizId;
      if (!quizId) {
        const quizRes = await api.get<{
          quiz?: { id?: string } | null;
        }>(`/api/academy/quiz/${data.courseId}`);
        quizId = quizRes.quiz?.id;
      }
      if (!quizId) {
        throw new Error('Aucun quiz disponible pour ce cours.');
      }
      if (!user?.id) {
        throw new Error('Vous devez être connecté pour soumettre un quiz.');
      }
      return apiPost(`/api/academy/quiz/attempt`, {
        quizId,
        userId: user.id,
        answers: data.answers,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-quiz', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });
}

// Certificate generation: POST /api/academy/certificates/generate with
// `{ userId, courseId }` — the signed-in learner generates their own
// certificate (userId comes from the session store).
export function useGenerateCertificate() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: { courseId: string; userId?: string }) => {
      const userId = data.userId || user?.id;
      if (!userId) {
        throw new Error('Vous devez être connecté pour générer un certificat.');
      }
      return apiPost(`/api/academy/certificates/generate`, {
        userId,
        courseId: data.courseId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
