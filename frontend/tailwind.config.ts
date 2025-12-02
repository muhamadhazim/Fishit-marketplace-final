import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        mythicGold: '#d4af37',
        neonGreen: '#39ff14',
        deepSea: '#0b1220',
        roblox: {
          dark: '#232527',
          card: '#393B3D',
          header: '#191B1D',
          text: '#FFFFFF',
          textSecondary: '#BDC1C6',
          green: '#00b06f',
          blue: '#0074BD',
        },
        // Web3 Theme Colors
        web3: {
          bg: {
            primary: '#0A0E27',
            secondary: '#0F1629',
            card: 'rgba(15, 23, 42, 0.6)',
            glass: 'rgba(255, 255, 255, 0.05)',
          },
          accent: {
            cyan: '#00D4FF',
            purple: '#9333EA',
            green: '#10B981',
            pink: '#EC4899',
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#94A3B8',
            muted: '#64748B',
          },
          border: {
            default: 'rgba(148, 163, 184, 0.1)',
            light: 'rgba(255, 255, 255, 0.1)',
          }
        }
      },
      boxShadow: {
        secret: '0 0 20px rgba(220, 38, 38, 0.35)',
        mythic: '0 0 20px rgba(212, 175, 55, 0.35)',
        neon: '0 0 20px rgba(57, 255, 20, 0.35)',
        roblox: '0 4px 6px rgba(0, 0, 0, 0.3)',
        // Web3 Glow Effects
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2)',
        'glow-purple': '0 0 20px rgba(147, 51, 234, 0.4), 0 0 40px rgba(147, 51, 234, 0.2)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)',
      },
      fontFamily: {
        sans: ['"HCo GothamSsm"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.6), 0 0 60px rgba(0, 212, 255, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
