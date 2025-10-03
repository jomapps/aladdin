import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      // Movie clapperboard icon with film reel elements
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRadius: '40px',
        }}
      >
        {/* Clapperboard top stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '32px',
            background:
              'linear-gradient(90deg, #000 0%, #000 20%, #fff 20%, #fff 40%, #000 40%, #000 60%, #fff 60%, #fff 80%, #000 80%)',
            transform: 'skewY(-3deg)',
            transformOrigin: 'top left',
            borderTopLeftRadius: '40px',
            borderTopRightRadius: '40px',
          }}
        />
        {/* Play button/Film reel center */}
        <div
          style={{
            width: '90px',
            height: '90px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '10px',
          }}
        >
          {/* Play triangle */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '50px solid white',
              borderTop: '30px solid transparent',
              borderBottom: '30px solid transparent',
              marginLeft: '10px',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
