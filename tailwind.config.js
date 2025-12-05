/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // --- ENIGMA PROTOCOL PALETTE (Green/Teal/Black) ---
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6', // Teal
          700: '#0F766E',
          900: '#134E4A',
        },
        accent: {
          400: '#5FFAD0', // Highlight glow
          500: '#00E0D0', // MAIN BRAND COLOR (The Enigma Green)
          600: '#00B3A6', 
          900: '#00423D', 
        },
        neutral: {
          0: '#000000',
          50: '#040F0D', // Tinted Black
          100: '#0A1412',
          200: '#162120',
          300: '#A3A3A3',
          400: '#525252',
        },
        background: {
          page: '#000202', // Deepest Black
          surface: '#050A0A', // Card Backgrounds
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#A3A3A3',
          tertiary: '#525252',
          muted: '#262626'
        },
        semantic: {
          success: '#10B981', // Green
          danger: '#EF4444',  // Red
          warning: '#F59E0B', // Yellow
        },
        border: {
          subtle: 'rgba(0, 224, 208, 0.1)',
          moderate: 'rgba(0, 224, 208, 0.2)',
          strong: 'rgba(0, 224, 208, 0.5)'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'], // Enigma Heading Font
        body: ['"Inter"', 'sans-serif'],            // Enigma Body Font
        mono: ['"JetBrains Mono"', 'monospace'],    // Code/Terminal Font
      },
      backgroundImage: {
        'gradient-hero': 'radial-gradient(circle at center, rgba(0, 224, 208, 0.08) 0%, #000202 70%)',
        'gradient-card': 'linear-gradient(180deg, rgba(5, 10, 10, 0.9) 0%, rgba(0, 0, 0, 0.9) 100%)',
        'grid-pattern': 'linear-gradient(rgba(0,224,208,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,224,208,0.05) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 224, 208, 0.5), 0 0 40px rgba(0, 224, 208, 0.2)',
        'glow-sm': '0 0 10px rgba(0, 224, 208, 0.3)',
        'card': '0 0 1px rgba(0, 224, 208, 0.5), inset 0 0 20px rgba(0, 224, 208, 0.05)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}