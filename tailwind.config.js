/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern dark theme colors
        'dark': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        'cyber': {
          50: '#E0F7FF',
          100: '#B3ECFF',
          200: '#80E0FF',
          300: '#4DD4FF',
          400: '#00E1FF',
          500: '#00BFDD',
          600: '#0099BB',
          700: '#007399',
          800: '#004D77',
          900: '#002744',
        },
        'neon': {
          blue: '#00E1FF',
          purple: '#A855F7',
          pink: '#FF2D78',
          orange: '#FF8B5E',
          yellow: '#FFD700',
          green: '#05FFA1',
          red: '#FF3860',
        },
        // Enhanced blue/purple gradient colors
        'gradient': {
          'primary-start': '#0066FF',
          'primary-end': '#00E1FF',
          'accent-start': '#A855F7',
          'accent-end': '#FF2D78',
          'card-start': '#1A1F3A',
          'card-end': '#0F172A',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'space-gradient': 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
        'gradient-primary': 'linear-gradient(135deg, #0066FF 0%, #00E1FF 100%)',
        'gradient-accent': 'linear-gradient(135deg, #A855F7 0%, #FF2D78 100%)',
        'gradient-card': 'linear-gradient(135deg, #1A1F3A 0%, #0F172A 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0A0B14 0%, #10121E 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 225, 255, 0.1)',
        'neon-sm': '0 0 10px rgba(0, 225, 255, 0.3)',
        'neon-md': '0 0 20px rgba(0, 225, 255, 0.4)',
        'neon-lg': '0 0 40px rgba(0, 225, 255, 0.5)',
        'card-glow': '0 0 20px rgba(0, 225, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 225, 255, 0.15)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      spacing: {
        'sidebar-expanded': '280px',
        'sidebar-collapsed': '80px',
      },
      transitionDuration: {
        'sidebar': '300ms',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 225, 255, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 225, 255, 0.25)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}