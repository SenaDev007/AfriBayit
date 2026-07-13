'use client';

<<<<<<< HEAD
/**
 * /admin/multi-roles — Multi-role user management (CDC §3.1.1)
 *
 * Lets the admin:
 *   - See platform-wide multi-role distribution (single vs multi-role users)
 *   - List all users with their role + roles[] array
 *   - Filter by primary role or search by name/email
 *   - Add a role to a user (any role, including admin)
 *   - Remove a role from a user (refuses to remove the last role)
 *   - Set the primary role of a user
 *
 * All mutations are audit-logged on the backend.
 */

=======
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Star, Plus, X, Crown, Loader2, AlertCircle,
  TrendingUp, UserCog,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
<<<<<<< HEAD
  useAdminUsersRoles,
  useAdminRolesDistribution,
  useAdminRoleMutations,
=======
  useAdminUsersRoles, useAdminRolesDistribution, useAdminRoleMutations,
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
  type UserWithRoles,
} from '@/hooks/useAdminApi';
import { ROLE_CATALOG, getRoleDefinition } from '@/lib/role-catalog';

export default function AdminMultiRolesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: distribution } = useAdminRolesDistribution();
<<<<<<< HEAD
  const { data: users = [], isLoading } = useAdminUsersRoles({
    search: debouncedSearch,
    role: roleFilter,
  });
  const { addRole, removeRole, setPrimaryRole } = useAdminRoleMutations();

  const handleAddRole = async (userId: string, role: string) => {
    await addRole.mutateAsync({ userId, role });
  };
  const handleRemoveRole = async (userId: string, role: string) => {
    await removeRole.mutateAsync({ userId, role });
  };
  const handleSetPrimary = async (userId: string, role: string) => {
    await setPrimaryRole.mutateAsync({ userId, role });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a2a5e] flex items-center gap-2">
          <Users className="w-6 h-6" />
          Multi-rôles — Gestion utilisateurs
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ajoutez, retirez ou modifiez les rôles des utilisateurs. Toutes les actions sont audit-trailées.
        </p>
      </div>

      {/* Distribution KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Utilisateurs total</p>
                <p className="text-2xl font-bold text-[#0a2a5e]">{distribution?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-[#003087]/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Multi-rôles</p>
                <p className="text-2xl font-bold text-[#D4AF37]">{distribution?.multiRoleUsers || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#D4AF37]/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Mono-rôle</p>
                <p className="text-2xl font-bold text-gray-600">{distribution?.singleRoleUsers || 0}</p>
              </div>
              <UserCog className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Top rôle</p>
              {distribution?.byRoleOccurrence?.[0] ? (
                <div>
                  <p className="text-2xl font-bold text-[#003087]">
                    {distribution.byRoleOccurrence[0].count}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDefinition(distribution.byRoleOccurrence[0].role).label}
                  </p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-300">—</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role distribution chart */}
      {distribution?.byRoleOccurrence && distribution.byRoleOccurrence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0a2a5e]">
              Distribution des rôles (toutes occurrences)
            </CardTitle>
          </CardHeader>
