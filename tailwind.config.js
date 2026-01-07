/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Premium Dark Enterprise Theme
        'app': {
          'primary': '#020203',
          'secondary': '#07070B',
        },
        'card': {
          'primary': '#111115',
          'secondary': '#16161B',
          'inner': '#1B1B21',
          'border': '#26262C',
          'border-hover': '#3A3A42',
        },
        'text': {
          'primary': '#D6D7DC',
          'body': '#E6E7EB',
          'secondary': '#9A9BA1',
          'muted': '#7C7D84',
          'disabled': '#5A5B60',
        },
        'accent': {
          'primary': '#CAD2FD',
          'hover': '#E0E4FF',
        },
        'icon': {
          'default': '#8A8B91',
          'active': '#CAD2FD',
        },
        'input': {
          'bg': '#0F0F14',
          'border': '#26262C',
          'focus': '#CAD2FD',
          'placeholder': '#5A5B60',
        },
        'hover': {
          'overlay': 'rgba(255,255,255,0.03)',
        },
        'active': {
          'bg': '#1F1F26',
          'border': '#44444D',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'app-gradient': 'linear-gradient(135deg, #020203 0%, #07070B 100%)',
        'card-gradient': 'linear-gradient(135deg, #111115 0%, #16161B 100%)',
      },
      boxShadow: {
        'card': '0 0 0 1px #26262C, 0 12px 40px rgba(0,0,0,0.65)',
        'card-hover': '0 0 0 1px #3A3A42, 0 12px 40px rgba(0,0,0,0.65)',
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
      transitionTimingFunction: {
        'enterprise': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'subtle-glow': {
          '0%, 100%': { boxShadow: '0 0 0 1px #26262C' },
          '50%': { boxShadow: '0 0 0 1px #3A3A42' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'subtle-glow': 'subtle-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
