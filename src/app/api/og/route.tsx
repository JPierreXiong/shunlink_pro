import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters from URL
    const title = searchParams.get('title') || 'Monitor All Your Websites';
    const subtitle = searchParams.get('subtitle') || 'in One Dashboard';
    const page = searchParams.get('page') || 'home';

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
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(135deg, #1e3a2e 0%, #4a5d23 100%)',
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
            {/* Logo Circle */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2d5016 0%, #c9a961 100%)',
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
                S
              </div>
            </div>
            
            {/* Brand Name */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              SoloBoard
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
              color: '#c9a961',
              textAlign: 'center',
              marginBottom: 60,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </div>

          {/* Features Grid */}
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
              GA4 Analytics
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#4ade80', marginRight: 8 }}>✓</span>
              Revenue Tracking
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#4ade80', marginRight: 8 }}>✓</span>
              Uptime Monitoring
            </div>
          </div>

          {/* Dashboard Preview (Simple Grid) */}
          {page === 'home' && (
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 40,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 80,
                    height: 80,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    border: '2px solid rgba(201, 169, 97, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    fontSize: 14,
                  }}
                >
                  {i}
                </div>
              ))}
            </div>
          )}

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
            www.soloboard.app
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


