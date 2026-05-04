// Server-only — uses @react-pdf/renderer which only runs in Node.
// Renders the per-client monthly report we email/hand to clients at
// month-end.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { DeliverableType } from '@/lib/dashboard/deliverableTemplates';

// Built-in Helvetica is the safe default for serverless — no font fetch.
Font.registerHyphenationCallback((word) => [word]);

const NAVY = '#0a1832';
const SLATE_900 = '#0f172a';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748b';
const SLATE_300 = '#cbd5e1';
const SLATE_100 = '#f1f5f9';
const EMERALD_700 = '#047857';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: SLATE_900,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_300,
    borderBottomStyle: 'solid',
  },
  brand: {
    fontSize: 11,
    color: NAVY,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
  },
  reportLabel: {
    fontSize: 9,
    color: SLATE_500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginTop: 24,
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: SLATE_500,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 10,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: SLATE_900,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    backgroundColor: SLATE_100,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 8,
    color: SLATE_500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: SLATE_900,
  },
  statHint: {
    marginTop: 2,
    fontSize: 8,
    color: SLATE_500,
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: SLATE_100,
    borderBottomStyle: 'solid',
  },
  tick: {
    width: 10,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: EMERALD_700,
    marginRight: 6,
  },
  tickEmpty: {
    width: 10,
    fontSize: 10,
    color: SLATE_300,
    marginRight: 6,
  },
  deliverableTitle: {
    flex: 1,
    fontSize: 10,
    color: SLATE_900,
  },
  deliverableTitleDone: {
    flex: 1,
    fontSize: 10,
    color: SLATE_500,
    textDecoration: 'line-through',
  },
  deliverableType: {
    fontSize: 8,
    color: SLATE_500,
    width: 50,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  deliverableNotes: {
    marginLeft: 16,
    marginTop: 2,
    marginBottom: 2,
    fontSize: 9,
    color: SLATE_700,
    fontStyle: 'italic',
  },
  emptyState: {
    fontSize: 10,
    color: SLATE_500,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: SLATE_500,
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: SLATE_300,
    borderTopStyle: 'solid',
  },
});

export type MonthlyReportData = {
  businessName: string;
  monthLabel: string;        // e.g. "May 2026"
  tierLabel: string;
  leadCount: number;
  pageviewCount: number;
  adSpend: number | null;
  costPerLead: number | null;
  metaImpressions: number | null;
  metaClicks: number | null;
  deliverables: Array<{
    title: string;
    type: DeliverableType;
    notes: string | null;
    completedAt: string | null;
  }>;
  generatedAt: string;       // ISO
};

const fmtNum = (n: number) =>
  n.toLocaleString('en-GB', { maximumFractionDigits: 0 });

const fmtCurrency = (n: number) =>
  `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

export function MonthlyReportDocument({ data }: { data: MonthlyReportData }) {
  const completedCount = data.deliverables.filter((d) => d.completedAt).length;
  const total = data.deliverables.length;

  return (
    <Document
      title={`${data.businessName} — ${data.monthLabel} Report`}
      author="Meridian Digital"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>MERIDIAN DIGITAL</Text>
          <Text style={styles.reportLabel}>Monthly Report</Text>
        </View>

        <Text style={styles.title}>{data.businessName}</Text>
        <Text style={styles.subtitle}>
          {data.monthLabel} · {data.tierLabel}
        </Text>

        <Text style={styles.sectionTitle}>This month at a glance</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Leads</Text>
            <Text style={styles.statValue}>{fmtNum(data.leadCount)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pageviews</Text>
            <Text style={styles.statValue}>{fmtNum(data.pageviewCount)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ad spend</Text>
            <Text style={styles.statValue}>
              {data.adSpend === null ? '—' : fmtCurrency(data.adSpend)}
            </Text>
            {data.adSpend === null && (
              <Text style={styles.statHint}>No ads tracked</Text>
            )}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cost per lead</Text>
            <Text style={styles.statValue}>
              {data.costPerLead === null ? '—' : `£${data.costPerLead.toFixed(2)}`}
            </Text>
          </View>
        </View>

        {(data.metaImpressions !== null || data.metaClicks !== null) && (
          <>
            <Text style={styles.sectionTitle}>Meta Ads</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Impressions</Text>
                <Text style={styles.statValue}>
                  {fmtNum(data.metaImpressions ?? 0)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Clicks</Text>
                <Text style={styles.statValue}>
                  {fmtNum(data.metaClicks ?? 0)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>CTR</Text>
                <Text style={styles.statValue}>
                  {data.metaImpressions && data.metaImpressions > 0
                    ? `${(((data.metaClicks ?? 0) / data.metaImpressions) * 100).toFixed(2)}%`
                    : '—'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>CPC</Text>
                <Text style={styles.statValue}>
                  {data.metaClicks && data.metaClicks > 0 && data.adSpend !== null
                    ? `£${(data.adSpend / data.metaClicks).toFixed(2)}`
                    : '—'}
                </Text>
              </View>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>
          What we shipped {total > 0 ? `(${completedCount}/${total})` : ''}
        </Text>
        {data.deliverables.length === 0 ? (
          <Text style={styles.emptyState}>
            No deliverables logged for this month.
          </Text>
        ) : (
          <View>
            {data.deliverables.map((d, idx) => (
              <View key={idx}>
                <View style={styles.deliverableRow}>
                  {d.completedAt ? (
                    <Text style={styles.tick}>✓</Text>
                  ) : (
                    <Text style={styles.tickEmpty}>○</Text>
                  )}
                  <Text
                    style={
                      d.completedAt
                        ? styles.deliverableTitleDone
                        : styles.deliverableTitle
                    }
                  >
                    {d.title}
                  </Text>
                  <Text style={styles.deliverableType}>{d.type}</Text>
                </View>
                {d.notes ? (
                  <Text style={styles.deliverableNotes}>{d.notes}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer} fixed>
          Meridian Digital · meridian-digital-partners.com · Generated{' '}
          {new Date(data.generatedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </Page>
    </Document>
  );
}
