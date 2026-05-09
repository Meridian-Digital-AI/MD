import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/admin/AdminHeader';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader email={profile?.email ?? null} />

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-2 text-sm">
          <Link
            href="/admin"
            className="text-slate-600 hover:text-[var(--color-navy-900)]"
          >
            Clients
          </Link>
          <Link
            href="/admin/access"
            className="text-slate-600 hover:text-[var(--color-navy-900)]"
          >
            Access
          </Link>
          <Link
            href="/admin/booking-availability"
            className="text-slate-600 hover:text-[var(--color-navy-900)]"
          >
            Bookings
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
