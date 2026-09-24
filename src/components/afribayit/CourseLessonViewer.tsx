'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  ChevronRight,
  Video,
  FileText,
  Clock,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { apiPatch } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────

interface ModuleItem {
  id?: string;
  title: string;
  duration?: string;
  videoUrl?: string;
  content?: string;
  type?: 'video' | 'text' | 'quiz';
  courseId?: string;
}

interface CourseLessonViewerProps {
  courseId: string;
  enrollmentId: string;
  modules: ModuleItem[];
  videoUrl?: string | null;
  currentProgress: number;
  completedModules?: string[];
  onProgressUpdate?: (progress: number) => void;
}

// ─── Component ────────────────────────────────────────────────────

export default function CourseLessonViewer({
  courseId,
  enrollmentId,
  modules,
  videoUrl,
  currentProgress,
  completedModules: initialCompletedModules = [],
  onProgressUpdate,
}: CourseLessonViewerProps) {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [completedMods, setCompletedMods] = useState<string[]>(
    initialCompletedModules
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // courseId is kept for future use (e.g. analytics tracking)
  void courseId;

  const totalModules = modules.length;
  const activeModule = modules[activeModuleIndex];
  const activeModuleId =
    activeModule?.id || `module-${activeModuleIndex}`;

  const completedCount = completedMods.length;
  const progressPercent =
    totalModules > 0
      ? Math.round((completedCount / totalModules) * 100)
      : currentProgress;

  // ─── Mark module complete ──────────────────────────────────────────

  const handleMarkComplete = async () => {
    if (completedMods.includes(activeModuleId)) return;

    const newCompleted = [...completedMods, activeModuleId];
    setCompletedMods(newCompleted);

    const newProgress = Math.round(
      (newCompleted.length / totalModules) * 100
    );

    setIsSaving(true);
    try {
      await apiPatch(`/api/courses/enrollments/${enrollmentId}`, {
        progress: newProgress,
        completedModules: newCompleted,
        completed: newProgress >= 100,
      });
      onProgressUpdate?.(newProgress);

      if (newProgress >= 100) {
        toast({
          title: 'Félicitations !',
          description: 'Vous avez terminé cette formation.',
        });
      }
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder votre progression.',
        variant: 'destructive',
      });
      // Revert
      setCompletedMods(completedMods);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Navigation ────────────────────────────────────────────────────

  const goNext = () => {
    if (activeModuleIndex < totalModules - 1) {
      setActiveModuleIndex(activeModuleIndex + 1);
    }
  };

  const goPrev = () => {
    if (activeModuleIndex > 0) {
      setActiveModuleIndex(activeModuleIndex - 1);
    }
  };

  // ─── Video source ────────────────────────────────────────────────

  const currentVideoUrl = useMemo(() => {
    if (activeModule?.videoUrl) return activeModule.videoUrl;
    if (activeModuleIndex === 0 && videoUrl) return videoUrl;
    return null;
  }, [activeModule, activeModuleIndex, videoUrl]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[70vh]">
      {/* ─── Sidebar: Module List ──────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 48 }}
        className="flex-shrink-0 bg-white rounded-3xl border border-primary-pale shadow-lg overflow-hidden"
      >
        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full p-3 flex items-center justify-between bg-primary-pale hover:bg-primary-pale/70 transition-colors"
        >
          {sidebarOpen && (
            <span className="text-sm font-semibold text-primary-deep">
              Modules ({completedCount}/{totalModules})
            </span>
          )}
          <ChevronRight
            className={`w-4 h-4 text-primary-deep transition-transform ${
              sidebarOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Module list */}
        {sidebarOpen && (
          <div className="max-h-[65vh] overflow-y-auto">
            {modules.map((mod, idx) => {
              const modId = mod.id || `module-${idx}`;
              const isActive = idx === activeModuleIndex;
              const isDone = completedMods.includes(modId);
              const modType = mod.type || 'video';

              return (
                <button
                  key={modId}
                  onClick={() => setActiveModuleIndex(idx)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-primary-pale/50 transition-colors ${
                    isActive
                      ? 'bg-primary-pale/60 border-l-[3px] border-l-primary-deep'
                      : 'hover:bg-primary-pale/30'
                  }`}
                >
                  {/* Status icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : isActive ? (
                      <Play className="w-5 h-5 text-primary-deep" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-primary-pale" />
                    )}
                  </div>

                  {/* Module info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive
                          ? 'text-primary-deep'
                          : isDone
                          ? 'text-green-600'
                          : 'text-gray-text'
                      }`}
                    >
                      {idx + 1}. {mod.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {modType === 'video' ? (
                        <Video className="w-3 h-3 text-gray-400" />
                      ) : modType === 'text' ? (
                        <FileText className="w-3 h-3 text-gray-400" />
                      ) : (
                        <Clock className="w-3 h-3 text-gray-400" />
                      )}
                      {mod.duration && (
                        <span className="text-[10px] text-gray-400">
                          {mod.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        {sidebarOpen && (
          <div className="p-4 border-t border-primary-pale/60">
            <div className="flex justify-between text-xs text-gray-text mb-1">
              <span>Progression</span>
              <span className="font-semibold text-primary-deep">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-primary-pale/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-deep to-primary-green rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </motion.aside>

      {/* ─── Main Content Area ─────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModuleIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl border border-primary-pale shadow-lg overflow-hidden"
          >
            {/* Module header */}
            <div className="p-4 sm:p-6 border-b border-primary-pale/60 bg-gradient-to-r from-primary-pale/60 to-transparent">
              <div className="flex items-center gap-2 text-xs text-gray-text mb-1">
                <span>Module {activeModuleIndex + 1}</span>
                <span>•</span>
                <span>{totalModules - completedCount} restants</span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-primary-deep">
                {activeModule?.title || 'Chargement...'}
              </h2>
            </div>

            {/* Video player with subtitle tracks (CDC §5.6.4 — subtitles in 10 languages) */}
            {currentVideoUrl ? (
              <div className="aspect-video bg-black">
                <video
                  key={currentVideoUrl}
                  controls
                  className="w-full h-full"
                  preload="metadata"
                  crossOrigin="anonymous"
                >
                  <source src={currentVideoUrl} type="video/mp4" />
                  {/* Subtitle tracks — CDC §5.6.4 requires subtitles in 10 languages.
                      The backend should serve .vtt files at /academy/courses/:id/subtitles/:lang.vtt
                      Browsers display a CC button to toggle them. */}
                  {['fr', 'en', 'ar', 'sw', 'ha', 'wo', 'am', 'ln', 'fon', 'pt'].map((lang) => (
                    <track
                      key={lang}
                      kind="subtitles"
                      srcLang={lang}
                      label={lang.toUpperCase()}
                      src={`/api/academy/subtitles?courseId=${activeModule?.courseId || ''}&lang=${lang}`}
                    />
                  ))}
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary-deep to-noir-vert flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                    {activeModule?.type === 'text' ? (
                      <FileText className="w-8 h-8 text-white/60" />
                    ) : (
                      <Video className="w-8 h-8 text-white/60" />
                    )}
                  </div>
                  <p className="text-white/50 text-sm">
                    {activeModule?.type === 'text'
                      ? 'Module texte — Scrollez pour lire'
                      : 'Vidéo bientôt disponible'}
                  </p>
                </div>
              </div>
            )}

            {/* Content text */}
            {activeModule?.content && (
              <div className="p-4 sm:p-6 prose prose-sm max-w-none text-gray-text">
                <div dangerouslySetInnerHTML={{ __html: activeModule.content }} />
              </div>
            )}

            {/* Actions bar */}
            <div className="p-4 sm:p-6 border-t border-primary-pale/60 bg-primary-pale/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Prev / Next */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={activeModuleIndex === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium text-primary-deep border border-primary-deep/20 hover:bg-primary-pale transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Précédent
                </button>
                <button
                  onClick={goNext}
                  disabled={activeModuleIndex === totalModules - 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium text-white bg-primary-green hover:bg-primary-deep shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mark complete */}
              <button
                onClick={handleMarkComplete}
                disabled={
                  completedMods.includes(activeModuleId) || isSaving
                }
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${
                  completedMods.includes(activeModuleId)
                    ? 'bg-green-50 text-green-700 cursor-default'
                    : 'bg-accent-yellow text-primary-deep hover:bg-[#c9a22e]'
                } disabled:opacity-50`}
              >
                {completedMods.includes(activeModuleId) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Module terminé
                  </>
                ) : isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Marquer comme terminé
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
