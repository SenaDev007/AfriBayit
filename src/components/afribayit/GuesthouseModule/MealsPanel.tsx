'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { easeOut, mealTypeConfig } from './constants';
import { formatPrice } from './utils';
import { MealCardSkeleton } from './Skeletons';
import type { GuesthouseDetail, GuesthouseListItem } from './types';

interface MealsPanelProps {
  guesthousesList: GuesthouseListItem[];
  effectiveGhId: string | null;
  setSelectedGhId: (id: string) => void;
  detailLoadingState: boolean;
  activeDetail: GuesthouseDetail | undefined;
}

export default function MealsPanel({
  guesthousesList,
  effectiveGhId,
  setSelectedGhId,
  detailLoadingState,
  activeDetail,
}: MealsPanelProps) {
  return (
    <motion.div
      key="meals"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      {/* Guesthouse selector */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={effectiveGhId || ''}
          onChange={e => setSelectedGhId(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white"
        >
          {guesthousesList.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
        </select>
      </div>

      {detailLoadingState ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <MealCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {mealTypeConfig.map((mtc) => {
            const meal = activeDetail?.meals?.find(m => m.mealType === mtc.key);
            return (
              <motion.div
                key={mtc.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm border text-center"
              >
                <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${mtc.color}10`, color: mtc.color }}>
                  {mtc.icon}
                </div>
                <h4 className="font-display text-base font-bold text-[#0a2a5e] mb-1">{mtc.label}</h4>
                {meal ? (
                  <>
                    <p className="font-mono text-2xl font-bold" style={{ color: mtc.color }}>
                      {formatPrice(meal.price)} FCFA
                    </p>
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-[#00A651]/10 text-[#00A651] text-[10px] font-semibold rounded-full">
                      <CheckCircle className="w-3 h-3" /> Disponible
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">Non proposé</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
