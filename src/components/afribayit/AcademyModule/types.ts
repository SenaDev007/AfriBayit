export interface CourseReview {
  id?: string;
  _id?: string;
  reviewer?: { name?: string };
  user?: string;
  rating?: number;
  date?: string;
  comment?: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  instructorBio?: string;
  instructorAvatar?: string;
  rating: number;
  students: number;
  duration: string;
  price: number;
  image: string;
  level: string;
  certificate: boolean;
  description?: string;
  lessons?: number;
  /** Number of reviews (count). */
  reviews?: number;
  /** Optional list of review objects (when the API returns them). */
  reviewList?: CourseReview[];
  createdAt?: string;
  modules?: { id?: string; title: string; duration?: string; type?: string }[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  course?: Course;
}

export interface CertificateItem {
  id: string;
  courseId: string;
  courseTitle?: string;
  certificateId: string;
  issuedAt: string;
  downloadUrl?: string;
  course?: Course;
}

export interface CourseDetailDialogProps {
  courseId: string;
  onClose: () => void;
  onEnroll: (id: string) => void;
  enrollingCourseId: string | null;
  isEnrolling: boolean;
  user: { id: string } | null;
}

export const easeOut = [0.16, 1, 0.3, 1] as const;

export type AcademyTabKey = 'catalogue' | 'my_courses' | 'certifications' | 'webinars' | 'peer_learning';
