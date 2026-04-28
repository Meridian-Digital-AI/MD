'use client';

import { useState } from 'react';

export default function LeadSnippet({ slug, apiKey }: { slug: string; apiKey: string }) {
  const [revealed, setReveal] = useState(false);
  const [tab, setTab] = useState<'snippet' | 'curl'>('snippet');
  const [copied, setCopied] = useState(false);

  const endpoint = `https://www.meridian-digital-partners.com/api/leads/${slug}`;
  const masked = apiKey.slice(0, 8) + '••••••••••••••••••••••••' + apiKey.slice(-4);
  const visibleKey = revealed ? apiKey : masked;

  const snippet = `<script>
(function () {
  var ENDPOINT = '${endpoint}';
  var KEY = '${revealed ? apiKey : 'YOUR_API_KEY'}';

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM' || !f.matches('[data-meridian], [data-md-lead]')) return;
    e.preventDefault();
    var data = {};
    new FormData(f).forEach(function (v, k) { data[k] = v; });
    data.source = data.source || 'contact-form';
    data.source_page = location.pathname;
    data.referrer = document.referrer || null;
    var p = new URLSearchParams(location.search);
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function (k) {
      if (p.get(k)) data[k] = p.get(k);
    });
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY },
      body: JSON.stringify(data),
    }).then(function (r) {
      if (r.ok) { f.reset(); f.dispatchEvent(new CustomEvent('meridian:success')); }
      else { f.dispatchEvent(new CustomEvent('meridian:error')); }
    });
  });
})();
</script>`;

  const curl = `curl -X POST '${endpoint}' \\
  -H 'Authorization: Bearer ${revealed ? apiKey : 'YOUR_API_KEY'}' \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Test Lead","email":"test@example.com","message":"Hi from curl"}'`;

  const text = tab === 'snippet' ? snippet : curl;

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
        <span className="text-slate-400">API key:</span>
        <span className="flex-1 truncate">{visibleKey}</span>
        <button
          onClick={() => setReveal((r) => !r)}
          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setTab('snippet')}
          className={`px-3 py-1.5 ${tab === 'snippet' ? 'border-b-2 border-[var(--color-blue-600)] font-semibold text-[var(--color-navy-900)]' : 'text-slate-500'}`}
        >
          Drop-in snippet
        </button>
        <button
          onClick={() => setTab('curl')}
          className={`px-3 py-1.5 ${tab === 'curl' ? 'border-b-2 border-[var(--color-blue-600)] font-semibold text-[var(--color-navy-900)]' : 'text-slate-500'}`}
        >
          curl test
        </button>
        <div className="ml-auto">
          <button
            onClick={copy}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
        <code>{text}</code>
      </pre>

      {tab === 'snippet' && (
        <p className="text-xs text-slate-500">
          Tag any form on your site with <code className="rounded bg-slate-100 px-1">data-meridian</code> (e.g.{' '}
          <code className="rounded bg-slate-100 px-1">{'<form data-meridian>'}</code>) and submissions will land in your
          Leads tab. Standard inputs <code className="rounded bg-slate-100 px-1">name</code>,{' '}
          <code className="rounded bg-slate-100 px-1">email</code>,{' '}
          <code className="rounded bg-slate-100 px-1">phone</code>, and{' '}
          <code className="rounded bg-slate-100 px-1">message</code> map automatically.
        </p>
      )}

      {!revealed && (
        <p className="text-xs text-amber-600">
          Reveal the API key before copying — the snippet has a placeholder right now.
        </p>
      )}
    </div>
  );
}
