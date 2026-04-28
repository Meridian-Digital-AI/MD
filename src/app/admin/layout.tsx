import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
      <header className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
              ← Meridian Digital
            </Link>
            <div className="mt-1 flex items-baseline gap-3">
              <h1 className="text-lg font-semibold text-[var(--color-navy-900)]">
                Admin Console
              </h1>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
                You see everything
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">{profile?.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-slate-500 underline hover:text-slate-900">Sign out</button>
            </form>
          </div>
        </div>
      </header>

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
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