=======
  const { data: users = [], isLoading } = useAdminUsersRoles({ search: debouncedSearch, role: roleFilter });
  const { addRole, removeRole, setPrimaryRole } = useAdminRoleMutations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a2a5e] flex items-center gap-2"><Users className="w-6 h-6" />Multi-rôles — Gestion utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-1">Ajoutez, retirez ou modifiez les rôles des utilisateurs. Toutes les actions sont audit-trailées.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-gray-500 uppercase">Utilisateurs total</p><p className="text-2xl font-bold text-[#0a2a5e]">{distribution?.totalUsers || 0}</p></div><Users className="w-8 h-8 text-[#003087]/30" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-gray-500 uppercase">Multi-rôles</p><p className="text-2xl font-bold text-[#D4AF37]">{distribution?.multiRoleUsers || 0}</p></div><TrendingUp className="w-8 h-8 text-[#D4AF37]/30" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-gray-500 uppercase">Mono-rôle</p><p className="text-2xl font-bold text-gray-600">{distribution?.singleRoleUsers || 0}</p></div><UserCog className="w-8 h-8 text-gray-400" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div><p className="text-xs text-gray-500 uppercase mb-1">Top rôle</p>{distribution?.byRoleOccurrence?.[0] ? (<div><p className="text-2xl font-bold text-[#003087]">{distribution.byRoleOccurrence[0].count}</p><p className="text-xs text-gray-500">{getRoleDefinition(distribution.byRoleOccurrence[0].role).label}</p></div>) : <p className="text-2xl font-bold text-gray-300">—</p>}</div></CardContent></Card>
      </div>

      {distribution?.byRoleOccurrence && distribution.byRoleOccurrence.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Distribution des rôles (toutes occurrences)</CardTitle></CardHeader>
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
          <CardContent>
            <div className="space-y-2">
              {distribution.byRoleOccurrence.map((entry) => {
                const roleDef = getRoleDefinition(entry.role);
                const Icon = roleDef.icon;
                const maxCount = distribution.byRoleOccurrence[0].count;
                const pct = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
                return (
                  <div key={entry.role} className="flex items-center gap-3">
<<<<<<< HEAD
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleDef.bgColor}`}>
                      <Icon className={`w-4 h-4 ${roleDef.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#0a2a5e]">{roleDef.label}</span>
                        <span className="text-xs text-gray-500">{entry.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-[#003087]"
                        />
                      </div>
=======
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleDef.bgColor}`}><Icon className={`w-4 h-4 ${roleDef.color}`} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-[#0a2a5e]">{roleDef.label}</span><span className="text-xs text-gray-500">{entry.count}</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} className="h-full bg-[#003087]" /></div>
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

<<<<<<< HEAD
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 rounded-md border bg-white text-sm"
        >
          <option value="all">Tous les rôles</option>
          {ROLE_CATALOG.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#0a2a5e]">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Utilisateur</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Rôle principal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Tous les rôles</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Pays</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">KYC</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#003087] mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucun utilisateur trouvé</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#0a2a5e]">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const roleDef = getRoleDefinition(user.role);
                          const Icon = roleDef.icon;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${roleDef.bgColor} ${roleDef.color}`}>
                              <Icon className="w-3 h-3" />
                              {roleDef.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => {
                            const roleDef = getRoleDefinition(r);
                            const isPrimary = r === user.role;
                            return (
                              <span
                                key={r}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  isPrimary
                                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                                    : `${roleDef.bgColor} ${roleDef.color} ${roleDef.borderColor}`
                                }`}
                              >
                                {roleDef.label}
                                {isPrimary && <Crown className="w-2.5 h-2.5" />}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {user.country || '—'}{user.city ? `, ${user.city}` : ''}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-[10px]">L{user.kycLevel}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                          className="h-7 text-xs"
                        >
                          <UserCog className="w-3 h-3 mr-1" />
                          Gérer
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
=======
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 px-3 rounded-md border bg-white text-sm">
          <option value="all">Tous les rôles</option>
          {ROLE_CATALOG.map((r) => (<option key={r.key} value={r.key}>{r.label}</option>))}
        </select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Utilisateur</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Rôle principal</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tous les rôles</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Pays</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">KYC</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (<tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#003087] mx-auto" /></td></tr>) :
                 users.length === 0 ? (<tr><td colSpan={6} className="text-center py-12 text-gray-400"><Users className="w-12 h-12 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucun utilisateur trouvé</p></td></tr>) :
                 users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="font-medium text-[#0a2a5e]">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></td>
                    <td className="px-4 py-3">{(() => { const r = getRoleDefinition(user.role); const Icon = r.icon; return (<span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${r.bgColor} ${r.color}`}><Icon className="w-3 h-3" />{r.label}</span>); })()}</td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{user.roles.map((r) => { const rd = getRoleDefinition(r); const isPrimary = r === user.role; return (<span key={r} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${isPrimary ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30' : `${rd.bgColor} ${rd.color} ${rd.borderColor}`}`}>{rd.label}{isPrimary && <Crown className="w-2.5 h-2.5" />}</span>); })}</div></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{user.country || '—'}{user.city ? `, ${user.city}` : ''}</td>
                    <td className="px-4 py-3 text-center"><Badge variant="outline" className="text-[10px]">L{user.kycLevel}</Badge></td>
                    <td className="px-4 py-3 text-center"><Button size="sm" variant="outline" onClick={() => setSelectedUser(user)} className="h-7 text-xs"><UserCog className="w-3 h-3 mr-1" />Gérer</Button></td>
                  </tr>
                ))}
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

<<<<<<< HEAD
      {/* User role manager modal */}
=======
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
      <AnimatePresence>
        {selectedUser && (
          <UserRoleModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
<<<<<<< HEAD
            onAddRole={(role) => handleAddRole(selectedUser.id, role)}
            onRemoveRole={(role) => handleRemoveRole(selectedUser.id, role)}
            onSetPrimary={(role) => handleSetPrimary(selectedUser.id, role)}
=======
            onAddRole={async (role) => { await addRole.mutateAsync({ userId: selectedUser.id, role }); }}
            onRemoveRole={async (role) => { await removeRole.mutateAsync({ userId: selectedUser.id, role }); }}
            onSetPrimary={async (role) => { await setPrimaryRole.mutateAsync({ userId: selectedUser.id, role }); }}
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
            pending={addRole.isPending || removeRole.isPending || setPrimaryRole.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

<<<<<<< HEAD
// ─── Role manager modal ────────────────────────────────────────────────────

=======
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
interface UserRoleModalProps {
  user: UserWithRoles;
  onClose: () => void;
  onAddRole: (role: string) => Promise<void>;
  onRemoveRole: (role: string) => Promise<void>;
  onSetPrimary: (role: string) => Promise<void>;
  pending: boolean;
}

function UserRoleModal({ user, onClose, onAddRole, onRemoveRole, onSetPrimary, pending }: UserRoleModalProps) {
  const userRoles = user.roles || [user.role];
  const availableRoles = ROLE_CATALOG.filter((r) => !userRoles.includes(r.key));
<<<<<<< HEAD

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0a2a5e]">Gérer les rôles — {user.name}</h2>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {pending && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#003087]" />
            </div>
          )}

          {/* Current roles */}
=======
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div><h2 className="text-lg font-bold text-[#0a2a5e]">Gérer les rôles — {user.name}</h2><p className="text-xs text-gray-500">{user.email}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {pending && <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-[#003087]" /></div>}
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
          <div>
            <h3 className="text-sm font-semibold text-[#0a2a5e] mb-2">Rôles actifs ({userRoles.length})</h3>
            <div className="space-y-2">
              {userRoles.map((roleKey) => {
                const roleDef = getRoleDefinition(roleKey);
                const Icon = roleDef.icon;
                const isPrimary = roleKey === user.role;
                return (
                  <div key={roleKey} className={`flex items-center justify-between p-3 rounded-lg border-2 ${roleDef.borderColor} ${roleDef.bgColor}`}>
<<<<<<< HEAD
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${roleDef.color}`} />
                      <div>
                        <p className={`text-sm font-semibold ${roleDef.color}`}>{roleDef.label}</p>
                        <p className="text-[10px] text-gray-500">{roleDef.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onSetPrimary(roleKey)}
                        disabled={pending || isPrimary}
                        title="Définir comme rôle principal"
                        className={`p-1.5 rounded-full transition-colors ${
                          isPrimary
                            ? 'bg-[#D4AF37] text-white'
                            : 'bg-white/80 text-gray-400 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37]'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => onRemoveRole(roleKey)}
                        disabled={pending || userRoles.length <= 1}
                        title={userRoles.length <= 1 ? 'Impossible de retirer le dernier rôle' : 'Retirer ce rôle'}
                        className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
=======
                    <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${roleDef.color}`} /><div><p className={`text-sm font-semibold ${roleDef.color}`}>{roleDef.label}</p><p className="text-[10px] text-gray-500">{roleDef.description}</p></div></div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onSetPrimary(roleKey)} disabled={pending || isPrimary} title="Définir comme rôle principal" className={`p-1.5 rounded-full transition-colors ${isPrimary ? 'bg-[#D4AF37] text-white' : 'bg-white/80 text-gray-400 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37]'}`}><Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-current' : ''}`} /></button>
                      <button onClick={() => onRemoveRole(roleKey)} disabled={pending || userRoles.length <= 1} title={userRoles.length <= 1 ? 'Impossible de retirer le dernier rôle' : 'Retirer ce rôle'} className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-30 disabled:cursor-not-allowed"><X className="w-3.5 h-3.5" /></button>
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
<<<<<<< HEAD

          {/* Available roles */}
=======
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
          {availableRoles.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#0a2a5e] mb-2">Ajouter un rôle</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map((role) => {
                  const Icon = role.icon;
                  return (
<<<<<<< HEAD
                    <button
                      key={role.key}
                      onClick={() => onAddRole(role.key)}
                      disabled={pending}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:border-[#003087] hover:bg-[#003087]/5 transition-colors text-left disabled:opacity-50"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role.bgColor}`}>
                        <Icon className={`w-4 h-4 ${role.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#0a2a5e] truncate">{role.label}</p>
                      </div>
=======
                    <button key={role.key} onClick={() => onAddRole(role.key)} disabled={pending} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:border-[#003087] hover:bg-[#003087]/5 transition-colors text-left disabled:opacity-50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role.bgColor}`}><Icon className={`w-4 h-4 ${role.color}`} /></div>
                      <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-[#0a2a5e] truncate">{role.label}</p></div>
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
                      <Plus className="w-3.5 h-3.5 text-[#003087]" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
<<<<<<< HEAD

          {/* Warning */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Toutes les modifications sont enregistrées dans le journal d'audit (acteur, action, rôles précédents/nouveaux).
              L'utilisateur devra se reconnecter pour que son JWT soit rafraîchi avec les nouveaux rôles.
            </p>
=======
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Toutes les modifications sont enregistrées dans le journal d'audit (acteur, action, rôles précédents/nouveaux). L'utilisateur devra se reconnecter pour que son JWT soit rafraîchi avec les nouveaux rôles.</p>
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
