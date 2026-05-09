'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
}

interface Slot { hour: number; minute: number }

export default function AdminBookingCalendar() {
  const now = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));
  const [bookedSet, setBookedSet] = useState<Set<string>>(new Set());
  const [blockedMap, setBlockedMap] = useState<Map<string, string | null>>(new Map());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const slots: Slot[] = useMemo(() => {
    const s: Slot[] = [];
    for (let h = 9; h < 17; h++) {
      s.push({ hour: h, minute: 0 });
      s.push({ hour: h, minute: 30 });
    }
    return s;
  }, []);

  const refresh = useCallback(async () => {
    const from = new Date(weekStart);
    const to = addDays(weekStart, 7);
    try {
      const res = await fetch(`/api/booking/availability?from=${from.toISOString()}&to=${to.toISOString()}`);
      const j: { booked?: string[]; blocked?: { slot_iso: string; reason: string | null }[] } = await res.json();
      setBookedSet(new Set((j.booked || []).map((s) => new Date(s).toISOString())));
      const m = new Map<string, string | null>();
      (j.blocked || []).forEach((b) => m.set(new Date(b.slot_iso).toISOString(), b.reason ?? null));
      setBlockedMap(m);
    } catch {
      // ignore
    }
  }, [weekStart]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function slotIso(day: Date, slot: Slot): string {
    const d = new Date(day);
    d.setHours(slot.hour, slot.minute, 0, 0);
    return d.toISOString();
  }

  async function toggleBlocked(day: Date, slot: Slot) {
    const iso = slotIso(day, slot);
    if (bookedSet.has(iso)) return; // never block over a real booking
    const isBlocked = blockedMap.has(iso);
    const action = isBlocked ? 'unblock' : 'block';
    let reason: string | null = null;
    if (action === 'block') {
      reason = window.prompt('Reason for blocking this slot? (optional)') ?? null;
    }
    setBusy(iso);
    setError(null);
    try {
      const res = await fetch('/api/admin/booking-availability', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slotISO: iso, action, reason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.message || j.error || 'Could not update slot.');
        setBusy(null);
        return;
      }
      await refresh();
    } catch (err) {
      setError((err as Error).message || 'Network error.');
    } finally {
      setBusy(null);
    }
  }

  function isPast(day: Date, slot: Slot): boolean {
    const d = new Date(day);
    d.setHours(slot.hour, slot.minute, 0, 0);
    return d <= now;
  }

  const canGoPrev = weekStart > startOfWeek(now);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          disabled={!canGoPrev}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-sm font-medium text-slate-900">
          {weekDays[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {weekDays[4].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </h3>
        <button
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600">
        <Legend className="bg-slate-50 border-slate-200" label="Available" />
        <Legend className="bg-orange-50 border-orange-200 text-orange-800" label="Booked (real customer)" />
        <Legend className="bg-red-50 border-red-200 text-red-800" label="Blocked by you" />
        <Legend className="bg-slate-100 border-slate-200 text-slate-400" label="Past" />
        <span className="text-slate-500">Click a slot to block / unblock.</span>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className="w-20 px-2 py-2 text-xs font-medium text-slate-500">Time</th>
              {weekDays.map((day) => (
                <th key={day.toISOString()} className="px-2 py-2 text-xs font-medium text-slate-700">
                  <span className="block">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                  <span className="block text-[10px] uppercase text-slate-500">
                    {day.getDate()}/{day.getMonth() + 1}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={`${slot.hour}-${slot.minute}`}>
                <td className="px-2 py-1 text-xs text-slate-500">{formatTime(slot.hour, slot.minute)}</td>
                {weekDays.map((day) => {
                  const iso = slotIso(day, slot);
                  const past = isPast(day, slot);
                  const booked = !past && bookedSet.has(iso);
                  const blocked = !past && blockedMap.has(iso);
                  const reason = blockedMap.get(iso) ?? null;
                  const loading = busy === iso;
                  let cls = 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100';
                  let label: string = formatTime(slot.hour, slot.minute);
                  if (past) {
                    cls = 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400';
                    label = '-';
                  } else if (booked) {
                    cls = 'cursor-not-allowed border-orange-200 bg-orange-50 text-orange-800 font-medium';
                    label = 'Booked';
                  } else if (blocked) {
                    cls = 'border-red-200 bg-red-50 text-red-800 font-medium hover:bg-red-100';
                    label = reason ? '🚫' : 'Blocked';
                  }
                  return (
                    <td key={iso} className="px-1 py-1">
                      <button
                        onClick={() => toggleBlocked(day, slot)}
                        disabled={past || booked || loading}
                        title={blocked && reason ? `Blocked: ${reason}` : undefined}
                        className={`w-full rounded-lg border px-2 py-1.5 text-xs transition ${cls} ${loading ? 'opacity-50' : ''}`}
                      >
                        {loading ? '…' : label}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-6 rounded border ${className}`} />
      {label}
    </span>
  );
}
