'use client';

import { useState, useMemo, useEffect } from 'react';
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
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
  });
  const [bookedSet, setBookedSet] = useState<Set<string>>(new Set());
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());

  // Mon-Fri for the current week view
  const weekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // Fetch availability for the visible week whenever weekStart changes.
  useEffect(() => {
    let cancelled = false;
    const from = new Date(weekStart);
    const to = addDays(weekStart, 7);
    fetch(`/api/booking/availability?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((j: { booked?: string[]; blocked?: { slot_iso: string }[] }) => {
        if (cancelled) return;
        setBookedSet(new Set((j.booked || []).map((s) => new Date(s).toISOString())));
        setBlockedSet(new Set((j.blocked || []).map((b) => new Date(b.slot_iso).toISOString())));
      })
      .catch(() => { /* ignore — calendar still works, just no greying */ });
    return () => { cancelled = true; };
  }, [weekStart]);

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

  function slotIso(day: Date, slot: Slot): string {
    const d = new Date(day);
    d.setHours(slot.hour, slot.minute, 0, 0);
    return d.toISOString();
  }

  function isBooked(day: Date, slot: Slot): boolean {
    return bookedSet.has(slotIso(day, slot));
  }
  function isBlocked(day: Date, slot: Slot): boolean {
    return blockedSet.has(slotIso(day, slot));
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
    if (isPast(day, slot) || isBooked(day, slot) || isBlocked(day, slot)) return;
    setConfirmed(false);
    setErrorMsg(null);
    setSelected({ date: day, slot });
  }

  async function handleConfirm() {
    if (!selected || submitting) return;

    if (!form.name.trim() || !form.email.trim()) {
      setErrorMsg('Please enter your name and email.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const slotDate = new Date(selected.date);
    slotDate.setHours(selected.slot.hour, selected.slot.minute, 0, 0);

    const slotDisplay = `${slotDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} at ${formatTime(selected.slot.hour, selected.slot.minute)}`;

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          businessName: form.businessName,
          slotISO: slotDate.toISOString(),
          slotDisplay,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setConfirmed(true);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
                  const booked = !past && isBooked(day, slot);
                  const blocked = !past && !booked && isBlocked(day, slot);
                  const unavail = past || booked || blocked;
                  const sel = isSelected(day, slot);
                  let label: string;
                  if (sel) label = 'Selected';
                  else if (past) label = '-';
                  else if (booked) label = 'Booked';
                  else if (blocked) label = '—';
                  else label = formatTime(slot.hour, slot.minute);

                  return (
                    <td key={day.toISOString()} className="px-1 py-1">
                      <button
                        onClick={() => handleSelect(day, slot)}
                        disabled={unavail}
                        className={`w-full rounded-lg border px-2 py-1.5 text-small transition ${
                          sel
                            ? 'border-blue-600 bg-blue-600 font-medium text-white'
                            : unavail
                              ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-300'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                        aria-label={`${formatTime(slot.hour, slot.minute)} on ${formatDate(day)}${booked ? ' — already booked' : blocked ? ' — unavailable' : ''}`}
                      >
                        {label}
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
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="mb-4">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Your name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-small text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
            <input
              type="email"
              required
              placeholder="Email *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-small text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-small text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Business name (optional)"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-small text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <p className="mt-3 text-small text-red-600">{errorMsg}</p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
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
