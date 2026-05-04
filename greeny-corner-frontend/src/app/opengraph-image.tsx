import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Greeny Corner - Smart Plant Care & Identification App';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>🌿</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#065f46',
            letterSpacing: '-2px',
            marginBottom: 12,
          }}
        >
          Greeny Corner
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#047857',
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          Smart Plant Care & AI Identification
        </div>
        <div
          style={{
            marginTop: 32,
            background: '#059669',
            color: '#fff',
            padding: '12px 32px',
            borderRadius: 50,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          www.greenycorner.ae
        </div>
      </div>
    ),
    { ...size }
  );
}
