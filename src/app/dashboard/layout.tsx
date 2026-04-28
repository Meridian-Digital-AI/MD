import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sectionsForTier, SECTION_LABELS, TIER_LABELS, type PackageTier } from '@/lib/dashboard/packageFeatures';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch user profile + linked client
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, role, client_id, full_name')
    .eq('id', user.id)
    .single();

  // Admins viewing /dashboard see a notice (their main view is /admin).
  if (profile?.role === 'admin') {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
          <h1 className="text-xl font-semibold text-[var(--color-navy-900)]">Admin signed in</h1>
          <p className="mt-2 text-slate-600">
            You&apos;re logged in as an admin. The client dashboard view is reached by drilling into a
            specific client from the admin console.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-block rounded-lg bg-[var(--color-blue-600)] px-4 py-2 font-semibold text-white"
          >
            Go to admin console →
          </Link>
        </div>
      </main>
    );
  }

  if (!profile?.client_id) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow">
          <h1 className="text-xl font-semibold text-[var(--color-navy-900)]">Account not linked yet</h1>
          <p className="mt-2 text-slate-600">
            Your account isn&apos;t linked to a business yet. Drop us an email at{' '}
            <a className="text-[var(--color-blue-600)] underline" href="mailto:wandj@meridian-digital-partners.com">
              wandj@meridian-digital-partners.com
            </a>{' '}
            and we&apos;ll connect you.
          </p>
          <form action="/auth/signout" method="post" className="mt-6">
            <button className="text-sm text-slate-500 underline">Sign out</button>
          </form>
        </div>
      </main>
    );
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, slug, package_tier, domain')
    .eq('id', profile.client_id)
    .single();

  if (!client) redirect('/login');

  const tier = client.package_tier as PackageTier;
  const sections = sectionsForTier(tier);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
              ← Meridian Digital
            </Link>
            <div className="mt-1 flex items-baseline gap-3">
              <h1 className="text-lg font-semibold text-[var(--color-navy-900)]">
                {client.business_name}
              </h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {TIER_LABELS[tier]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">{profile.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-slate-500 underline hover:text-slate-900">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <DashboardNav sections={sections} sectionLabels={SECTION_LABELS} />

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
