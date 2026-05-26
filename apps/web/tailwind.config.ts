import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Paleta principal marrom/amarelo
        brown: {
          50:  '#FDF8F0',
          100: '#FAF0DC',
          200: '#F5DCB3',
          300: '#EEC17A',
          400: '#E5A44A',
          500: '#C17A4A',
          600: '#8B4513',
          700: '#6B3410',
          800: '#4A2010',
          900: '#2D1B0E',
          950: '#1C0F07',
        },
        amber: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Alias semânticos
        primary: {
          DEFAULT: '#8B4513',
          light: '#C17A4A',
          dark: '#4A2010',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
          foreground: '#1C0F07',
        },
        sidebar: {
          bg: '#1C0F07',
          hover: '#2D1B0E',
          active: '#4A2010',
          border: '#3D1F0D',
          text: '#E8D5C4',
          muted: '#A08060',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        pulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.5' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
