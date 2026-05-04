// Health-score algorithm.
// Pure function — takes raw signals, returns a 1-10 score + a breakdown so
// the admin UI can show *why* the client got the score they did.
//
// Used by:
//   - /admin (live grid: computes per-client at render time)
//   - /admin/clients/[slug] (shows breakdown + writes the score back to
//     clients.health_score so other parts of the app can read a cached value)

export type HealthBreakdownComponent = {
  key: string;
  label: string;
  points: number;
  max: number;
  detail: string;
};

export type HealthTrend = 'up' | 'flat' | 'down' | 'neutral';

export type HealthBreakdown = {
  score: number;            // 1-10
  components: HealthBreakdownComponent[];
  isNewClient: boolean;     // <14 days old → defaulted to 5
  computedAt: string;       // ISO timestamp
  trend: HealthTrend;       // derived from lead-trend component (or 'neutral' for new clients)
  trendDetail: string;      // human-readable, e.g. "Up 40% vs prior 30 days"
};

export type HealthSignals = {
  // ms since unix epoch — when the client was created
  clientCreatedAt: Date | string;
  // Raw counts
  leadsLast30d: number;
  leadsPrior30d: number;       // 60d ago to 30d ago
  pageviewsLast30d: number;
  // Most recent activity
  lastLeadAt: Date | string | null;
  lastPageviewAt: Date | string | null;
  // Integrations
  hasConnectedIntegration: boolean;
};

const NEW_CLIENT_DAYS = 14;
const NEW_CLIENT_DEFAULT_SCORE = 5;

function daysAgo(value: Date | string | null | undefined, now: Date): number | null {
  if (!value) return null;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
}

function leadVolumePoints(n: number): { points: number; detail: string } {
  if (n >= 10) return { points: 3, detail: `${n} leads in the last 30 days` };
  if (n >= 3) return { points: 2, detail: `${n} leads in the last 30 days` };
  if (n >= 1) return { points: 1, detail: `${n} lead${n === 1 ? '' : 's'} in the last 30 days` };
  return { points: 0, detail: 'No leads in the last 30 days' };
}

function leadTrendPoints(last: number, prior: number): { points: number; detail: string } {
  // If both are 0, no signal — give 1 (neutral).
  if (last === 0 && prior === 0) {
    return { points: 1, detail: 'No leads either period — neutral' };
  }
  if (prior === 0) {
    // Going from 0 → something is good.
    return { points: 2, detail: `Up from 0 leads to ${last}` };
  }
  const change = (last - prior) / prior;
  const pct = Math.round(change * 100);
  if (change >= 0.1) return { points: 2, detail: `Up ${pct}% vs prior 30 days (${prior}→${last})` };
  if (change > -0.3) return { points: 1, detail: `Flat (${pct >= 0 ? '+' : ''}${pct}%, ${prior}→${last})` };
  return { points: 0, detail: `Down ${pct}% vs prior 30 days (${prior}→${last})` };
}

function trafficPoints(n: number): { points: number; detail: string } {
  if (n >= 50) return { points: 2, detail: `${n} pageviews in the last 30 days` };
  if (n >= 1) return { points: 1, detail: `${n} pageview${n === 1 ? '' : 's'} in the last 30 days` };
  return { points: 0, detail: 'No pageviews in the last 30 days' };
}

function recencyPoints(
  lastLeadAt: Date | string | null,
  lastPageviewAt: Date | string | null,
  now: Date,
): { points: number; detail: string } {
  const leadAge = daysAgo(lastLeadAt, now);
  const pvAge = daysAgo(lastPageviewAt, now);
  const ages = [leadAge, pvAge].filter((x): x is number => x !== null);
  if (ages.length === 0) return { points: 0, detail: 'No recorded activity yet' };
  const min = Math.min(...ages);
  if (min < 7) return { points: 2, detail: `Last activity ${Math.floor(min)} day${Math.floor(min) === 1 ? '' : 's'} ago` };
  if (min < 30) return { points: 1, detail: `Last activity ${Math.floor(min)} days ago` };
  return { points: 0, detail: `Last activity ${Math.floor(min)} days ago` };
}

function integrationPoints(hasConnected: boolean): { points: number; detail: string } {
  return hasConnected
    ? { points: 1, detail: 'At least one integration connected' }
    : { points: 0, detail: 'No integrations connected yet' };
}

export function computeHealthScore(signals: HealthSignals, now: Date = new Date()): HealthBreakdown {
  const ageDays = daysAgo(signals.clientCreatedAt, now) ?? 0;
  const isNewClient = ageDays < NEW_CLIENT_DAYS;

  if (isNewClient) {
    return {
      score: NEW_CLIENT_DEFAULT_SCORE,
      isNewClient: true,
      computedAt: now.toISOString(),
      trend: 'neutral',
      trendDetail: 'Too new to compute trend',
      components: [
        {
          key: 'new_client',
          label: 'New client (under 14 days)',
          points: NEW_CLIENT_DEFAULT_SCORE,
          max: 10,
          detail: `Defaulted to ${NEW_CLIENT_DEFAULT_SCORE}/10 until enough history exists. Client age: ${Math.floor(ageDays)} day${Math.floor(ageDays) === 1 ? '' : 's'}.`,
        },
      ],
    };
  }

  const volume = leadVolumePoints(signals.leadsLast30d);
  const trend = leadTrendPoints(signals.leadsLast30d, signals.leadsPrior30d);
  const traffic = trafficPoints(signals.pageviewsLast30d);
  const recency = recencyPoints(signals.lastLeadAt, signals.lastPageviewAt, now);
  const integrations = integrationPoints(signals.hasConnectedIntegration);

  const total = volume.points + trend.points + traffic.points + recency.points + integrations.points;
  const score = Math.max(1, Math.min(10, total));

  // Derive trend label from the lead-trend component scoring.
  // 2 → up, 1 → flat, 0 → down. If both periods had zero leads, treat as neutral.
  let trendLabel: HealthTrend;
  if (signals.leadsLast30d === 0 && signals.leadsPrior30d === 0) {
    trendLabel = 'neutral';
  } else if (trend.points >= 2) {
    trendLabel = 'up';
  } else if (trend.points === 1) {
    trendLabel = 'flat';
  } else {
    trendLabel = 'down';
  }

  return {
    score,
    isNewClient: false,
    computedAt: now.toISOString(),
    trend: trendLabel,
    trendDetail: trend.detail,
    components: [
      { key: 'lead_volume', label: 'Lead volume (30d)', points: volume.points, max: 3, detail: volume.detail },
      { key: 'lead_trend', label: 'Lead trend (vs prior 30d)', points: trend.points, max: 2, detail: trend.detail },
      { key: 'traffic', label: 'Traffic (30d)', points: traffic.points, max: 2, detail: traffic.detail },
      { key: 'recency', label: 'Recency', points: recency.points, max: 2, detail: recency.detail },
      { key: 'integrations', label: 'Integrations', points: integrations.points, max: 1, detail: integrations.detail },
    ],
  };
}
