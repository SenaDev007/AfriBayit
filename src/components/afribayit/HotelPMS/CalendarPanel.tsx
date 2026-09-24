'use client';

import { motion } from 'framer-motion';
import { WEEKDAYS, MONTH_NAMES } from './constants';
import type { CalendarDay } from './types';
import { easeOut } from './types';

interface CalendarPanelProps {
  calMonth: number;
  calYear: number;
  setCalMonth: (n: number) => void;
  setCalYear: (n: number) => void;
  calendarDays: CalendarDay[];
}

export default function CalendarPanel({ calMonth, calYear, setCalMonth, setCalYear, calendarDays }: CalendarPanelProps) {
  return (
    <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-2 hover:bg-primary-pale rounded-full text-gray-text transition-colors">&larr;</button>
          <h3 className="font-serif text-lg font-bold text-primary-deep">{MONTH_NAMES[calMonth]} {calYear}</h3>
          <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-2 hover:bg-primary-pale rounded-full text-gray-text transition-colors">&rarr;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">{WEEKDAYS.map((d) => <div key={d} className="text-center text-[10px] font-semibold text-gray-text/60 py-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cd, i) => {
            const today = new Date();
            const isToday = cd.dateStr === today.toISOString().split('T')[0];
            return (
              <div key={i} className={`aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                !cd.isCurrentMonth ? 'text-gray-300' : isToday ? 'bg-primary-deep text-white font-bold shadow-md' : 'bg-primary-pale/60 text-primary-deep hover:bg-primary-pale'
              }`}>{cd.day}</div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-text">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary-pale rounded" /> Disponible</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary-deep rounded" /> Aujourd&apos;hui</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#D93025]/20 rounded" /> Reserve</span>
        </div>
      </div>
    </motion.div>
  );
}
