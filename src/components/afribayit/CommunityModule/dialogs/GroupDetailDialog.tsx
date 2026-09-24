'use client';

import { motion } from 'framer-motion';
import { useCommunityGroup, useCommunityGroupMembers, useJoinGroup } from '@/hooks/useCommunity';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { MapPin, MessageCircle, Users, X } from 'lucide-react';

interface GroupDetailDialogProps {
  groupId: string;
  onClose: () => void;
  user: { id: string } | null;
}

export default function GroupDetailDialog({ groupId, onClose, user }: GroupDetailDialogProps) {
  const { data, isLoading } = useCommunityGroup(groupId);
  const { data: membersData, isLoading: membersLoading } = useCommunityGroupMembers(groupId);
  const joinGroup = useJoinGroup(groupId);

  const groupData = data?.data as Record<string, unknown> | undefined;
  const members = ((membersData?.data as Record<string, unknown>[]) || []);

  const handleJoin = () => {
    if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour rejoindre ce groupe.' }); return; }
    joinGroup.mutate(undefined, {
      onSuccess: () => { toast({ title: 'Bienvenue !', description: 'Vous avez rejoint le groupe.' }); },
      onError: (err) => { toast({ title: 'Erreur', description: err.message || 'Impossible de rejoindre le groupe.', variant: 'destructive' }); },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 flex items-start justify-center overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl my-8 mx-4 border border-primary-pale"
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 animate-pulse space-y-4">
            <div className="h-6 bg-primary-pale rounded w-3/4" />
            <div className="h-4 bg-primary-pale/60 rounded-full w-1/2" />
            <div className="h-32 bg-primary-pale/60 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 border-b border-primary-pale/60">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-serif text-xl font-bold text-primary-deep">
                    {groupData?.name ? String(groupData.name) : 'Groupe'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${String(groupData?.type) === 'Premium' ? 'bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30' : 'bg-primary-pale text-primary-deep border border-primary-green/20'}`}>
                      {String(groupData?.type ?? 'Privé')}
                    </span>
                    {Boolean(groupData?.city) && (
                      <span className="flex items-center gap-1 text-xs text-gray-text"><MapPin className="w-3 h-3" />{String(groupData?.city)}</span>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-primary-pale transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              {Boolean(groupData?.description) && (
                <p className="text-sm text-gray-text">{String(groupData?.description)}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-text">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {Number(groupData?.members ?? members.length)} membres</span>
              </div>
            </div>

            {/* Members list */}
            <div className="p-5 max-h-[40vh] overflow-y-auto">
              <h4 className="text-sm font-semibold text-primary-deep mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-deep" /> Membres
              </h4>
              {membersLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-2 p-2">
                      <div className="w-8 h-8 rounded-full bg-primary-pale" />
                      <div className="flex-1"><div className="h-3 bg-primary-pale rounded-full w-24" /></div>
                    </div>
                  ))}
                </div>
              )}
              {!membersLoading && members.length === 0 && (
                <p className="text-sm text-gray-text text-center py-4">Aucun membre pour le moment</p>
              )}
              {!membersLoading && members.length > 0 && (
                <div className="space-y-2">
                  {members.map((member, i) => {
                    const memberUser = member.user as Record<string, unknown> | undefined;
                    return (
                      <div key={String(member.id ?? i)} className="flex items-center gap-3 p-2 hover:bg-primary-pale/40 rounded-xl transition-colors cursor-pointer">
                        <ImageWithFallback
                          src={memberUser?.avatar ? String(memberUser.avatar) : ''}
                          alt=""
                          className="w-8 h-8 rounded-full"
                          fallbackType="avatar"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-deep truncate">
                            {memberUser?.name ? String(memberUser.name) : 'Membre'}
                          </p>
                          <p className="text-[10px] text-gray-400">{String(member.role ?? 'Membre')}</p>
                        </div>
                        {String(member.role) === 'organizer' && (
                          <span className="px-2 py-0.5 bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30 rounded-full text-[10px] font-bold">Organisateur</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Join button */}
            <div className="p-5 border-t border-primary-pale/60 bg-primary-pale/30 rounded-b-3xl">
              <div className="flex gap-3">
                <button
                  onClick={() => toast({ title: 'Messagerie', description: 'Ouvrez la messagerie pour contacter ce groupe.' })}
                  className="flex-1 py-3 rounded-full border border-primary-deep/20 text-primary-deep text-sm font-bold hover:bg-primary-pale transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Message
                </button>
                <button
                  onClick={handleJoin}
                  disabled={!user || joinGroup.isPending}
                  className="flex-1 py-3 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {joinGroup.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Users className="w-4 h-4" /> Rejoindre</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
