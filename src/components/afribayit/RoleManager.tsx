'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Loader2, Plus, X, AlertCircle, Star } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { ROLE_CATALOG, getRoleDefinition } from '@/lib/role-catalog';

export default function RoleManager() {
  const router = useRouter();
  const { roles, primaryRole, loading, error, addRole, removeRole, setPrimaryRole } = useUserRoles();
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const handleToggle = async (roleKey: string) => {
    setPendingRole(roleKey);
    const isActive = roles.includes(roleKey);
    if (isActive) await removeRole(roleKey);
    else await addRole(roleKey);
    setPendingRole(null);
  };

  const handleSetPrimary = async (roleKey: string) => {
    if (roleKey === primaryRole) return;
    setPendingRole(roleKey);
    await setPrimaryRole(roleKey);
    setPendingRole(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-[#003087]/20 bg-gradient-to-br from-[#003087]/5 to-[#D4AF37]/5 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0a2a5e] mb-1">Vos rôles actifs</h2>
            <p className="text-sm text-gray-600">Cumulez plusieurs casquettes sur AfriBayit — acheteur, investisseur, vendeur, etc.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#003087]">{roles.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">rôle{roles.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {roles.length === 0 && <span className="text-sm text-gray-400 italic">Aucun rôle — sélectionnez-en ci-dessous</span>}
          {roles.map((roleKey) => {
            const role = getRoleDefinition(roleKey);
            const Icon = role.icon;
            const isPrimary = roleKey === primaryRole;
            return (
              <span key={roleKey} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-medium ${role.bgColor} ${role.color} ${role.borderColor}`}>
                <Icon className="w-3.5 h-3.5" />
                {role.label}
                {isPrimary && (<span className="ml-1 inline-flex items-center gap-0.5 text-[10px] bg-white/80 px-1.5 py-0.5 rounded-full"><Star className="w-2.5 h-2.5 fill-current" />Principal</span>)}
              </span>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-3">Catalogue des rôles</h3>
        <p className="text-sm text-gray-500 mb-4">Cliquez pour activer/désactiver un rôle. Cliquez sur l'étoile pour définir votre rôle principal.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLE_CATALOG.map((role) => {
            const isActive = roles.includes(role.key);
            const isPrimary = role.key === primaryRole;
            const isPending = pendingRole === role.key;
            const Icon = role.icon;
            return (
              <div key={role.key} className={`relative rounded-xl border-2 p-4 transition-all ${isActive ? `${role.borderColor} ${role.bgColor}` : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.bgColor}`}><Icon className={`w-5 h-5 ${role.color}`} /></div>
                  <div className="flex items-center gap-1">
                    {isActive && (
                      <button onClick={() => handleSetPrimary(role.key)} disabled={loading || isPending} title="Définir comme rôle principal"
                        className={`p-1.5 rounded-full transition-colors ${isPrimary ? 'bg-[#D4AF37] text-white' : 'bg-white/80 text-gray-400 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37]'}`}>
                        <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-current' : ''}`} />
                      </button>
                    )}
                    <button onClick={() => handleToggle(role.key)} disabled={loading || isPending}
                      className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-[#003087] text-white hover:bg-[#001f5c]'}`}
                      title={isActive ? 'Retirer ce rôle' : 'Ajouter ce rôle'}>
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isActive ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <h4 className={`font-display font-bold ${isActive ? role.color : 'text-gray-800'}`}>{role.label}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{role.description}</p>
                {isActive && (
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-medium">
                    <Check className={`w-3 h-3 ${role.color}`} />
                    <span className={role.color}>Rôle actif</span>
                    {isPrimary && (<span className="ml-1 inline-flex items-center gap-0.5 text-[#D4AF37]"><Crown className="w-2.5 h-2.5" />Principal</span>)}
                  </div>
                )}
                {isActive && role.hasDashboard && role.dashboardUrl && (
                  <button onClick={() => router.push(role.dashboardUrl!)} className="mt-2 text-[11px] text-[#003087] hover:underline font-medium">Ouvrir le dashboard →</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">💡 Comment fonctionne le multi-rôle ?</p>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li>Le <strong>rôle principal</strong> (étoile dorée) détermine le dashboard par défaut après connexion.</li>
          <li>Tous les rôles actifs donnent accès aux features correspondantes (publier un bien, acheter, investir, etc.).</li>
          <li>Vous pouvez cumuler autant de rôles que vous voulez — par exemple <em>touriste + investisseur + acheteur</em>.</li>
          <li>Le rôle <strong>Administrateur</strong> ne peut pas être ajouté depuis cette page (réservé aux admins existants).</li>
        </ul>
      </div>
    </div>
  );
}
