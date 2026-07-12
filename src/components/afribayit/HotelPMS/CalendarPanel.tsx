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
      <div className="bg-white rounded-2xl p-5 shadow-sm border max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-2 hover:bg-gray-100 rounded-xl">&larr;</button>
          <h3 className="font-display text-lg font-bold text-[#0a2a5e]">{MONTH_NAMES[calMonth]} {calYear}</h3>
          <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-2 hover:bg-gray-100 rounded-xl">&rarr;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">{WEEKDAYS.map((d) => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cd, i) => {
            const today = new Date();
            const isToday = cd.dateStr === today.toISOString().split('T')[0];
            return (
              <div key={i} className={`aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                !cd.isCurrentMonth ? 'text-gray-300' : isToday ? 'bg-[#003087] text-white font-bold' : 'bg-[#00A651]/5 text-[#0a2a5e] hover:bg-[#00A651]/20'
              }`}>{cd.day}</div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#00A651]/20 rounded" /> Disponible</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#003087] rounded" /> Aujourd&apos;hui</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#D93025]/20 rounded" /> Reserve</span>
        </div>
      </div>
    </motion.div>
  );
}
