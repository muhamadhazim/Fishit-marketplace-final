import { ImageResponse } from 'next/og'
 
// Route segment config
export const runtime = 'edge'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(to bottom right, #06b6d4, #8b5cf6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 12c.94-2.08 2.3-4 4.5-5 2.8-1.3 6-1 9 2 2 3 2.3 6.2 1 9-1 2.2-3 3.5-5 4.5-3 1.3-6 1-9-2" />
          <path d="M17 12h.01" />
          <path d="M2 16.5c1-1.5 2.5-2 4-2" />
          <path d="M2 7.5c1 1.5 2.5 2 4 2" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
