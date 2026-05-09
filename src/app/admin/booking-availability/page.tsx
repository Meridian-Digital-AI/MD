import Link from 'next/link';
import AdminBookingCalendar from './AdminBookingCalendar';

export const dynamic = 'force-dynamic';

export default function AdminBookingAvailabilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to admin
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">
          Booking availability
        </h2>
        <p className="mt-1 text-slate-600">
          Click any future slot to block it (out-of-office, doctor appt, etc.) or to remove a block. Real customer bookings show as orange and can&apos;t be modified here.
        </p>
      </div>

      <AdminBookingCalendar />
    </div>
  );
}
