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
        // Dark Navy Pulse Theme Colors
        navy: {
          deepest: '#0a0e27',
          deep: '#0f1419',
          elevated: '#1a1f3a',
          hover: '#1e2847',
          accent: {
            dark: '#243154'
          }
        },
        cyan: {
          electric: '#00d4ff',
          teal: '#06b6d4'
        },
        blue: {
          vibrant: '#0ea5e9',
          light: '#38bdf8'
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#cbd5e1',
          tertiary: '#94a3b8',
          muted: '#64748b'
        },
        semantic: {
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b'
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          moderate: 'rgba(255, 255, 255, 0.12)',
          accent: 'rgba(6, 182, 212, 0.3)'
        },
        // Keep existing variables for compatibility
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0ea5e9',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: '#06b6d4',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: '#00d4ff',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)',
        'gradient-card': 'linear-gradient(180deg, #1a1f3a 0%, #151a30 100%)',
        'gradient-button': 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.5)',
        'modal': '0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 60px rgba(0, 0, 0, 0.7)',
        'glow-cyan-sm': '0 0 12px rgba(0, 212, 255, 0.4)',
        'glow-cyan-md': '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)',
        'glow-cyan-lg': '0 0 30px rgba(0, 212, 255, 0.6), 0 0 60px rgba(0, 212, 255, 0.4), 0 0 90px rgba(0, 212, 255, 0.2)',
        'glow-blue': '0 0 20px rgba(14, 165, 233, 0.5)',
        'glow-green': '0 0 16px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 16px rgba(239, 68, 68, 0.4)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'var(--radius)',
        sm: 'var(--radius)',
      },
      fontFamily: {
        primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: "'Space Grotesk', 'Inter', sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', monospace",
      },
      fontSize: {
        hero: '56px',
        h1: '40px',
        h2: '32px',
        h3: '24px',
        'body-lg': '18px',
        body: '16px',
        small: '14px',
        xs: '12px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'pulse-glow': { // For the Waveform
          '0%, 100%': { 
            opacity: '0.7',
            filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.4))'
          },
          '50%': { 
            opacity: '1',
            filter: 'drop-shadow(0 0 40px rgba(0, 212, 255, 0.8))'
          }
        },
        'wavefloat': { // For the Waveform
          '0%, 100%': { transform: 'translateX(-20px) translateY(-5px)' },
          '50%': { transform: 'translateX(20px) translateY(5px)' },
        },
        'glow-float-1': { // For the Background
          '0%, 100%': { opacity: '0.05', transform: 'translateY(0px)' },
          '50%': { opacity: '0.15', transform: 'translateY(-15px)' },
        },
        'glow-float-2': { // For the Background
          '0%, 100%': { opacity: '0.05', transform: 'translateY(0px)' },
          '50%': { opacity: '0.15', transform: 'translateY(10px)' },
        },
        'glow-float-3': { // For the Background
          '0%, 100%': { opacity: '0.05', transform: 'translateY(0px)' },
          '50%': { opacity: '0.15', transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'wavefloat': 'wavefloat 3s ease-in-out infinite',
        'glow-float-1': 'glow-float-1 3s ease-in-out infinite alternate',
        'glow-float-2': 'glow-float-2 1s ease-in-out infinite alternate',
        'glow-float-3': 'glow-float-3 2s ease-in-out infinite alternate',
      },
      transitionDuration: {
        fast: '150ms',
        standard: '250ms',
        slow: '350ms',
      },
      transitionTimingFunction: {
        default: 'ease-out',
        sharp: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        smooth: 'ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}