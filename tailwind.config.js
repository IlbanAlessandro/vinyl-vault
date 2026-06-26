/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        vinyl: {
          black: '#080808',
          dark: '#111111',
          card: '#161616',
          border: '#2a2a2a',
          muted: '#3a3a3a',
          text: '#c8c8c8',
          red: '#dc2626',
          'red-dark': '#991b1b',
          'red-glow': '#ff3333',
        }
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(220, 38, 38, 0.4)',
        'red-glow-sm': '0 0 10px rgba(220, 38, 38, 0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
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
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(220,38,38,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(220,38,38,0.6)' },
        }
      }
    },
  },
  plugins: [],
}
