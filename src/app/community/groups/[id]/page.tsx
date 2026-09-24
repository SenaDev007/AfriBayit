'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, MapPin, Landmark, Lock, Globe,
  UserPlus, AlertTriangle, Loader2, Crown, ShieldCheck,
} from 'lucide-react';
import { useCommunityGroup, useCommunityGroupMembers, useJoinGroup } from '@/hooks/useCommunity';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

const easeOut = [0.16, 1, 0.3, 1] as const;

const TYPE_LABELS: Record<string, string> = {
  investisseurs: 'Investisseurs',
  agents: 'Agents',
  artisans: 'Artisans',
  ville: 'Par ville',
  pays: 'Par pays',
  theme: 'Thématique',
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user } = useAuthStore();

  const { data: groupData, isLoading: groupLoading, error: groupError } = useCommunityGroup(groupId);
  const { data: membersData, isLoading: membersLoading } = useCommunityGroupMembers(groupId);
  const joinGroup = useJoinGroup(groupId);

  const [joining, setJoining] = useState(false);

  const group = groupData?.data as Record<string, unknown> | undefined;
  const members = (membersData?.data as Record<string, unknown>[]) || [];
  const membershipCount = group?._count && typeof group._count === 'object'
    ? (group._count as Record<string, number>).memberships || 0
    : Number(group?.members || 0);

  const handleJoin = () => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour rejoindre ce groupe.' });
      return;
    }
    setJoining(true);
    joinGroup.mutate(undefined, {
      onSuccess: () => {
        toast({ title: 'Bienvenue !', description: 'Vous avez rejoint le groupe avec succès.' });
        setJoining(false);
      },
      onError: (err: Error) => {
        toast({ title: 'Erreur', description: err.message || 'Impossible de rejoindre le groupe.', variant: 'destructive' });
        setJoining(false);
      },
    });
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen pt-20 pb-24 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-primary-pale rounded" />
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale space-y-4">
              <div className="h-6 w-48 bg-primary-pale rounded" />
              <div className="h-4 w-full bg-primary-pale/60 rounded-full" />
              <div className="h-4 w-3/4 bg-primary-pale/60 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="min-h-screen pt-20 pb-24 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-primary-deep mb-2">Groupe introuvable</h2>
          <p className="text-sm text-gray-400 mb-6">{groupError?.message || 'Ce groupe n\'existe pas ou a été supprimé.'}</p>
          <button onClick={() => router.push('/community')} className="px-6 py-2.5 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all">Retour à la communauté</button>
        </div>
      </div>
    );
  }

  const isPrivate = group.isPrivate === true || group.isPrivate === 'true';

  return (
    <div className="min-h-screen pt-20 pb-24 bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <button onClick={() => router.push('/community')} className="inline-flex items-center gap-2 text-sm text-primary-deep font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Retour à la communauté
          </button>
        </motion.div>

        {/* Group Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: easeOut }} className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-pale flex items-center justify-center shrink-0">
                <Landmark className="w-7 h-7 text-primary-deep" />
              </div>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-primary-deep">{String(group.name || '')}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPrivate ? 'bg-primary-pale text-primary-deep border border-primary-green/20' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {isPrivate ? (
                      <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Privé</span>
                    ) : (
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>
                    )}
                  </span>
                  {Boolean(group.type) && (
                    <span className="px-2 py-0.5 bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30 rounded-full text-[10px] font-bold">
                      {TYPE_LABELS[String(group.type)] || String(group.type)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {Boolean(group.description) && (
            <p className="text-sm text-gray-text leading-relaxed mb-4">{String(group.description)}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-text mb-4">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {membershipCount} membre{membershipCount !== 1 ? 's' : ''}</span>
            {Boolean(group.city) && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {String(group.city)}</span>}
            {Boolean(group.country) && <span>{String(group.country)}</span>}
          </div>

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={joining || joinGroup.isPending}
            className="w-full py-3 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {joining || joinGroup.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Inscription...</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Rejoindre le groupe</>
            )}
          </button>
        </motion.div>

        {/* Members List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4, ease: easeOut }} className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
          <h3 className="font-semibold text-sm text-primary-deep mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-deep" /> Membres ({members.length})
          </h3>

          {membersLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-primary-pale" />
                  <div className="flex-1"><div className="h-3 bg-primary-pale rounded-full w-24" /></div>
                </div>
              ))}
            </div>
          )}

          {!membersLoading && members.length === 0 && (
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-text">Aucun membre pour le moment</p>
            </div>
          )}

          {!membersLoading && members.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {members.map((member, i) => {
                const memberUser = member.user as Record<string, unknown> | undefined;
                const role = String(member.role || 'member');
                return (
                  <motion.div
                    key={String(member.id || i)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, ease: easeOut }}
                    className="flex items-center gap-3"
                  >
                    <ImageWithFallback
                      src={String(memberUser?.avatar || '')}
                      alt={String(memberUser?.name || 'Membre')}
                      className="w-9 h-9 rounded-full shrink-0"
                      fallbackType="avatar"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-deep truncate">{String(memberUser?.name || 'Membre')}</p>
                      <p className="text-xs text-gray-400">
                        {role === 'admin' ? (
                          <span className="flex items-center gap-1 text-accent-dark"><Crown className="w-3 h-3" /> Admin</span>
                        ) : (
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Membre</span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
