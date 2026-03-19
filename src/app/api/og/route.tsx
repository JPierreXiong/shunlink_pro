import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'Backlinks on Autopilot.';
    const subtitle = searchParams.get('subtitle') || 'Proof in Every Post.';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0f1e',
            backgroundImage: 'linear-gradient(135deg, #0d1b2a 0%, #1a2744 100%)',
            padding: '60px',
          }}
        >
          {/* Logo and Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 50,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                marginRight: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              >
                L
              </div>
            </div>

            <div
              style={{
                fontSize: 52,
                fontWeight: 'bold',
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              LinkFlow AI
            </div>
          </div>

          {/* Main Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: '#fff',
              textAlign: 'center',
              maxWidth: 1000,
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 42,
              color: '#60a5fa',
              textAlign: 'center',
              marginBottom: 60,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: 40,
              fontSize: 28,
              color: '#94a3b8',
              marginBottom: 40,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#4ade80', marginRight: 8 }}>✓</span>
              48-Hour Delivery
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#4ade80', marginRight: 8 }}>✓</span>
              Screenshot Proof
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#4ade80', marginRight: 8 }}>✓</span>
              DA 50+ Platforms
            </div>
          </div>

          {/* URL */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              fontSize: 24,
              color: '#64748b',
              letterSpacing: '0.05em',
            }}
          >
            www.linkflowai.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
