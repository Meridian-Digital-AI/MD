import { createSupabaseServerClient } from '@/lib/supabase/server';
import AccessControls from './AccessControls';

export default async function AccessPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: pending }, { data: approved }, { data: clients }] = await Promise.all([
    supabase
      .from('signup_requests')
      .select('id, email, status, created_at, ip_hash, user_agent')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('approved_emails')
      .select('email, role, client_id, business_name_hint, notes, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('id, business_name, slug').order('business_name'),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Access control</h2>
        <p className="mt-1 text-slate-600">
          Only emails on the allowlist can sign in. New attempts queue here for your approval.
        </p>
      </div>

      <AccessControls
        pending={pending ?? []}
        approved={approved ?? []}
        clients={clients ?? []}
      />
    </div>
  );
}
