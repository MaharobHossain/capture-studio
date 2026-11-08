/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00E632',
          hover: '#00C92C',
          light: '#26FF55',
          dark: '#00A824',
          glow: 'rgba(0, 230, 50, 0.25)',
        },
        surface: {
          bg: '#090B09',
          secondary: '#101310',
          card: '#141814',
          elevated: '#1A201A',
          hover: '#222A22',
        },
        border: {
          DEFAULT: '#283128',
          subtle: '#1C231C',
          bright: '#3D4B3D',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A3ADA4',
          muted: '#6F796F',
        },
        status: {
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#00E632',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'brand-glow': '0 0 20px -2px rgba(0, 230, 50, 0.35)',
        'brand-glow-lg': '0 0 35px -5px rgba(0, 230, 50, 0.45)',
        'card-dark': '0 8px 30px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}

