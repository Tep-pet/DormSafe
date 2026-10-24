import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatIso(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseIso(isoStr) {
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return null;
  const [y, m, d] = isoStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

/**
 * Custom DatePicker with High-Contrast Deep Black Calendar Numbers
 * Replaces the native browser datepicker with 100% visible, bold black numbers.
 */
export function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placement = 'auto',
  required = false,
  error = '',
  placeholder = 'Select date',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(placement === 'top');
  const containerRef = useRef(null);

  const parsed = parseIso(value);
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const [viewYear, setViewYear] = useState(parsed ? parsed.year : todayYear);
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.month : todayMonth);

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  // Determine popover direction (upwards if near bottom of modal or screen)
  useEffect(() => {
    if (isOpen) {
      if (placement === 'top') {
        setOpenUpward(true);
      } else if (placement === 'bottom') {
        setOpenUpward(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 250);
      }
    }
  }, [isOpen, placement]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleSelectDate(year, month, day) {
    const iso = formatIso(year, month, day);
    if (onChange) onChange(iso);
    setIsOpen(false);
  }

  function handleToday() {
    handleSelectDate(todayYear, todayMonth, todayDate);
  }

  function handleClear() {
    if (onChange) onChange('');
    setIsOpen(false);
  }

  // Generate 42 cells grid
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({
      year: prevYear,
      month: prevMonthIdx,
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    cells.push({
      year: viewYear,
      month: viewMonth,
      day: i,
      isCurrentMonth: true,
    });
  }

  // Next month leading days (fill up to 35 or 42 cells)
  const totalCells = cells.length > 35 ? 42 : 35;
  const remaining = totalCells - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({
      year: nextYear,
      month: nextMonthIdx,
      day: i,
      isCurrentMonth: false,
    });
  }

  // Format display label
  const displayValue = parsed
    ? `${String(parsed.month + 1).padStart(2, '0')}/${String(parsed.day).padStart(2, '0')}/${parsed.year}`
    : '';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          {label} {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      {/* Input Box Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-10 px-3.5 rounded-xl border bg-white flex items-center justify-between text-left transition-all ${
          isOpen
            ? 'border-ateneo-blue ring-2 ring-blue-100 shadow-xs'
            : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
        }`}
      >
        <span
          className={`text-xs sm:text-sm font-semibold tracking-wide ${
            displayValue ? 'text-black font-bold' : 'text-slate-400 font-normal'
          }`}
        >
          {displayValue || placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-ateneo-blue">
          {displayValue && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear date"
            >
              <X size={13} />
            </span>
          )}
          <CalendarIcon size={16} className="text-ateneo-blue" />
        </div>
      </button>

      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}

      {/* High-Contrast Calendar Popover - Compact & Sleek */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 w-[240px] rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xl shadow-slate-900/20 animate-in fade-in zoom-in-95 duration-100 ${
            openUpward ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+4px)]'
          }`}
        >
          {/* Header Controls: Month & Year Navigator */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={prevMonth}
              className="h-6 w-6 rounded-md flex items-center justify-center text-slate-800 hover:bg-blue-50 hover:text-ateneo-blue transition-colors font-bold"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-1">
              <span className="font-extrabold text-xs text-black tracking-tight">
                {MONTH_NAMES[viewMonth]}
              </span>
              <span className="font-extrabold text-xs text-black">
                {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="h-6 w-6 rounded-md flex items-center justify-center text-slate-800 hover:bg-blue-50 hover:text-ateneo-blue transition-colors font-bold"
              aria-label="Next month"
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Weekday Column Headers (Deep Black & Bold) */}
          <div className="grid grid-cols-7 gap-0.5 pt-1.5 pb-0.5 text-center">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[10px] font-black text-black select-none">
                {d}
              </span>
            ))}
          </div>

          {/* Day Grid Cells (ALL NUMBERS IN SOLID BLACK) */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, idx) => {
              const cellIso = formatIso(cell.year, cell.month, cell.day);
              const isSelected = value === cellIso;
              const isToday =
                cell.year === todayYear &&
                cell.month === todayMonth &&
                cell.day === todayDate;

              const isPastMin = minDate && cellIso < minDate;
              const isFutureMax = maxDate && cellIso > maxDate;
              const isDisabled = isPastMin || isFutureMax;

              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(cell.year, cell.month, cell.day)}
                  className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-xs transition-all select-none ${
                    isDisabled
                      ? 'opacity-25 cursor-not-allowed text-slate-400'
                      : isSelected
                      ? 'bg-ateneo-blue text-white font-black shadow-xs scale-105'
                      : isToday
                      ? 'bg-blue-50 text-black font-black border border-ateneo-blue'
                      : cell.isCurrentMonth
                      ? 'text-black font-extrabold hover:bg-blue-50 hover:text-ateneo-blue'
                      : 'text-black font-bold hover:bg-slate-100'
                  }`}
                >
                  <span className="leading-none">{cell.day}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Actions: Clear & Today */}
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleClear}
              className="font-bold text-slate-600 hover:text-rose-600 transition-colors px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="font-black text-ateneo-blue hover:text-blue-900 transition-colors px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
