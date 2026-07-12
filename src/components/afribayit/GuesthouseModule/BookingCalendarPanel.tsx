'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { weekDays, easeOut } from './constants';
import type { CalendarCell } from './types';

interface BookingCalendarPanelProps {
  calendarDays: CalendarCell[];
}

export default function BookingCalendarPanel({ calendarDays }: BookingCalendarPanelProps) {
  return (
    <motion.div
      key="booking"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-[#0a2a5e]">Calendrier — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-[#00A651]/20" /> Disponible</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-[#D93025]/20" /> Réservé</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cd, idx) => (
            <div
              key={idx}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                cd.day === null ? '' :
                cd.booked
                  ? 'bg-[#D93025]/10 text-[#D93025] cursor-pointer'
                  : 'bg-[#00A651]/5 text-[#0a2a5e] hover:bg-[#00A651]/20 cursor-pointer'
              }`}
            >
              {cd.day}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
