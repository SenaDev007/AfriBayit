'use client';

// AfriBayit — Chantier Collaboratif (CDC §5.5.2)
// Collaborative construction site management: appels d'offres, lots de
// travaux, tableau de bord projet. This is a stub that renders the UI
// shell and calls the backend /artisans/projects endpoints. When the
// backend implements the endpoints, the UI will be fully functional.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, FileText, Users, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string | null;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  lots: ProjectLot[];
}

interface ProjectLot {
  id: string;
  name: string;
  trade: string;
  budget: number;
  assignedArtisanId: string | null;
  assignedArtisanName?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed';
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planning: { label: 'En préparation', color: '#D4AF37' },
  in_progress: { label: 'En cours', color: '#003087' },
  completed: { label: 'Terminé', color: '#00A651' },
  on_hold: { label: 'En pause', color: '#6b7280' },
  open: { label: 'Ouvert', color: '#009CDE' },
  assigned: { label: 'Assigné', color: '#003087' },
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

export default function ChantierCollaboratif() {
  const { user } = useAuthStore();
  const { selectedCountry } = useCountry();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', budget: '' });

  // Fetch projects
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['chantier-projects', selectedCountry],
    queryFn: async () => {
      try {
        const data = await api.get<{ projects: Project[] }>('/artisans/projects');
        return data;
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) {
          return { projects: [] };
        }
        throw err;
      }
    },
  });

  const projects = projectsData?.projects ?? [];

  const createProject = useMutation({
    mutationFn: (data: { name: string; description: string; budget: number }) =>
      api.post('/artisans/projects', { ...data, country: selectedCountry }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chantier-projects'] });
      toast.success('Projet créé avec succès');
      setShowCreateForm(false);
      setNewProject({ name: '', description: '', budget: '' });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.statusCode === 404) {
        toast.error('La gestion de chantiers sera bientôt disponible.');
      } else {
        toast.error('Erreur lors de la création du projet');
      }
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim() || !newProject.budget) return;
    createProject.mutate({
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      budget: Number(newProject.budget),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-[#0a2a5e] flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Chantiers Collaboratifs
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos projets BTP : appels d&apos;offres, lots de travaux, suivi des artisans
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003087] text-white rounded-xl text-sm font-semibold hover:bg-[#0047b3] transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouveau projet
        </button>
      </motion.div>

      {/* Create form */}
      {showCreateForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleCreate}
          className="bg-white rounded-2xl p-5 shadow-sm border space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom du projet *</label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject(p => ({ ...p, name: e.target.value }))}
              placeholder="ex. Construction Villa Godomey"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#003087]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject(p => ({ ...p, description: e.target.value }))}
              placeholder="Description du projet..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Budget total (FCFA) *</label>
            <input
              type="number"
              value={newProject.budget}
              onChange={(e) => setNewProject(p => ({ ...p, budget: e.target.value }))}
              placeholder="ex. 15000000"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#003087]"
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={createProject.isPending} className="px-4 py-2 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#002266] disabled:opacity-50 flex items-center gap-2">
              {createProject.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer le projet
            </button>
          </div>
        </motion.form>
      )}

      {/* Projects list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#003087]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-2">Aucun chantier</h3>
          <p className="text-sm text-gray-500 mb-4">
            Créez votre premier projet de chantier collaboratif pour gérer les appels d&apos;offres et les lots de travaux.
          </p>
          <button onClick={() => setShowCreateForm(true)} className="px-6 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3]">
            Créer un projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-[#0a2a5e]">{project.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{project.description}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${STATUS_LABELS[project.status]?.color || '#6b7280'}15`,
                    color: STATUS_LABELS[project.status]?.color || '#6b7280',
                  }}
                >
                  {STATUS_LABELS[project.status]?.label || project.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <DollarSign className="w-3.5 h-3.5" /> {formatFCFA(project.budget)}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(project.startDate).toLocaleDateString('fr-FR')}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <FileText className="w-3.5 h-3.5" /> {project.lots?.length || 0} lots
                </div>
              </div>
              {project.lots && project.lots.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {project.lots.slice(0, 3).map((lot) => (
                    <div key={lot.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{lot.name} ({lot.trade})</span>
                      <span
                        className="font-semibold"
                        style={{ color: STATUS_LABELS[lot.status]?.color || '#6b7280' }}
                      >
                        {STATUS_LABELS[lot.status]?.label || lot.status}
                      </span>
                    </div>
                  ))}
                  {project.lots.length > 3 && (
                    <p className="text-xs text-gray-400">...et {project.lots.length - 3} autres lots</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
