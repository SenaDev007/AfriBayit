import { BookOpen, Calendar, Globe, Trophy, Users } from 'lucide-react';
import type { CommunityEvent, Group, Post } from './types';

export function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="flex gap-3">
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-3 bg-gray-100 rounded w-12" />
            <div className="h-3 bg-gray-100 rounded w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-4 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
        <div className="flex gap-3">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function eventTypeIcon(type: string | null | undefined) {
  const t = (type || '').toLowerCase();
  if (t.includes('summit')) return <Trophy className="w-5 h-5 text-[#D4AF37]" />;
  if (t.includes('networking')) return <Users className="w-5 h-5 text-[#009CDE]" />;
  if (t.includes('portes ouvertes') || t.includes('virtuel')) return <Globe className="w-5 h-5 text-[#00A651]" />;
  if (t.includes('formation')) return <BookOpen className="w-5 h-5 text-[#003087]" />;
  return <Calendar className="w-5 h-5 text-[#D4AF37]" />;
}

// ─── API response mappers ───
const toDateStr = (v: unknown): string => {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return String(v);
};

export function mapPosts(raw: Record<string, unknown>[]): Post[] {
  return raw.map(p => {
    const authorObj = p.author as Record<string, unknown> | null;
    let authorName = '';
    try {
      if (authorObj && typeof authorObj === 'object') {
        authorName = String(authorObj.name ?? '');
      } else if (typeof p.author === 'string') {
        authorName = p.author;
      }
    } catch { authorName = ''; }
    let authorAvatar = '';
    try {
      if (authorObj && typeof authorObj === 'object') {
        authorAvatar = String(authorObj.avatar ?? '');
      } else if (typeof p.avatar === 'string') {
        authorAvatar = p.avatar;
      }
    } catch { authorAvatar = ''; }
    return {
      id: String(p.id ?? ''),
      title: String(p.title ?? ''),
      author: authorName,
      avatar: authorAvatar,
      replies: Number(p.replies ?? (p._count && (p._count as Record<string, number>).replies_rel) ?? 0),
      views: Number(p.views ?? 0),
      category: String(p.category ?? ''),
      lastActivity: toDateStr(p.lastActivity || p.createdAt),
      createdAt: toDateStr(p.createdAt) || undefined,
      city: p.city != null ? String(p.city) : undefined,
      country: p.country != null ? String(p.country) : undefined,
    };
  });
}

export function mapGroups(raw: Record<string, unknown>[]): Group[] {
  return raw.map(g => ({
    id: String(g.id ?? ''),
    name: String(g.name ?? ''),
    role: String(g.type ?? ''),
    city: String(g.city ?? ''),
    score: Number(g.members ?? 0),
    avatar: String(g.coverImage ?? ''),
    skills: typeof g.type === 'string' ? [g.type] : [],
    userId: g.organizerId != null ? String(g.organizerId) : undefined,
  }));
}

export function mapEvents(raw: Record<string, unknown>[]): CommunityEvent[] {
  return raw.map(e => {
    let dateStr = '';
    try {
      const d = e.eventDate ? new Date(e.eventDate as string | Date) : null;
      if (d && !isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      }
    } catch { dateStr = ''; }
    const venue = String(e.venue ?? e.city ?? '');
    const isVirt = e.isVirtual === true || e.isVirtual === 'true';
    return {
      id: String(e.id ?? ''),
      title: String(e.title ?? ''),
      date: dateStr,
      location: venue + (isVirt ? ' (Virtuel)' : ''),
      type: String(e.eventType ?? ''),
      attendees: Number(e.maxAttendees ?? e.attendees ?? 0),
    };
  });
}

export function getUserReputationScore(user: unknown): number {
  const u = user as Record<string, unknown> & { reputationScore?: number };
  return u?.reputationScore ? Number(u.reputationScore) : 0;
}

export function getUserAfriPoints(user: unknown): number {
  const u = user as Record<string, unknown> & { afriPoints?: number };
  return u?.afriPoints ? Number(u.afriPoints) : 0;
}
