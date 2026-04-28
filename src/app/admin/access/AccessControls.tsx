'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Pending = { id: string; email: string; created_at: string; ip_hash: string | null; user_agent: string | null };
type Approved = { email: string; role: string; client_id: string | null; business_name_hint: string | null; notes: string | null; created_at: string };
type Client = { id: string; business_name: string; slug: string };

export default function AccessControls({
  pending,
  approved,
  clients,
}: {
  pending: Pending[];
  approved: Approved[];
  clients: Client[];
}) {
  const router = useRouter();
  const [pending2, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Manual-add form state
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'client' | 'admin'>('client');
  const [newClientId, setNewClientId] = useState<string>('');
  const [newNotes, setNewNotes] = useState('');

  async function call(action: string, body: Record<string, unknown>, key: string) {
    setBusy(key);
    setErr(null);
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'failed');
      startTransition(() => router.refresh());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* PENDING REQUESTS */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--color-navy-900)]">
          Pending requests <span className="ml-1 text-slate-400">({pending.length})</span>
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          People who tried to sign in but aren&apos;t on the allowlist.
        </p>

        {pending.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No pending requests.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex-1 min-w-[240px]">
                  <div className="text-sm font-medium text-slate-900">{p.email}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(p.created_at).toLocaleString()}
                    {p.user_agent ? ' · ' + p.user_agent.slice(0, 60) : ''}
                  </div>
                </div>

                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                  defaultValue=""
                  id={`client-${p.id}`}
                >
                  <option value="">— No client (admin or unlinked)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                  defaultValue="client"
                  id={`role-${p.id}`}
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  disabled={busy === p.id || pending2}
                  onClick={() => {
                    const clientId = (document.getElementById(`client-${p.id}`) as HTMLSelectElement).value || null;
                    const role = (document.getElementById(`role-${p.id}`) as HTMLSelectElement).value as 'client' | 'admin';
                    void call('approve', { request_id: p.id, email: p.email, role, client_id: clientId }, p.id);
                  }}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy === p.id ? '…' : 'Approve'}
                </button>
                <button
                  disabled={busy === p.id || pending2}
                  onClick={() => void call('reject', { request_id: p.id }, p.id)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* MANUAL ADD */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--color-navy-900)]">Pre-approve an email</h3>
        <p className="mt-1 text-sm text-slate-600">
          Add someone to the allowlist before they try to sign in.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="email"
            placeholder="email@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'client' | 'admin')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={newClientId}
            onChange={(e) => setNewClientId(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.business_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-3"
          />
          <button
            disabled={!newEmail.trim() || busy === 'add'}
            onClick={() => {
              void call(
                'add',
                {
                  email: newEmail.trim().toLowerCase(),
                  role: newRole,
                  client_id: newClientId || null,
                  notes: newNotes || null,
                },
                'add',
              ).then(() => {
                setNewEmail('');
                setNewClientId('');
                setNewNotes('');
              });
            }}
            className="rounded bg-[var(--color-blue-600)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy === 'add' ? '…' : 'Add to allowlist'}
          </button>
        </div>
      </section>

      {/* CURRENT ALLOWLIST */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--color-navy-900)]">
          Allowlist <span className="ml-1 text-slate-400">({approved.length})</span>
        </h3>
        {approved.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No emails on the allowlist yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Client</th>
                <th className="pb-2">Notes</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approved.map((a) => {
                const client = clients.find((c) => c.id === a.client_id);
                return (
                  <tr key={a.email}>
                    <td className="py-2 font-medium text-slate-900">{a.email}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          a.role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {a.role}
                      </span>
                    </td>
                    <td className="py-2 text-slate-600">{client?.business_name ?? '—'}</td>
                    <td className="py-2 text-slate-500">{a.notes ?? ''}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${a.email} from allowlist?`)) {
                            void call('remove', { email: a.email }, a.email);
                          }
                        }}
                        disabled={busy === a.email}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
