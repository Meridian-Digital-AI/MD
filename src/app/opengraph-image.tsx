import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Meridian Digital — Websites with Built-in Automation';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(135deg, #0B1120 0%, #1A2744 100%)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* M mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #0B1120 0%, #1A2744 100%)',
              border: '2px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="80" height="80" viewBox="0 0 512 512">
              <path
                d="M 104 384 L 104 128 L 168 128 L 256 280 L 344 128 L 408 128 L 408 384 L 352 384 L 352 232 L 280 360 L 232 360 L 160 232 L 160 384 Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '32px',
              letterSpacing: '0.16em',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            <span>MERIDIAN</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>DIGITAL</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: '76px',
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: '900px',
            }}
          >
            Websites with built-in automation.
          </div>
          <div
            style={{
              fontSize: '30px',
              color: '#94A3B8',
              maxWidth: '900px',
            }}
          >
            For local businesses that want more than a brochure site.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
