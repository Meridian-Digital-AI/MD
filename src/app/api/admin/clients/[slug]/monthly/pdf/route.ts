// GET /api/admin/clients/:slug/monthly/pdf?month=YYYY-MM
//
// Generates a one-page PDF report for the client's selected month and
// streams it back as a download. Pulls the same data the on-screen
// monthly view shows: lead/pageview counts, Meta insights (if linked),
// and the deliverables checklist.

import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { TIER_LABELS, type PackageTier } from '@/lib/dashboard/packageFeatures';
import { getAgencyMetaConnection } from '@/lib/meta/connection';
import { fetchMetaInsights } from '@/lib/meta/api';
import {
  MonthlyReportDocument,
  type MonthlyReportData,
} from '@/lib/pdf/MonthlyReportDocument';
import type { DeliverableType } from '@/lib/dashboard/deliverableTemplates';

// react-pdf needs the Node runtime — Edge can't pull in the canvas/font shims.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isValidYearMonth(s: string): boolean {
  return /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(s);
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthRange(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(end.getTime() - 1);
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    sinceDay: start.toISOString().slice(0, 10),
    untilDay: lastDay.toISOString().slice(0, 10),
    label: `${MONTH_NAMES[m - 1]} ${y}`,
  };
}

function safeFilename(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toLowerCase();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { slug } = await params;
  const url = new URL(request.url);
  const monthParam = url.searchParams.get('month');
  const month = monthParam && isValidYearMonth(monthParam) ? monthParam : currentYearMonth();
  const range = monthRange(month);

  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, slug, package_tier, meta_ad_account_id')
    .eq('slug', slug)
    .single();
  if (!client) return NextResponse.json({ error: 'client_not_found' }, { status: 404 });

  const tier = client.package_tier as PackageTier;
  const admin = createSupabaseAdminClient();
  const [leadsRes, pvRes, deliverablesRes, metaConn] = await Promise.all([
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .gte('created_at', range.startISO)
      .lt('created_at', range.endISO),
    supabase
      .from('pageviews')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .gte('ts', range.startISO)
      .lt('ts', range.endISO),
    admin
      .from('client_deliverables')
      .select('title, type, notes, completed_at, order_index, created_at')
      .eq('client_id', client.id)
      .eq('year_month', month)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true }),
    getAgencyMetaConnection(),
  ]);

  let adSpend: number | null = null;
  let metaImpressions: number | null = null;
  let metaClicks: number | null = null;
  if (metaConn && client.meta_ad_account_id) {
    try {
      const ins = await fetchMetaInsights(metaConn.access_token, client.meta_ad_account_id, {
        since: range.sinceDay,
        until: range.untilDay,
      });
      adSpend = ins?.spend ?? 0;
      metaImpressions = ins?.impressions ?? 0;
      metaClicks = ins?.clicks ?? 0;
    } catch {
      // Non-fatal — leave nulls so the PDF shows "—".
    }
  }

  const leadCount = leadsRes.count ?? 0;
  const cpl = adSpend !== null && leadCount > 0 ? adSpend / leadCount : null;

  const data: MonthlyReportData = {
    businessName: client.business_name as string,
    monthLabel: range.label,
    tierLabel: TIER_LABELS[tier],
    leadCount,
    pageviewCount: pvRes.count ?? 0,
    adSpend,
    costPerLead: cpl,
    metaImpressions,
    metaClicks,
    deliverables: (deliverablesRes.data ?? []).map((d) => ({
      title: d.title as string,
      type: d.type as DeliverableType,
      notes: (d.notes as string | null) ?? null,
      completedAt: (d.completed_at as string | null) ?? null,
    })),
    generatedAt: new Date().toISOString(),
  };

  // MonthlyReportDocument returns a <Document> at the top level; the
  // explicit cast satisfies renderToBuffer's stricter signature.
  const element = createElement(MonthlyReportDocument, { data }) as unknown as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);
  const filename = `${safeFilename(client.business_name as string)}-${month}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
