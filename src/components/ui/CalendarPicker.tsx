"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface CalendarPickerProps {
  bookedDates?: string[];          // YYYY-MM-DD strings — grisées et non-cliquables
  selectedStart?: string | null;
  selectedEnd?: string | null;
  onSelect: (start: string, end: string | null) => void;
  minDate?: string;                // YYYY-MM-DD — dates avant = disabled
  className?: string;
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isBetween(date: string, start: string, end: string): boolean {
  return date > start && date < end;
}

export default function CalendarPicker({
  bookedDates = [],
  selectedStart,
  selectedEnd,
  onSelect,
  minDate,
  className,
}: CalendarPickerProps) {
  const today = toYMD(new Date());
  const effectiveMin = minDate ?? today;

  // Current month shown
  const [viewYear, setViewYear] = useState(() => {
    const d = selectedStart ? parseDate(selectedStart) : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selectedStart ? parseDate(selectedStart) : new Date();
    return d.getMonth();
  });

  const bookedSet = useMemo(() => new Set(bookedDates), [bookedDates]);

  // Build calendar grid (Mon-start)
  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);

    // Monday = 0 offset
    let startDow = first.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: Array<string | null> = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push(toYMD(new Date(viewYear, viewMonth, d)));
    }
    // Pad to full rows
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function handleDayClick(day: string) {
    if (day < effectiveMin || bookedSet.has(day)) return;

    // If no start selected, or both selected, restart
    if (!selectedStart || (selectedStart && selectedEnd)) {
      onSelect(day, null);
      return;
    }

    // Start selected, pick end
    if (day <= selectedStart) {
      onSelect(day, null);
      return;
    }

    // Check no booked date in range
    const hasConflict = bookedDates.some((bd) => isBetween(bd, selectedStart, day));
    if (hasConflict) {
      onSelect(day, null);
      return;
    }

    onSelect(selectedStart, day);
  }

  function getDayState(day: string | null): "empty" | "disabled" | "booked" | "start" | "end" | "in-range" | "default" {
    if (!day) return "empty";
    if (bookedSet.has(day)) return "booked";
    if (day < effectiveMin) return "disabled";
    if (day === selectedStart) return "start";
    if (day === selectedEnd) return "end";
    if (selectedStart && selectedEnd && isBetween(day, selectedStart, selectedEnd)) return "in-range";
    return "default";
  }

  return (
    <div className={cn("select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Mois précédent"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-bold text-gray-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Mois suivant"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          const state = getDayState(day);

          if (state === "empty") {
            return <div key={`empty-${i}`} />;
          }

          const isBooked = state === "booked";
          const isDisabled = state === "disabled";
          const isStart = state === "start";
          const isEnd = state === "end";
          const isInRange = state === "in-range";

          return (
            <button
              key={day}
              type="button"
              disabled={isBooked || isDisabled}
              onClick={() => handleDayClick(day!)}
              className={cn(
                "relative h-8 text-xs font-medium transition-colors rounded-lg mx-0.5",
                isBooked && "text-gray-300 line-through cursor-not-allowed bg-gray-50",
                isDisabled && "text-gray-300 cursor-not-allowed",
                isStart && "bg-[#003087] text-white rounded-lg",
                isEnd && "bg-[#003087] text-white rounded-lg",
                isInRange && "bg-[#0070BA]/10 text-[#003087] rounded-none",
                state === "default" && "text-gray-700 hover:bg-gray-100 hover:rounded-lg",
                // First/last of range — adjust border radius
                isStart && selectedEnd && "rounded-r-none",
                isEnd && selectedStart && "rounded-l-none",
              )}
            >
              {day!.slice(8)}
              {day === today && !isStart && !isEnd && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D4AF37]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#003087] inline-block" /> Sélection
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Indisponible
        </span>
      </div>
    </div>
  );
}
