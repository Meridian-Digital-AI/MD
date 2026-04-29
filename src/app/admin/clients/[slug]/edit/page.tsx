import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import EditClientForm from './EditClientForm';

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: client } = await supabase
    .from('clients')
    .select('slug, business_name, package_tier, domain')
    .eq('slug', slug)
    .single();
  if (!client) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href={`/admin/clients/${slug}`} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to {client.business_name}
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">
          Edit client
        </h2>
        <p className="mt-1 text-slate-600">
          Slug and API key are intentionally not editable here — they&rsquo;re baked into demo-site env vars.
        </p>
      </div>

      <EditClientForm
        slug={client.slug}
        initialBusinessName={client.business_name}
        initialTier={client.package_tier}
        initialDomain={client.domain ?? ''}
      />
    </div>
  );
}
