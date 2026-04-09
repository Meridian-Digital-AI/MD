'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────────────── */

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ── types ────────────────────────────────────────────────────────── */

interface Slot {
  hour: number;
  minute: number;
}

/* ── component ────────────────────────────────────────────────────── */

export default function BookingCalendar() {
  const now = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));
  const [selected, setSelected] = useState<{ date: Date; slot: Slot } | null>(
    null,
  );
  const [confirmed, setConfirmed] = useState(false);

  // Mon-Fri for the current week view
  const weekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // 9:00 AM - 4:30 PM in 30-min increments (last slot starts at 4:30, ends at 5:00)
  const slots: Slot[] = useMemo(() => {
    const s: Slot[] = [];
    for (let h = 9; h < 17; h++) {
      s.push({ hour: h, minute: 0 });
      s.push({ hour: h, minute: 30 });
    }
    return s;
  }, []);

  function isPast(day: Date, slot: Slot): boolean {
    const slotDate = new Date(day);
    slotDate.setHours(slot.hour, slot.minute, 0, 0);
    return slotDate <= now;
  }

  function isSelected(day: Date, slot: Slot): boolean {
    if (!selected) return false;
    return (
      isSameDay(selected.date, day) &&
      selected.slot.hour === slot.hour &&
      selected.slot.minute === slot.minute
    );
  }

  function handleSelect(day: Date, slot: Slot) {
    if (isPast(day, slot)) return;
    setConfirmed(false);
    setSelected({ date: day, slot });
  }

  function handleConfirm() {
    setConfirmed(true);
  }

  const canGoPrev = weekStart > startOfWeek(now);

  return (
    <div className="mt-12 rounded-xl border border-gray-200 bg-white p-6">
      {/* ── Week navigation ──────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          disabled={!canGoPrev}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h3 className="text-body font-medium text-gray-900">
          {formatDate(weekDays[0])} &ndash; {formatDate(weekDays[4])}
        </h3>

        <button
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className="w-20 px-2 py-2 text-small font-medium text-gray-500">
                Time
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.toISOString()}
                  className="px-2 py-2 text-small font-medium text-gray-700"
                >
                  <span className="block">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                  <span className="block text-overline text-gray-500">
                    {day.getDate()}/{day.getMonth() + 1}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={`${slot.hour}-${slot.minute}`}>
                <td className="px-2 py-1 text-small text-gray-500">
                  {formatTime(slot.hour, slot.minute)}
                </td>
                {weekDays.map((day) => {
                  const past = isPast(day, slot);
                  const sel = isSelected(day, slot);
                  return (
                    <td key={day.toISOString()} className="px-1 py-1">
                      <button
                        onClick={() => handleSelect(day, slot)}
                        disabled={past}
                        className={`w-full rounded-lg border px-2 py-1.5 text-small transition ${
                          sel
                            ? 'border-blue-600 bg-blue-600 font-medium text-white'
                            : past
                              ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-300'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                        aria-label={`${formatTime(slot.hour, slot.minute)} on ${formatDate(day)}`}
                      >
                        {sel ? 'Selected' : past ? '-' : formatTime(slot.hour, slot.minute)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Confirmation panel ───────────────────────────────── */}
      {selected && !confirmed && (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-body font-medium text-gray-900">
              {selected.date.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-small text-gray-600">
              {formatTime(selected.slot.hour, selected.slot.minute)} &ndash;{' '}
              {formatTime(
                selected.slot.minute === 30
                  ? selected.slot.hour + 1
                  : selected.slot.hour,
                selected.slot.minute === 30 ? 0 : 30,
              )}{' '}
              (30 min)
            </p>
          </div>
          <button
            onClick={handleConfirm}
            className="btn-primary shrink-0"
          >
            Confirm Booking
          </button>
        </div>
      )}

      {confirmed && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6">
          <CheckCircle className="h-6 w-6 shrink-0 text-green-600" />
          <div>
            <p className="text-body font-medium text-green-800">
              Booking confirmed!
            </p>
            <p className="text-small text-green-700">
              We&rsquo;ll send a confirmation email shortly. Looking forward to
              speaking with you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
