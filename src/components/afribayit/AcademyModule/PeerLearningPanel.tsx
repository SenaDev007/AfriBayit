'use client';

// AfriBayit Academy — Peer Learning Panel (CDC §5.6.4)
// Groupes d'étude, projets pratiques, mentorat.

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, BookOpen, Award, Loader2, AlertCircle, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { easeOut } from './types';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  courseTitle?: string;
  isJoined: boolean;
}

interface Mentor {
  id: string;
  name: string;
  expertise: string;
  rating: number;
  menteesCount: number;
  available: boolean;
}

export default function PeerLearningPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['academy-peer-learning'],
    queryFn: async () => {
      try {
        const [groupsRes, mentorsRes] = await Promise.all([
          api.get<{ groups: StudyGroup[] }>('/academy/study-groups').catch(() => ({ groups: [] })),
          api.get<{ mentors: Mentor[] }>('/academy/mentors').catch(() => ({ mentors: [] })),
        ]);
        return { groups: groupsRes.groups ?? [], mentors: mentorsRes.mentors ?? [] };
      } catch {
        return { groups: [], mentors: [] };
      }
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary-deep" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-text">Impossible de charger les groupes d&apos;étude.</p>
      </div>
    );
  }

  const { groups, mentors } = data ?? { groups: [], mentors: [] };

  return (
    <div className="space-y-8">
      {/* Study Groups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-primary-deep flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-deep" /> Groupes d&apos;étude
          </h3>
          <button className="flex items-center gap-1 px-4 py-2 rounded-full bg-primary-green text-white text-xs font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all">
            <Plus className="w-3.5 h-3.5" /> Créer un groupe
          </button>
        </div>
        {groups.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-primary-pale shadow-lg">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-text">
              Aucun groupe d&apos;étude actif. Créez le premier pour collaborer avec d&apos;autres apprenants !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: easeOut }}
                className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale"
              >
                <h4 className="font-semibold text-sm text-primary-deep mb-1">{group.name}</h4>
                <p className="text-xs text-gray-text mb-3">{group.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {group.memberCount}/{group.maxMembers} membres
                  </span>
                  <button
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      group.isJoined
                        ? 'bg-green-50 text-green-700'
                        : 'bg-primary-green text-white hover:bg-primary-deep shadow-md'
                    }`}
                  >
                    {group.isJoined ? 'Membre' : 'Rejoindre'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Mentors */}
      <div>
        <h3 className="font-serif text-lg font-bold text-primary-deep flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-accent-yellow" /> Mentors disponibles
        </h3>
        {mentors.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-primary-pale shadow-lg">
            <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-text">
              Le programme de mentorat sera bientôt disponible. Les experts certifiés pourront accompagner votre parcours.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mentors.map((mentor, i) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: easeOut }}
                className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale text-center"
              >
                <div className="w-12 h-12 rounded-full bg-accent-yellow/15 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-accent-dark">{mentor.name.charAt(0)}</span>
                </div>
                <h4 className="font-semibold text-sm text-primary-deep">{mentor.name}</h4>
                <p className="text-xs text-gray-text mb-2">{mentor.expertise}</p>
                <div className="flex items-center justify-center gap-3 text-xs text-gray-400 mb-3">
                  <span>★ {mentor.rating}</span>
                  <span>{mentor.menteesCount} mentorés</span>
                </div>
                <button
                  disabled={!mentor.available}
                  className={`w-full py-2 rounded-full text-xs font-bold transition-all ${
                    mentor.available
                      ? 'bg-primary-green text-white hover:bg-primary-deep shadow-md'
                      : 'bg-primary-pale/60 text-gray-text cursor-not-allowed'
                  }`}
                >
                  {mentor.available ? 'Demander un mentorat' : 'Indisponible'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
