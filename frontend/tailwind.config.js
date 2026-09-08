/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Premium Brand Tokens
        midnight: '#0B1220',
        deepNavy: '#111827',
        slateNavy: '#1E293B',
        emeraldBrand: {
          DEFAULT: '#10B981',
          hover: '#047857',
          light: '#34D399',
          muted: 'rgba(16, 185, 129, 0.12)',
        },
        champagne: {
          DEFAULT: '#D4AF6A',
          hover: '#C29C57',
          light: '#E2C288',
          border: 'rgba(212, 175, 106, 0.22)',
          muted: 'rgba(212, 175, 106, 0.12)',
        },
        ivory: '#F8F5ED',
        softSlate: '#CBD5E1',
        mutedSlate: '#94A3B8',
        slateDark: '#64748B',
        // Semantic status tokens
        statusSuccess: '#22C55E',
        statusWarning: '#F59E0B',
        statusError: '#EF4444',
        statusInfo: '#38BDF8',
      },
      borderRadius: {
        xl: '1rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
